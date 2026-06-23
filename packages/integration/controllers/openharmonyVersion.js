import { GitcodeProjectsTable, logger } from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';
import { sleep } from '../util/util.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';
import { syncGitcodeOrgProjects } from './gitcodeOrg.js';

const GITCODE_API = 'https://api.gitcode.com/api/v5';
// 每个仓库 tags 请求之间的间隔，避免触发频控
const REQUEST_INTERVAL_MS = 200;
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
 * 拉取单个仓库的 tags。tags 接口公开，无需 token。
 */
async function fetchRepoTags(owner, repo) {
  const url = `${GITCODE_API}/repos/${owner}/${repo}/tags`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'oss-evaluation-integration' },
  });
  if (!response.ok) {
    logger.info(`GitCode tags ${owner}/${repo} -> ${response.status}, 跳过`);
    return [];
  }
  const tags = await response.json();
  return Array.isArray(tags) ? tags : [];
}

/**
 * 处理单个仓库：拉 tags -> 收集 >= v6.0 的 release 大版本 -> 以 JSON 数组写回
 * gitcode_projects_t.openharmony_version（OH 专用字段）。
 * 没有符合条件的版本时写 null（清掉旧值，保证幂等）。
 *
 * @returns {Promise<string[]>} 写入的版本数组
 */
async function syncSingleRepo(repo, includePreRelease) {
  const owner = repo.ownerName;
  const name = repo.name;
  if (!owner || !name) {
    return [];
  }
  const tags = await fetchRepoTags(owner, name);
  const versions = collectMajorVersions(tags, includePreRelease);

  await GitcodeProjectsTable.update(
    { openharmonyVersion: versions.length ? versions : null },
    { where: { id: Number(repo.id) } },
  );
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
  const queryOptions = {
    where,
    attributes: ['id', 'pId', 'fullName', 'name', 'ownerName'],
  };
  if (limit) {
    queryOptions.limit = limit;
  }
  const repos = await GitcodeProjectsTable.findAll(queryOptions);

  let matched = 0;
  let processed = 0;
  for (const repo of repos) {
    try {
      const versions = await syncSingleRepo(repo, includePreRelease);
      if (versions.length) {
        matched += 1;
        logger.info(`[OHVersion] ${repo.fullName} -> ${versions.join(',')}`);
      }
    } catch (e) {
      logger.error(`[OHVersion] ${repo.fullName} 处理失败: ${e.message}`);
    }
    processed += 1;
    if (processed < repos.length) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  return {
    repos: repos.length,
    matched,
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
