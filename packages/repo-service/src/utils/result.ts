export class Result<T> {
  ok: boolean;
  msg: string;
  data: T;

  constructor(ok: boolean, data: T, msg?: string) {
    this.ok = ok;
    this.data = data;
    this.msg = msg;
  }

  static ok<T>(data: T): Result<T> {
    return new Result(true, data, null);
  }

  static fail(msg?: string): Result<undefined> {
    return new Result(false, null, msg);
  }

  static bean<T>(ok: boolean, data: T = null, msg: string = null): Result<T> {
    return new Result<T>(ok, data, msg);
  }
}
