import { Controller, Query, Path, Route, Get } from 'tsoa';
import { Page, githubTop } from '../services/TrendService.js';
import { Result } from '../utils/result.js';

@Route('trend')
export class TrendController extends Controller {
  @Get('{type}')
  public async search(
    @Path() type: string,
    @Query() pageNo: string,
    @Query() pageSize: string,
  ): Promise<Result<Page>> {
    const page = new Page(parseInt(pageNo, 10), parseInt(pageSize, 10));
    page.format();

    const data = await githubTop(page, type);
    return Result.ok(data);
  }
}
