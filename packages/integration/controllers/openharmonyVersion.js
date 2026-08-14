import { GitcodeProjectsTable, logger, UnifiedProjects } from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';
import { sleep, getValidToken } from '../util/util.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';
import { syncGitcodeOrgProjects } from './gitcodeOrg.js';

const GITCODE_API = 'https://api.gitcode.com/api/v5';
// 每个仓库 tags 请求之间的间隔，避免触发频控；有 token 时限频更宽，可显著缩短
const REQUEST_INTERVAL_MS = 200;
const REQUEST_INTERVAL_WITH_TOKEN_MS = 30;
// tags 接口单页数量
const TAGS_PER_PAGE = 100;
// 单仓库 tags 翻页安全上限，避免分页异常时无限循环
const TAGS_MAX_PAGES = 100;
// 数据库分批游标大小：每次只 load 这么多仓库进内存
const DB_BATCH_SIZE = 200;
// 只记录 >= 该大版本的鸿蒙 release（v6.0 及以后）
const MIN_MAJOR_VERSION = 6;

/**
 * 解析单个 tag，提取鸿蒙大版本（前两位数字）。
 *
 * 规则：
 *  - 只认 OpenHarmony-v<版本>-Release 形式的发布版本（默认）；
 *  - 大版本只取前两位，如 v6.0.0.1 / v6.0.0.2 都归到 v6.0；
 *  - includePreRelease=true 时额外接受 -Beta / -RC 等预发布 tag。
 *
 * @param {string} tagName tag 名，如 OpenHarmony-v6.0.0.2-Release
 * @param {boolean} includePreRelease 是否接受预发布 tag
 * @returns {{major: number, minor: number, majorVersion: string, releaseName: string} | null}
 */
export function parseOpenHarmonyTag(tagName, includePreRelease = false) {
  if (!tagName) {
    return null;
  }
  const suffix = includePreRelease ? '(?:-Release|-Beta\\d*|-RC\\d*)' : '-Release';
  const regex = new RegExp(`^OpenHarmony-v(\\d+)\\.(\\d+)[\\d.]*${suffix}$`, 'i');
  const match = tagName.match(regex);
  if (!match) {
    return null;
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const majorVersion = `v${major}.${minor}`;
  return {
    major,
    minor,
    majorVersion,
    releaseName: `OpenHarmony-${majorVersion}-Release`,
  };
}

/**
 * 从一个仓库的 tags 列表里收集所有 >= v6.0 的鸿蒙大版本（去重）。
 * 每个版本格式为 vX.Y-release（小写），按版本号从新到旧排序。
 *
 * @param {Array} tags GitCode tags 接口返回的数组
 * @param {boolean} includePreRelease 是否纳入 Beta/RC（默认 false）
 * @returns {string[]} 如 ["v6.1-release","v6.0-release"]，无匹配返回 []
 */
export function collectMajorVersions(tags, includePreRelease = false) {
  const versionMap = new Map();
  for (const tag of tags) {
    const parsed = parseOpenHarmonyTag(tag.name, includePreRelease);
    if (!parsed || parsed.major < MIN_MAJOR_VERSION) {
      continue;
    }
    // 用 major.minor 去重
    versionMap.set(parsed.majorVersion, { major: parsed.major, minor: parsed.minor });
  }
  return [...versionMap.values()]
    .sort((a, b) => b.major - a.major || b.minor - a.minor)
    .map(v => `v${v.major}.${v.minor}-release`);
}

/**
 * 从一条仓库记录解析出 GitCode 请求路径（owner/repo）。
 *
 * 优先用 full_name：它和查询条件 where.fullName 同源，能避免 owner_name / name
 * full_name 缺失或不含 '/' 时回退到 owner_name/name 拼接。
 *
 * 兼容历史数据里 "owner / repo"（带空格）的写法，统一去空格。
 *
 * @param {{fullName?: string, ownerName?: string, name?: string}} repo
 * @returns {string|null} 形如 "openharmony/arkui_ace_engine"，无法解析返回 null
 */
function resolveRepoPath(repo) {
  const fullName = (repo.fullName || '').trim();
  if (fullName.includes('/')) {
    const segments = fullName
      .split('/')
      .map(s => s.trim())
      .filter(Boolean);
    if (segments.length >= 2) {
      return segments.join('/');
    }
  }
  if (repo.ownerName && repo.name) {
    return `${repo.ownerName}/${repo.name}`;
  }
  return null;
}

/**
 * 拉取单个仓库的全部 tags（翻页）。tags 接口公开，无需 token；
 * 但带 token 时限频更宽，可去掉翻页间隔、加快抓取。
 *
 * GitCode tags 接口分页（默认单页较小），且返回顺序不保证按时间倒序，
 * 必须翻完所有页才能收集到全部 >= v6.0 的 release tag，否则会漏版本。
 *
 * @param {string} repoPath 仓库路径（owner/repo），来自 full_name
 * @param {string|null} [token] 有 token 时附带 private-token 头并跳过翻页间隔
 */
async function fetchRepoTags(repoPath, token = null) {
  const headers = { 'User-Agent': 'oss-evaluation-integration' };
  if (token) {
    headers['private-token'] = token;
  }
  const all = [];
  let failed = false;
  for (let page = 1; page <= TAGS_MAX_PAGES; page += 1) {
    let response;
    try {
      const url = `${GITCODE_API}/repos/${repoPath}/tags?page=${page}&per_page=${TAGS_PER_PAGE}`;
      response = await fetch(url, { headers });
    } catch (e) {
      logger.info(`GitCode tags ${repoPath} page=${page} 请求异常: ${e.message}`);
      failed = true;
      break;
    }
    if (!response.ok) {
      logger.info(`GitCode tags ${repoPath} page=${page} -> ${response.status}, 跳过`);
      // 非 2xx 视为抓取失败（可能限频/出错），标记后停止，避免误判“无匹配版本”
      failed = true;
      break;
    }
    const tags = await response.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      break;
    }
    all.push(...tags);
    if (tags.length < TAGS_PER_PAGE) {
      break;
    }
    // 翻页之间加间隔避免频控；有 token 时限频更宽，无需等待
    if (page < TAGS_MAX_PAGES && !token) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }
  return { tags: all, failed };
}

/**
 * 处理单个仓库：拉 tags -> 收集 >= v6.0 的 release 大版本 -> 以 JSON 数组写回
 * gitcode_projects_t.openharmony_version（OH 专用字段）。
 *
 * 幂等清空只在“成功抓取且确实无匹配版本”时执行（写 null）；
 * 若抓取失败（限频/网络/接口错误），保留旧值不更新，避免把已有版本误清成 null。
 *
 * @returns {Promise<string[]>} 写入的版本数组
 */
async function syncSingleRepo(repo, includePreRelease, token = null) {
  // 用 full_name 解析请求路径，避免 owner_name 脏数据导致请求错仓库
  const repoPath = resolveRepoPath(repo);
  if (!repoPath) {
    return [];
  }
  const { tags, failed } = await fetchRepoTags(repoPath, token);
  const versions = collectMajorVersions(tags, includePreRelease);

  if (versions.length) {
    // 拿到匹配版本，正常写回
    await UnifiedProjects.update(
      { openharmonyVersion: versions },
      { where: { pId: repo.pId } },
    );
  } else if (!failed) {
    // 成功抓取但无匹配版本：写空数组而非 null。
    // 全量时 null 与数组共用同一条预处理语句，会触发 MySQL 8（<8.0.39）JSON 列
    // "Cannot create a JSON value from a string with CHARACTER SET 'binary'" 的 bug；
    // 统一写非空 JSON（[] 表示“已处理但无 >=v6 版本”）即可规避。
    await UnifiedProjects.update(
      { openharmonyVersion: [] },
      { where: { pId: repo.pId } },
    );
  } else {
    // 抓取失败，保留旧值
    logger.info(`[OHVersion] ${repoPath} tags 抓取失败，保留原值`);
  }
  return versions;
}

/**
 * 批量解析 OpenHarmony 仓库适配的最新鸿蒙大版本，写回 gitcode_projects_t。
 *
 * 默认只处理 OpenHarmony 组织（ownerName='openharmony'）下的仓库，
 * 避免把 gitcode_projects_t 里其他来源的 GitCode 仓库也拿来请求 tags、
 * 并在无匹配时误把它们的 openharmonyVersion 清成 null。
 *
 * @param {object} options
 * @param {string} [options.org] 组织 path，默认 openharmony；传 repoFullName 时忽略
 * @param {string} [options.repoFullName] 只处理单个仓库（owner/repo），用于测试
 * @param {number} [options.limit] 最多处理多少个仓库（不传则全量）
 * @param {boolean} [options.includePreRelease] 是否纳入 Beta/RC 预发布版本
 * @returns {Promise<{repos: number, matched: number, includePreRelease: boolean}>}
 */
export async function syncOpenHarmonyCompatibility(options = {}) {
  const { org = 'openharmony', repoFullName, limit, includePreRelease = false } = options;

  const where = { platformType: platformTypes.GITCODE };
  if (repoFullName) {
    where.fullName = repoFullName;
  } else {
    // 只限定在 OpenHarmony 组织内的仓库
    where.ownerName = org;
  }

  // 解析一次 GitCode token（无 token 不影响功能，仅会更慢）；有 token 时限频更宽，缩短间隔
  let token = null;
  try {
    token = await getValidToken(platformTypes.GITCODE);
  } catch (e) {
    logger.warn(`[OHVersion] 获取 GitCode token 失败，按无 token 处理: ${e.message}`);
  }
  const intervalMs = token ? REQUEST_INTERVAL_WITH_TOKEN_MS : REQUEST_INTERVAL_MS;

  // 分批游标遍历，避免一次性把整个组织（可能上千仓库）load 进内存
  let matched = 0;
  let processed = 0;
  let offset = 0;
  for (;;) {
    const remaining = limit ? limit - processed : Number.POSITIVE_INFINITY;
    if (remaining <= 0) {
      break;
    }
    const batchSize = Math.min(DB_BATCH_SIZE, remaining);
    const repos = await GitcodeProjectsTable.findAll({
      where,
      attributes: ['id', 'pId', 'fullName', 'name', 'ownerName'],
      order: [['id', 'ASC']],
      limit: batchSize,
      offset,
    });
    if (repos.length === 0) {
      break;
    }
    for (const repo of repos) {
      if (processed > 0) {
        // 控制请求节奏，避免触发频控
        await sleep(intervalMs);
      }
      try {
        const versions = await syncSingleRepo(repo, includePreRelease, token);
        if (versions.length) {
          matched += 1;
          logger.info(`[OHVersion] ${repo.fullName} -> ${versions.join(',')}`);
        }
      } catch (e) {
        logger.error(`[OHVersion] ${repo.fullName} 处理失败: ${e.message}`);
      }
      processed += 1;
    }
    offset += repos.length;
    if (repos.length < batchSize) {
      break;
    }
  }

  return {
    repos: processed,
    matched,
    hasToken: Boolean(token),
    includePreRelease: Boolean(includePreRelease),
  };
}

/**
 * 定时任务调度入口（单任务）：
 *  1. 同步 OpenHarmony 组织仓库到 gitcode_projects_t；
 *  2. 解析各仓库 tags，写回适配的鸿蒙大版本。
 * 两步顺序执行，保证版本解析基于最新的仓库列表。
 */
async function openharmonyScheduler() {
  const startTime = process.hrtime();
  logger.info('[Integration][OpenHarmony] Integration Job start');

  const orgResult = await syncGitcodeOrgProjects({ org: 'openharmony' });
  logger.info(
    `[Integration][OpenHarmony] org synced org=${orgResult.org} fetched=${orgResult.total} saved=${orgResult.saved}`,
  );

  const versionResult = await syncOpenHarmonyCompatibility({ org: 'openharmony' });
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][OpenHarmony] done repos=${versionResult.repos} matched=${versionResult.matched}, cost ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

export const openharmonyTimer = addMonitoringToTask(
  openharmonyScheduler,
  'openharmonyTimer',
  'openharmonyTimer',
);

export async function syncOpenHarmonyCompatibilityHandler(req, res) {
  const { org, repoFullName, limit, includePreRelease } = req.body || {};
  try {
    const result = await syncOpenHarmonyCompatibility({ org, repoFullName, limit, includePreRelease });
    res.status(200).json(result);
  } catch (e) {
    logger.error(`syncOpenHarmonyCompatibility failed: ${e.stack || e.message}`);
    res.status(500).json({ message: e.message });
  }
}
