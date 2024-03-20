export function authorizationHeader(token) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);
  return headers;
}
