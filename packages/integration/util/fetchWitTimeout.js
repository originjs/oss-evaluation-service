export function fetchWithTimeout(url, options = {}, timeout = 5000) {
  if (typeof options === 'number') {
    timeout = options;
    options = {};
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`request timed out of url:{${url}}`));
    }, timeout);
    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
