import { authorizationHeader } from '../../util.js';

export function createFork(owner, repo, token) {
  const headers = authorizationHeader(token);
  return fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
    method: 'POST',
    headers,
  });
}

export function deleteFork(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
    method: 'DELETE',
    headers: authorizationHeader(token),
  });
}
