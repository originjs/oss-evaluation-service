import { GitcodeProjectsTable, logger } from '@orginjs/oss-evaluation-data-model';
import { normalizeTime, platformTypes } from '@orginjs/oss-evaluation-util';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

// GitCode REST API (Gitee v5 兼容)
const GITCODE_API = 'https://api.gitcode.com/api/v5';
// 整合的数据类型：1 = 用于先进性评估的来源软件（与 view_projects 的 data_type = 1 对齐）
const DATA_TYPE_GENERAL = 1;
const DEFAULT_PER_PAGE = 100;
// 安全上限，避免分页逻辑异常时无限循环
const MAX_PAGES = 200;

/**
 * 读取第一个可用的 GitCode token（GITCODE_TOKEN 是 JSON 数组字符串）。
 * GitCode 详情接口要求 `private-token` 头，没有 token 时返回 null。
 */
function getGitcodeToken() {
  try {
    const tokens = JSON.parse(process.env.GITCODE_TOKEN || '[]');
    return Array.isArray(tokens) && tokens.length > 0 ? tokens[0] : null;
  } catch (e) {
    logger.warn(`GITCODE_TOKEN 解析失败，按无 token 处理: ${e.message}`);
    return null;
  }
}

/**
 * 拉取某个组织下的一页仓库列表。
 * 组织列表接口公开，无需 token。
 *
 * @param {string} org 组织 path，例如 openharmony
 * @param {number} page 页码，从 1 开始
 * @param {number} perPage 每页数量
 * @returns {Promise<{repos: any[], totalPage: number}>}
 */
async function fetchOrgReposPage(org, page, perPage) {
  const url = `${GITCODE_API}/orgs/${encodeURIComponent(org)}/repos?page=${page}&per_page=${perPage}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'oss-evaluation-integration' },
  });
  if (!response.ok) {
    logger.error(`Fetch GitCode org repos failed: ${response.status} ${url}`);
    return { repos: [], totalPage: 0 };
  }
  const repos = await response.json();
  const totalPage = Number(response.headers.get('total_page')) || 0;
  return { repos: Array.isArray(repos) ? repos : [], totalPage };
}

/**
 * 把组织列表项映射成 gitcode_projects_t 的字段。
 * 列表项已包含基础信息，无需 token。
 */
function parseOrgRepo(item) {
  const ownerPath = item.namespace?.path || '';
  // 列表接口的 full_name 形如 "OpenHarmony / device_soc_unisoc"（带空格），
  // 统一改为与 html_url 一致的 "owner/repo" 形式。
  const fullName = ownerPath ? `${ownerPath}/${item.path}` : item.path;
  return {
    id: item.id,
    platformType: platformTypes.GITCODE,
    name: item.path || item.name,
    fullName,
    htmlUrl: item.html_url,
    description: item.description?.slice(0, 500),
    privateFlag: String(item.private),
    ownerName: ownerPath || item.namespace?.name,
    forkFlag: String(item.fork),
    createdAt: normalizeTime(item.created_at),
    updatedAt: normalizeTime(item.updated_at),
    pushedAt: normalizeTime(item.pushed_at),
    stargazersCount: item.stargazers_count,
    watchersCount: item.watchers_count,
    language: item.language,
    forksCount: item.forks_count,
    openIssuesCount: item.open_issues_count,
    defaultBranch: item.default_branch,
    ownerHtmlUrl: item.namespace?.html_url,
    visibility: item.public ? 'public' : 'private',
    dataType: DATA_TYPE_GENERAL,
    recordDesc: 'gitcodeOrg',
  };
}

/**
 * 调用单仓详情接口补充 license / clone_url 等列表里没有的字段。
 * 详情接口要求 private-token 头，没有有效 token 时返回 {}（跳过补充）。
 */
async function fetchRepoDetail(ownerName, name, token) {
  if (!token) {
    return {};
  }
  const url = `${GITCODE_API}/repos/${ownerName}/${name}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'oss-evaluation-integration',
        'private-token': token,
      },
    });
    if (!response.ok) {
      logger.info(`GitCode repo detail ${ownerName}/${name} -> ${response.status}, 跳过补充`);
      return {};
    }
    const detail = await response.json();
    return {
      license: detail.license,
      gitUrl: detail.git_url,
      cloneUrl: detail.clone_url,
      sshUrl: detail.ssh_url || detail.ssh_url_to_repo,
      homePage: detail.homepage,
      ownerAvatarUrl: detail.owner?.avatar_url || detail.namespace?.avatar_url,
      size: detail.size,
    };
  } catch (e) {
    logger.info(`GitCode repo detail ${ownerName}/${name} 异常，跳过补充: ${e.message}`);
    return {};
  }
}

/**
 * 批量写入 / 更新 gitcode_projects_t。
 */
async function saveProjects(projects) {
  if (!projects.length) {
    return 0;
  }
  // 除主键 id 外的字段都允许在重复时更新
  const updateOnDuplicate = Object.keys(projects[0]).filter(field => field !== 'id');
  const result = await GitcodeProjectsTable.bulkCreate(projects, { updateOnDuplicate });
  return result.length;
}

/**
 * 抓取整个组织的仓库并入库。
 *
 * @param {object} options
 * @param {string} options.org 组织 path，默认 openharmony
 * @param {number} [options.perPage]
 * @param {boolean} [options.withDetail] 是否调用详情接口补充字段（需要 GITCODE_TOKEN）
 * @returns {Promise<{org: string, total: number, saved: number, pages: number, detailEnriched: boolean}>}
 */
export async function syncGitcodeOrgProjects(options = {}) {
  const org = options.org || 'openharmony';
  const perPage = options.perPage || DEFAULT_PER_PAGE;
  const withDetail = Boolean(options.withDetail);
  const token = withDetail ? getGitcodeToken() : null;
  if (withDetail && !token) {
    logger.warn('withDetail=true 但没有可用的 GITCODE_TOKEN，将跳过详情补充');
  }

  let page = 1;
  let totalFetched = 0;
  let totalSaved = 0;
  // eslint-disable-next-line no-constant-condition
  while (page <= MAX_PAGES) {
    const { repos, totalPage } = await fetchOrgReposPage(org, page, perPage);
    if (!repos.length) {
      break;
    }
    const projects = repos.map(parseOrgRepo);

    if (token) {
      // 串行补充详情，避免触发频控
      for (const project of projects) {
        const extra = await fetchRepoDetail(project.ownerName, project.name, token);
        Object.assign(project, extra);
      }
    }

    const saved = await saveProjects(projects);
    totalFetched += repos.length;
    totalSaved += saved;
    logger.info(
      `[GitCodeOrg] org=${org} page=${page} fetched=${repos.length} saved=${saved} totalSaved=${totalSaved}`,
    );

    if (repos.length < perPage || (totalPage && page >= totalPage)) {
      break;
    }
    page += 1;
  }

  return {
    org,
    total: totalFetched,
    saved: totalSaved,
    pages: page,
    detailEnriched: Boolean(token),
  };
}

/**
 * 定时任务调度入口：默认同步 OpenHarmony 组织。
 * 不带 detail（详情接口需要 GITCODE_TOKEN），定时跑只取列表里的基础信息。
 */
async function gitcodeOrgProjectsScheduler() {
  const startTime = process.hrtime();
  logger.info('[Integration][GitcodeOrg] Integration Job start');
  const result = await syncGitcodeOrgProjects({ org: 'openharmony' });
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][GitcodeOrg] done org=${result.org} fetched=${result.total} saved=${result.saved}, cost ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

// 接入定时任务监控（写入 schedule_task_monitor 表）
export const gitcodeOrgProjectsTimer = addMonitoringToTask(
  gitcodeOrgProjectsScheduler,
  'gitcodeOrgProjectsTimer',
  'gitcodeOrgProjectsTimer',
);

export async function syncGitcodeOrgProjectsHandler(req, res) {
  const { org, perPage, withDetail } = req.body || {};
  try {
    const result = await syncGitcodeOrgProjects({ org, perPage, withDetail });
    res.status(200).json(result);
  } catch (e) {
    logger.error(`syncGitcodeOrgProjects failed: ${e.stack || e.message}`);
    res.status(500).json({ message: e.message });
  }
}
