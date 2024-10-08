/**
 * A class representing the result of an operation.
 *
 * @template T - The type of the data.
 * @property {boolean} isOk - Indicates whether the operation was successful.
 * @property {T} [data] - The data returned if the operation succeeded.
 * @property {string} [msg] - An optional message describing the result.
 */
export class Result<T> {
  constructor(
    public readonly isOk: boolean,
    public readonly data?: T,
    public readonly msg?: string,
  ) {
    this.isOk = isOk;
    this.data = data;
    this.msg = msg;
  }

  static ok<U>(data: U, msg = ''): Result<U> {
    return new Result(true, data, msg);
  }

  static fail(msg: string): Result<any> {
    return new Result(false, null, msg);
  }
}
