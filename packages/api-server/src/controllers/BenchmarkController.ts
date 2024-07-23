import { Controller, Get, Path, Post, Route, Tags, UploadedFile } from 'tsoa';
import type {
  BenchmarkIndex,
  BenchmarkResult,
  SoftwareBaseInfo,
} from '../interfaces/SoftwareInfo.js';
import {
  getBenchmarkResultByTechStack,
  importBenchmarkFromExcel,
  queryIndexByTechStack,
  queryProjectsByTechStack,
} from '../services/BenchmarkService.js';

import { Result } from '../utils/result.js';

@Tags('benchamrk')
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

  @Post('importBenchmarkByExcel')
  public async importBenchmarkByExcelHandler(@UploadedFile() file: Express.Multer.File) {
    try {
      await importBenchmarkFromExcel(file);
      return Result.ok('ok');
    } catch (e) {
      return Result.fail(400, e.message);
    }
  }
}
