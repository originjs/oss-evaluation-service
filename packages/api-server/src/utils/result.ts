export class Result<T> {
  code: number;
  msg: string;
  data: T;

  constructor(code: number, data: T, msg?: string) {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }

  static ok<T>(data: T): Result<T> {
    return new Result(200, data);
  }

  static fail(code: number, msg?: string): Result<undefined> {
    return new Result(code, null, msg);
  }
}
