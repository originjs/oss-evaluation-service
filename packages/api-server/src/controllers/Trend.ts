import { Controller, Query, Path, Route, Get, Tags } from 'tsoa';
import {
  Page,
  githubTop,
  githubRank,
  getLanguageFilterCondition,
} from '../services/TrendService.js';
import { Result } from '../utils/result.js';

@Route('trend')
@Tags('Trend')
export class TrendController extends Controller {
  // @Get('{type}')
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

  /**
   * Retrieve ranked trends based on specified parameters.
   *
   * @param {string} dataType - The type of data to rank (e.g., 1: stars, 2: contributors).
   * @param {string} dateType - The type of date for the trend (e.g., 1: year, 2: month, 3: week).
   * @param {string} rankType - The type of ranking (e.g., 1: increase, 2: total).
   * @param {string} pageNo - The page number for pagination.
   * @param {string} pageSize - The number of items to return per page.
   * @param {string} [language] - Optional language filter for the trends.(e.g., ["Python", "JavaScript"])
   *
   * @returns {Promise<Result<Page>>} A promise that resolves to the result containing the page of ranked trends.
   */
  @Get('rank/{dataType}')
  public async searchTrend(
    @Path() dataType: string,
    @Query() dateType: string,
    @Query() rankType: string,
    @Query() pageNo: string,
    @Query() pageSize: string,
    @Query() language?: string,
  ): Promise<Result<Page>> {
    const page = new Page(parseInt(pageNo, 10), parseInt(pageSize, 10));
    page.format();
    const type = {
      dataType: dataType,
      dateType: dateType,
      rankType: rankType,
      language: language ? (JSON.parse(language) as string[]) : [],
    };
    const data = await githubRank(page, type);
    return Result.ok(data);
  }
  /**
   * Retrieve the language filter conditions for trends.
   *
   * This endpoint returns the available language filter options
   * that can be used to refine trend searches based on programming
   * languages. It provides a structured format of languages that
   * users can select from when querying trends.
   *
   * @returns  - the result containing the language filter conditions.
   */
  @Get('languageFilter')
  public async trendLanguageFilter() {
    return Result.ok(getLanguageFilterCondition());
  }
}
