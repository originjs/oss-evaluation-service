export default class Result {
  constructor(code, data, msg) {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }

  static ok(data) {
    return new Result(200, data);
  }

  static fail(code, msg) {
    return new Result(code, null, msg);
  }
}

export function ok(data) {
  return Result.ok(data);
}

export function fail(code, msg) {
  return Result.fail(code, msg);
}
