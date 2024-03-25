export const authorizationHeader = token => {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);
  return headers;
};

export const appendUrlParam = param => {
  let url = '';
  for (const key in param) {
    if (Object.prototype.hasOwnProperty.call(param, key) && param[key] !== null) {
      url = `${url}${encodeURI(key)}=${encodeURI(param[key])}&`;
    }
  }
  url = url.substring(0, url.length - 1);
  return url;
};
