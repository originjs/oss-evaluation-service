import { UnifiedProjects, logger } from '@orginjs/oss-evaluation-data-model';
import { normalizeTime, platformTypes } from '@orginjs/oss-evaluation-util';
import { getValidToken } from '../util/util.js';

// GitCode REST API (Gitee v5 兼容)
const GITCODE_API = 'https://api.gitcode.com/api/v5';
// 整合的数据类型：1 = 用于先进性评估的来源软件（与 view_projects 的 data_type = 1 对齐）
const DATA_TYPE_GENERAL = 1;
const DEFAULT_PER_PAGE = 100;
// GitCode/Gitee per_page 上限
const MAX_PER_PAGE = 100;
// 安全上限，避免分页逻辑异常时无限循环
const MAX_PAGES = 200;
// 合法组织 path 格式（字母数字、-、_、.）
const ORG_PATTERN = /^[\w.-]+$/;
// description 列为 STRING(512)，按模型长度截断
const DESCRIPTION_MAX_LEN = 512;

/**
 * GitCode/Gitee v5 详情接口的 license 多为字符串 key；
 * 若返回 GitHub 风格对象（{key,name,spdx_id}），取其中的标识，避免写成 "[object Object]"。
 */
function normalizeLicense(license) {
  if (license && typeof license === 'object') {
    return license.key || license.spdx_id || license.name || null;
  }
  return license;
}

/**
 * 拉取某个组织下的一页仓库列表。
 * 组织列表接口公开，无需 token。
 *
 * 注：total_page 是 Gitee/GitCode 的非标准响应头，接口不一定返回；
 * 拿不到时 totalPage 为 0，分页主要依赖 repos.length < perPage 兜底。
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
  // 兼容可能的不同大小写/命名
  const totalPageHeader =
    response.headers.get('total_page') || response.headers.get('Total-Page');
  const totalPage = Number(totalPageHeader) || 0;
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
    pId: `${platformTypes.GITCODE}#${item.id}`,
    id: item.id,
    platformType: platformTypes.GITCODE,
    name: item.path || item.name,
    fullName,
    htmlUrl: item.html_url,
    description: item.description?.slice(0, DESCRIPTION_MAX_LEN),
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
      license: normalizeLicense(detail.license),
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
 * 批量写入 / 更新 UnifiedProjects。
 */
async function saveProjects(projects) {
  if (!projects.length) {
    return 0;
  }
  const excludedFields = ['pId', 'id', 'platformType'];
  const updateOnDuplicate = Object.keys(projects[0]).filter(
    field => !excludedFields.includes(field),
  );
  const result = await UnifiedProjects.bulkCreate(projects, { updateOnDuplicate });
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
  // 复用统一的 token 管理（带缓存、有效性校验、多 token 轮换）
  const token = withDetail ? await getValidToken(platformTypes.GITCODE) : null;
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

export async function syncGitcodeOrgProjectsHandler(req, res) {
  const body = req.body || {};
  // 在系统边界做输入校验，避免异常值触发大量请求
  let org = 'openharmony';
  if (body.org !== undefined) {
    if (typeof body.org !== 'string' || !ORG_PATTERN.test(body.org)) {
      res.status(400).json({ message: 'invalid org' });
      return;
    }
    org = body.org;
  }

  let perPage = DEFAULT_PER_PAGE;
  if (body.perPage !== undefined) {
    const parsed = Number(body.perPage);
    if (!Number.isInteger(parsed) || parsed < 1) {
      res.status(400).json({ message: 'invalid perPage' });
      return;
    }
    perPage = Math.min(parsed, MAX_PER_PAGE);
  }

  const withDetail = Boolean(body.withDetail);

  try {
    const result = await syncGitcodeOrgProjects({ org, perPage, withDetail });
    res.status(200).json(result);
  } catch (e) {
    logger.error(`syncGitcodeOrgProjects failed: ${e.stack || e.message}`);
    res.status(500).json({ message: e.message });
  }
}
