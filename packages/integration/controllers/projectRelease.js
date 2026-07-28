import {
  GithubProjectsTable,
  GiteeProjectsTable,
  GitcodeProjectsTable,
  ViewProjects,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';
import { getValidToken, refreshValidToken, sleep } from '../util/util.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

const RETRYABLE_STATUS = new Set([401, 403]);
const RELEASE_PER_PAGE = 30;

async function githubFetch(url, headers, platformType, retried = false) {
  const response = await fetch(url, { headers });

  // Handle rate limiting (429)
  if (response.status === 429 && !retried) {
    const retryAfter = response.headers.get('Retry-After');
    let waitSeconds = 60;
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) {
        waitSeconds = parsed;
      } else {
        // HTTP-date format, e.g. "Wed, 21 Oct 2026 07:28:00 GMT"
        const retryDate = new Date(retryAfter);
        if (!isNaN(retryDate.getTime())) {
          waitSeconds = Math.max((retryDate.getTime() - Date.now()) / 1000, 0) + 1;
        }
      }
    }
    logger.warn(`[Release] GitHub rate limited (429) for ${url}, waiting ${waitSeconds}s`);
    await sleep(waitSeconds * 1000);
    return githubFetch(url, headers, platformType, true);
  }

  // Handle 403: distinguish rate-limit-exhausted from other auth errors
  if (response.status === 403) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitSeconds = resetTime
        ? Math.max(parseInt(resetTime, 10) - Math.floor(Date.now() / 1000), 0) + 1
        : 60;
      logger.warn(`[Release] GitHub rate limit exhausted for ${url}, waiting ${waitSeconds}s until reset`);
      await sleep(waitSeconds * 1000);
      return githubFetch(url, headers, platformType, true);
    }
    // Non-rate-limit 403: try token refresh once
    if (!retried) {
      await refreshValidToken(platformType);
      const newToken = await getValidToken(platformType);
      const newHeaders = {
        ...headers,
        ...(newToken && { Authorization: `Bearer ${newToken}` }),
      };
      return githubFetch(url, newHeaders, platformType, true);
    }
  }

  // Handle 401: token refresh once
  if (response.status === 401 && !retried) {
    await refreshValidToken(platformType);
    const newToken = await getValidToken(platformType);
    const newHeaders = {
      ...headers,
      ...(newToken && { Authorization: `Bearer ${newToken}` }),
    };
    return githubFetch(url, newHeaders, platformType, true);
  }

  return response;
}

async function genericFetch(url, platformType, retried = false) {
  const response = await fetch(url);
  if (RETRYABLE_STATUS.has(response.status) && !retried) {
    await refreshValidToken(platformType);
    const newToken = await getValidToken(platformType);
    if (!newToken) return response;
    const separator = url.includes('?') ? '&' : '?';
    const prefix = url.split('#')[0];
    const hasTokenParam = /[?&]access_token=/.test(url);
    const rebuilt = hasTokenParam
      ? prefix.replace(
          /([?&])access_token=[^&]*/,
          `$1access_token=${encodeURIComponent(newToken || '')}`,
        )
      : `${prefix}${separator}access_token=${encodeURIComponent(newToken || '')}`;
    return genericFetch(rebuilt, platformType, true);
  }
  return response;
}

async function fetchGithubLatestRelease(owner, repo) {
  const token = await getValidToken(platformTypes.GITHUB);
  const headers = {
    'User-Agent': 'nodejs/18.19.0',
    ...(token && { Authorization: `Bearer ${token}` }),
    'X-GitHub-Api-Version': '2022-11-28',
    Accept: 'application/vnd.github+json',
  };

  try {
    const latestResp = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      headers,
      platformTypes.GITHUB,
    );
    if (latestResp.ok) {
      const latest = await latestResp.json();
      if (latest && !latest.prerelease && !latest.draft && latest.tag_name && latest.published_at) {
        return { tagName: latest.tag_name, publishedAt: latest.published_at };
      }
    }

    const listResp = await githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${RELEASE_PER_PAGE}`,
      headers,
      platformTypes.GITHUB,
    );
    if (!listResp.ok) {
      logger.warn(`[Release] GitHub fetch failed ${owner}/${repo}: status=${listResp.status}`);
      return null;
    }
    const releases = await listResp.json();
    const stable = releases.find(r => !r.prerelease && !r.draft && r.tag_name && r.published_at);
    return stable ? { tagName: stable.tag_name, publishedAt: stable.published_at } : null;
  } catch (e) {
    logger.warn(`[Release] GitHub fetch error ${owner}/${repo}: ${e.message}`);
    return null;
  }
}

function giteePublishedAt(r) {
  return r.published_at || r.created_at || r.updated_at || '';
}

async function fetchGiteeLatestRelease(owner, repo) {
  const token = await getValidToken(platformTypes.GITEE);
  const params = new URLSearchParams({
    per_page: String(RELEASE_PER_PAGE),
    page: '1',
    direction: 'desc',
  });
  if (token) params.set('access_token', token);
  const url = `https://gitee.com/api/v5/repos/${owner}/${repo}/releases?${params.toString()}`;

  try {
    const response = await genericFetch(url, platformTypes.GITEE);
    if (!response.ok) {
      logger.warn(`[Release] Gitee fetch failed ${owner}/${repo}: status=${response.status}`);
      return null;
    }
    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) return null;
    const sorted = [...releases].sort((a, b) => {
      const ta = new Date(giteePublishedAt(a)).getTime() || 0;
      const tb = new Date(giteePublishedAt(b)).getTime() || 0;
      return tb - ta;
    });
    const stable = sorted.find(r => !r.prerelease && (r.tag_name || r.tag) && giteePublishedAt(r));
    return stable
      ? {
          tagName: stable.tag_name || stable.tag || '',
          publishedAt: giteePublishedAt(stable),
        }
      : null;
  } catch (e) {
    logger.warn(`[Release] Gitee fetch error ${owner}/${repo}: ${e.message}`);
    return null;
  }
}

async function fetchGitcodeLatestRelease(owner, repo) {
  const token = await getValidToken(platformTypes.GITCODE);
  const params = new URLSearchParams({
    per_page: String(RELEASE_PER_PAGE),
    page: '1',
    direction: 'desc',
  });
  if (token) params.set('access_token', token);
  const url = `https://api.gitcode.com/api/v5/repos/${owner}/${repo}/releases?${params.toString()}`;

  try {
    const response = await genericFetch(url, platformTypes.GITCODE);
    if (!response.ok) {
      logger.warn(`[Release] GitCode fetch failed ${owner}/${repo}: status=${response.status}`);
      return null;
    }
    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) return null;
    const sorted = [...releases].sort((a, b) => {
      const ta = new Date(giteePublishedAt(a)).getTime() || 0;
      const tb = new Date(giteePublishedAt(b)).getTime() || 0;
      return tb - ta;
    });
    const stable = sorted.find(r => !r.prerelease && (r.tag_name || r.tag) && giteePublishedAt(r));
    return stable
      ? {
          tagName: stable.tag_name || stable.tag || '',
          publishedAt: giteePublishedAt(stable),
        }
      : null;
  } catch (e) {
    logger.warn(`[Release] GitCode fetch error ${owner}/${repo}: ${e.message}`);
    return null;
  }
}

const fetchers = {
  [platformTypes.GITHUB]: fetchGithubLatestRelease,
  [platformTypes.GITEE]: fetchGiteeLatestRelease,
  [platformTypes.GITCODE]: fetchGitcodeLatestRelease,
};

const tableMap = {
  [platformTypes.GITHUB]: GithubProjectsTable,
  [platformTypes.GITEE]: GiteeProjectsTable,
  [platformTypes.GITCODE]: GitcodeProjectsTable,
};

export const RELEASE_SYNC_STATUS = Object.freeze({
  UPDATED: 'updated',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

export async function syncSingleProjectRelease(project) {
  const platformType = project.platformType;
  const fullName = project.fullName;

  if (!fullName) {
    logger.warn(`[Release] project missing fullName, pId=${project.pId}`);
    return RELEASE_SYNC_STATUS.FAILED;
  }

  const parts = fullName.split('/');
  if (parts.length < 2) {
    logger.warn(`[Release] invalid fullName "${fullName}", pId=${project.pId}`);
    return RELEASE_SYNC_STATUS.FAILED;
  }
  const [owner, repo] = parts;

  const fetcher = fetchers[platformType];
  if (!fetcher) {
    logger.warn(`[Release] unsupported platformType=${platformType}`);
    return RELEASE_SYNC_STATUS.SKIPPED;
  }

  const info = await fetcher(owner, repo);
  if (!info) {
    logger.info(`[Release] no stable release for ${fullName}`);
    return RELEASE_SYNC_STATUS.SKIPPED;
  }

  const Model = tableMap[platformType];
  const [affectedRows] = await Model.update(
    {
      latestReleaseTagName: info.tagName,
      latestReleasePublishedAt: info.publishedAt,
    },
    { where: { id: Number(project.id) } },
  );

  if (!affectedRows) {
    logger.warn(`[Release] no row updated for ${fullName} (pId=${project.pId})`);
    return RELEASE_SYNC_STATUS.FAILED;
  }

  logger.info(
    `[Release] synced ${fullName}: tag=${info.tagName}, published_at=${info.publishedAt}`,
  );
  return RELEASE_SYNC_STATUS.UPDATED;
}

export async function syncSingleProjectReleaseHandler(req, res) {
  const { repoUrl } = req.body;
  let project;
  if (repoUrl) {
    project = await ViewProjects.findOne({ where: { htmlUrl: repoUrl } });
  } else if (req.body.pId) {
    project = await ViewProjects.findOne({ where: { pId: req.body.pId } });
  }
  if (!project) {
    res.status(404).json({ ok: false, error: 'Project not found' });
    return;
  }
  const status = await syncSingleProjectRelease(project);
  const ok = status === RELEASE_SYNC_STATUS.UPDATED;
  res.status(200).json({ ok, pId: project.pId, status });
}

export async function syncAllProjectReleaseHandler(req, res) {
  const limit = Math.min(Number(req.body?.limit) || 500, 2000);
  const offset = Number(req.body?.offset) || 0;
  const onlyNull = req.body?.onlyNull !== false;

  const projects = await ViewProjects.findAll({
    where: onlyNull ? { latestReleasePublishedAt: null } : undefined,
    attributes: ['id', 'pId', 'platformType', 'fullName', 'htmlUrl'],
    limit,
    offset,
    order: [['pId', 'ASC']],
  });

  logger.info(`[Release] batch sync start: count=${projects.length}, onlyNull=${onlyNull}`);

  let okCount = 0;
  let skipCount = 0;
  let failCount = 0;
  for (const p of projects) {
    try {
      const status = await syncSingleProjectRelease(p);
      if (status === RELEASE_SYNC_STATUS.UPDATED) okCount += 1;
      else if (status === RELEASE_SYNC_STATUS.SKIPPED) skipCount += 1;
      else failCount += 1;
    } catch (e) {
      failCount += 1;
      logger.error(`[Release] batch error ${p.pId}: ${e.message}`);
    }
    await sleep(200);
  }

  logger.info(
    `[Release] batch sync done: updated=${okCount}, skipped=${skipCount}, failed=${failCount}, total=${projects.length}`,
  );
  res.status(200).json({ ok: true, total: projects.length, okCount, skipCount, failCount });
}

export const projectReleaseTimer = addMonitoringToTask(
  async function () {
    const startTime = process.hrtime();
    logger.info('[Integration][ProjectRelease] Integration Job start');

    const limit = 500;
    let offset = 0;
    let totalOk = 0;
    let totalFail = 0;
    let totalSkip = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const projects = await ViewProjects.findAll({
        attributes: ['id', 'pId', 'platformType', 'fullName', 'htmlUrl'],
        limit,
        offset,
        order: [['pId', 'ASC']],
      });

      if (projects.length === 0) break;

      for (const p of projects) {
        try {
          const status = await syncSingleProjectRelease(p);
          if (status === RELEASE_SYNC_STATUS.UPDATED) totalOk += 1;
          else if (status === RELEASE_SYNC_STATUS.SKIPPED) totalSkip += 1;
          else totalFail += 1;
        } catch (e) {
          totalFail += 1;
          logger.error(`[Integration][ProjectRelease] error ${p.pId}: ${e.message}`);
        }
        await sleep(500);
      }

      offset += limit;
    }

    const totalProcessed = totalOk + totalFail + totalSkip;
    logger.info(
      `[Integration][ProjectRelease] Integration Job end: updated=${totalOk}, skipped=${totalSkip}, failed=${totalFail}, total=${totalProcessed}`,
    );

    if (totalProcessed > 0 && totalOk === 0 && totalFail > 0) {
      throw new Error(
        `All projects failed to sync release (${totalFail} failed, ${totalSkip} skipped), GitHub API may be rate limited`,
      );
    }

    const endTime = process.hrtime(startTime);
    logger.info(`[Integration][ProjectRelease] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`);
  },
  'projectReleaseTimer',
  '周三 00:00 全量同步 Release 信息',
);
