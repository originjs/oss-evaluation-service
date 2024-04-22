import { Controller, Path, Route, Get } from 'tsoa';
import {
  queryProjectsByTechStack,
  queryIndexByTechStack,
  getBenchmarkResultByTechStack,
} from '../services/BenchmarkService.js';
import type {
  SoftwareBaseInfo,
  BenchmarkIndex,
  BenchmarkResult,
} from '../interfaces/SoftwareInfo.js';

import { Result } from '../utils/result.js';

@Route('benchmark')
export class BenchmarkController extends Controller {
  @Get('techstack/{category}/{techStack}')
  public async getProjectsByTechStack(
    @Path() category: string,
    @Path() techStack: string,
  ): Promise<Result<Array<SoftwareBaseInfo>>> {
    const data = await queryProjectsByTechStack(category, techStack);
    return Result.ok(data);
  }

  @Get('indexs/{techStack}')
  public async getIndexByTechStack(
    @Path() techStack: string,
  ): Promise<Result<Array<BenchmarkIndex>>> {
    const data = await queryIndexByTechStack(techStack);
    return Result.ok(data);
  }

  @Get('result/{techStack}')
  public async getBenchmarkResultStack(
    @Path() techStack: string,
  ): Promise<Result<Array<BenchmarkResult>>> {
    const data = await getBenchmarkResultByTechStack(techStack);
    return Result.ok(data);
  }
}
