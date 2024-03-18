export default class Page {
  pageSize = 10;

  pageNo = 0;

  data = [];

  constructor(pageNo, pageSize, data) {
    this.pageSize = pageSize;
    this.pageNo = pageNo;
    this.data = data;
  }

  static clone(page) {
    return new Page(page.pageNo, page.pageSize, page.data);
  }

  format() {
    if (!this.pageSize || this.pageSize <= 0 || this.pageSize >= 100) {
      this.pageSize = 10;
    }
    this.pageNo = !this.pageNo || this.pageNo <= 0 ? 1 : this.pageNo;
  }
}
