import { fail, ok } from '../model/result.js';

// eslint-disable-next-line import/prefer-default-export
export function errHandler(promise, res) {
  promise.then((data) => {
    res.json(ok(data));
  }).catch((err) => {
    console.error(err.message);
    res.json(fail(500, 'server error'));
  });
}
