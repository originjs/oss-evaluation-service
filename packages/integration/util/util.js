import { ViewProjects, logger } from '@orginjs/oss-evaluation-data-model';
import { setTimeout } from 'node:timers';
import { platformTypes } from '@orginjs/oss-evaluation-util';

export const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export const timer = (fn, param, ms) =>
  new Promise(resolve => {
    setTimeout(async () => {
      const res = await fn(param);
      resolve(res);
    }, ms);
  });
/**
 * @async
 * @param {string} repoUrl github project url
 * @returns {Promise<*>} project basic information
 */
export async function getProjectByUrl(repoUrl) {
  const project = await ViewProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
  });
  if (!project) {
    logger.info('project not exists');
    return;
  }
  return project;
}

/**
 * Parse GitHub main repository url
 * @param {string} repoUrl GitHub repository url
 * @returns {{owner: string, protocol: string, address: string, repository: string}}
 * @throws {Error}
 */
export function parseRepoUrl(repoUrl) {
  const regex = /^(https?:)\/\/(github\.com)\/([^/]+)\/([^/]+)$/;
  const match = repoUrl.match(regex);
  if (match) {
    return {
      protocol: match[1], // "https://"
      address: match[2], //github.com
      owner: match[3], // 用户名或组织名
      repository: match[4], // 仓库名
    };
  } else {
    logger.error('The repoUrl is not a  valid GitHub main repository address');
    throw new Error('The repoUrl is not a  valid GitHub main repository address');
  }
}

export function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;

  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

const tokenCache = {
  [platformTypes.GITHUB]: {
    token: null,
    isValid: false,
    refreshing: null,
  },
  [platformTypes.GITEE]: {
    token: null,
    isValid: false,
    refreshing: null,
  },
  [platformTypes.GITCODE]: {
    token: null,
    isValid: false,
    refreshing: null,
  },
};

const platformNameMap = {
  [platformTypes.GITHUB]: 'GitHub',
  [platformTypes.GITEE]: 'Gitee',
  [platformTypes.GITCODE]: 'GitCode',
};

function tokenFingerprint(token) {
  if (!token) {
    return '<empty>';
  }
  if (token.length <= 10) {
    return `${token.slice(0, 2)}...${token.slice(-2)}`;
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function isGitHubTokenScopeUsable(response) {
  const scopes = response.headers.get('x-oauth-scopes') || '';
  return scopes
    .split(',')
    .map(scope => scope.trim())
    .some(scope => scope === 'repo' || scope === 'public_repo');
}

async function validateSingleToken(token, validationUrl, platformType) {
  const response = await fetch(validationUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok || response.status !== 200) {
    return { valid: false, reason: `HTTP ${response.status}` };
  }
  if (platformType === platformTypes.GITHUB && !isGitHubTokenScopeUsable(response)) {
    return { valid: false, reason: 'missing repo/public_repo scope' };
  }
  return { valid: true };
}

async function refreshAndValidateToken(tokenArray, validationUrl, platformType) {
  const platformName = platformNameMap[platformType] || `platform ${platformType}`;
  const validTokenResults = [];
  const invalidTokens = [];
  for (const token of tokenArray) {
    const fingerprint = tokenFingerprint(token);
    try {
      const result = await validateSingleToken(token, validationUrl, platformType);
      if (result.valid) {
        validTokenResults.push({ token, fingerprint });
        continue;
      }
      invalidTokens.push(`${fingerprint} (${result.reason})`);
    } catch (error) {
      invalidTokens.push(`${fingerprint} (${error.message})`);
    }
  }
  const validTokens = validTokenResults.map(result => result.fingerprint);
  const summary = [
    `${platformName} token validation: ${validTokenResults.length}/${tokenArray.length} usable`,
    `${invalidTokens.length} invalid`,
    `usable=[${validTokens.join(', ')}]`,
    `invalid=[${invalidTokens.join(', ')}]`,
  ].join(', ');
  if (validTokenResults.length === 0) {
    logger.error(summary);
    return null;
  }
  if (invalidTokens.length > 0) {
    logger.warn(summary);
  } else {
    logger.info(summary);
  }
  return validTokenResults[0].token;
}

export const getValidToken = async platformType => {
  const cache = tokenCache[platformType];
  if (cache.isValid && cache.token) {
    logger.info(`Using cached ${platformType} token`);
    return cache.token;
  }
  if (cache.refreshing) {
    logger.info(`${platformType} token is being refreshed, waiting...`);
    return cache.refreshing;
  }
  const tokenMap = {
    [platformTypes.GITHUB]: JSON.parse(process.env.GITHUB_TOKEN),
    [platformTypes.GITEE]: JSON.parse(process.env.GITEE_TOKEN),
    [platformTypes.GITCODE]: JSON.parse(process.env.GITCODE_TOKEN),
  };
  const validationUrlMap = {
    [platformTypes.GITHUB]: 'https://api.github.com/user',
    [platformTypes.GITEE]: 'https://gitee.com/api/v5/user',
    [platformTypes.GITCODE]: 'https://api.gitcode.com/api/v5/user',
  };
  cache.refreshing = (async () => {
    const validToken = await refreshAndValidateToken(
      tokenMap[platformType],
      validationUrlMap[platformType],
      platformType,
    );
    if (validToken) {
      cache.token = validToken;
      cache.isValid = true;
    } else {
      cache.token = null;
      cache.isValid = false;
    }
    cache.refreshing = null;
    return validToken;
  })();
  return cache.refreshing;
};

export const invalidateToken = platformType => {
  const cache = tokenCache[platformType];
  cache.token = null;
  cache.isValid = false;
  logger.info(`${platformType} token invalidated`);
};

export const refreshValidToken = async platformType => {
  invalidateToken(platformType);
  return await getValidToken(platformType);
};
