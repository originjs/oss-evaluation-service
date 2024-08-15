import { authorizationHeader } from '../../util.js';

export function createFork(owner, repo, forkBody, token) {
  const headers = authorizationHeader(token);
  return fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(forkBody),
  });
}

export function deleteFork(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
    method: 'DELETE',
    headers: authorizationHeader(token),
  });
}
