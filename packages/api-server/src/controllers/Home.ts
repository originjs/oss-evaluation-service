import { Controller, Query, Route, Get } from 'tsoa';
import { searchProject, getRadarList } from '../services/HomeService.js';
import type { SoftwareBaseInfo, TechRadarItem } from '../interfaces/SoftwareInfo.js';
import { Result } from '../utils/result.js';

@Route('home')
export class HomeController extends Controller {
  @Get('search')
  public async search(
    @Query() keyword: string,
    @Query() techStack?: string,
  ): Promise<Result<SoftwareBaseInfo[]>> {
    const data = await searchProject(keyword, techStack!);
    return Result.ok(data);
  }

  @Get('radar')
  public async radar(): Promise<Result<TechRadarItem[]>> {
    const data = await getRadarList();
    return Result.ok(data);
  }
}
