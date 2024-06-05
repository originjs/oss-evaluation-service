import { Result } from '../../result.js';
import { authorizationHeader } from '../../util.js';

export const getProjectInfo = async (owner, repo, token) => {
  const headers = authorizationHeader(token);
  headers.append('Accept', 'application/vnd.github.v3+json');
  headers.append('X-GitHub-Api-Version', '2022-11-28');
  return Result.response2Result(
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers,
    }),
  );
};
