export class Result {
  constructor(ok, data, msg) {
    this.ok = ok;
    this.data = data;
    this.msg = msg;
  }

  static ok(data) {
    return new Result(true, data);
  }

  static fail(msg) {
    return new Result(false, null, msg);
  }

  static async response2Result(promise) {
    const response = await promise;
    return response.ok ? Result.ok(await response.json()) : Result.fail(await response.text());
  }

  static async response2ResultOnlyStatus(promise) {
    const response = await promise;
    return response.ok ? Result.ok() : Result.fail(await response.text());
  }
}
