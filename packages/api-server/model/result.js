export default class Result {
  constructor(code, data, msg) {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }

  static ok(data) {
    return new Result(200, data);
  }
}
