import {
  GithubProjectsTable,
  GiteeProjectsTable,
  GitcodeProjectsTable,
  ViewProjects,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';
import { getValidToken, refreshValidToken } from '../util/util.js';

async function fetchGithubLatestRelease(owner, repo) {
  const token = await getValidToken(platformTypes.GITHUB);
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const headers = {
    'User-Agent': 'nodejs/18.19.0',
    ...(token && { Authorization: `Bearer ${token}` }),
    'X-GitHub-Api-Version': '2022-11-28',
    Accept: 'application/vnd.github+json',
  };

  try {
    const response = await fetch(`${url}?per_page=30`, { headers });
    if (response.status === 403) {
      await refreshValidToken(platformTypes.GITHUB);
    }
    if (!response.ok) {
      logger.warn(
        `[Release] GitHub fetch failed ${owner}/${repo}: status=${response.status}`,
      );
      return null;
    }
    const releases = await response.json();
    const stable = releases.find(
      r => !r.prerelease && !r.draft && r.tag_name && r.published_at,
    );
    return stable
      ? {
          tagName: stable.tag_name,
          publishedAt: stable.published_at,
        }
      : null;
  } catch (e) {
    logger.warn(`[Release] GitHub fetch error ${owner}/${repo}: ${e.message}`);
    return null;
  }
}

async function fetchGiteeLatestRelease(owner, repo) {
  const token = await getValidToken(platformTypes.GITEE);
  const params = new URLSearchParams({
    per_page: '20',
    page: '1',
  });
  if (token) params.set('access_token', token);
  const url = `https://gitee.com/api/v5/repos/${owner}/${repo}/releases?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (response.status === 403 || response.status === 401) {
      await refreshValidToken(platformTypes.GITEE);
    }
    if (!response.ok) {
      logger.warn(
        `[Release] Gitee fetch failed ${owner}/${repo}: status=${response.status}`,
      );
      return null;
    }
    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) return null;
    const stable = releases.find(
      r => !r.prerelease && (r.tag_name || r.tag) && (r.created_at || r.updated_at),
    );
    return stable
      ? {
          tagName: stable.tag_name || stable.tag || '',
          publishedAt: stable.created_at || stable.updated_at || '',
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
    per_page: '20',
    page: '1',
  });
  if (token) params.set('access_token', token);
  const url = `https://api.gitcode.com/api/v5/repos/${owner}/${repo}/releases?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (response.status === 403 || response.status === 401) {
      await refreshValidToken(platformTypes.GITCODE);
    }
    if (!response.ok) {
      logger.warn(
        `[Release] GitCode fetch failed ${owner}/${repo}: status=${response.status}`,
      );
      return null;
    }
    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) return null;
    const stable = releases.find(
      r => !r.prerelease && (r.tag_name || r.tag) && (r.created_at || r.updated_at),
    );
    return stable
      ? {
          tagName: stable.tag_name || stable.tag || '',
          publishedAt: stable.created_at || stable.updated_at || '',
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
  const [platformRaw, idRaw] = project.pId.split('#');
  const [affectedRows] = await Model.update(
    {
      latestReleaseTagName: info.tagName,
      latestReleasePublishedAt: info.publishedAt,
    },
    { where: { platformType: Number(platformRaw), id: Number(idRaw) } },
  );

  if (!affectedRows) {
    logger.warn(
      `[Release] no row updated for ${fullName} (pId=${project.pId})`,
    );
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

  const where = { dataType: 1 };
  if (onlyNull) {
    where.latestReleasePublishedAt = null;
  }

  const projects = await ViewProjects.findAll({
    where,
    attributes: ['pId', 'platformType', 'fullName', 'htmlUrl'],
    limit,
    offset,
    order: [['pId', 'ASC']],
  });

  logger.info(
    `[Release] batch sync start: count=${projects.length}, onlyNull=${onlyNull}`,
  );

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
  }

  logger.info(
    `[Release] batch sync done: updated=${okCount}, skipped=${skipCount}, failed=${failCount}, total=${projects.length}`,
  );
  res
    .status(200)
    .json({ ok: true, total: projects.length, okCount, skipCount, failCount });
}

