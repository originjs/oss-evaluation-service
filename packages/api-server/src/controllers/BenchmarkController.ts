import { Controller, Get, Path, Post, Route, Tags, UploadedFile } from 'tsoa';
import type {
  BenchmarkIndex,
  BenchmarkResult,
  SoftwareBaseInfo,
} from '../interfaces/SoftwareInfo.js';
import {
  getBenchmarkResultByTechStack,
  importBenchmarkFromExcel,
  getIndexByTechStack,
  queryProjectsByTechStack,
  exportBenchmrkByTechStackHandler,
} from '../services/BenchmarkService.js';

import { Result } from '../utils/result.js';
import { existsSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { basename, resolve } from 'node:path';
import moment from 'moment';

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
    const data = await getIndexByTechStack(techStack);
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

  @Get('downloadBenchmarkFile/{filename}')
  public async donwloadBenchmarkFile(@Path() filename: string) {
    if (!filename) {
      return Result.fail(400, 'filename is empty');
    }
    const filePath = `${process.env.UPLOAD_PATH ?? '/root/upload'}/benchmark/${filename}`;
    if (!existsSync(filePath)) {
      return Result.fail(400, 'file doesnt exist');
    }
    return Readable.from(this.file2Buffer(filePath));
  }

  @Get('downloadExcelTemplate')
  public async downloadExcelTemplate() {
    const filename = 'benchmark_template.xlsx';
    const filePath = `${resolve()}/template/excel/${filename}`;
    if (!existsSync(filePath)) {
      return Result.fail(400, 'file doesnt exist');
    }
    return Readable.from(this.file2Buffer(filePath));
  }

  file2Buffer(filePath: string) {
    const buffer = Buffer.from(readFileSync(filePath));
    const filename = basename(filePath);
    this.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return buffer;
  }

  @Get('exportByTechStack/{techStack}')
  public async exportBenchmrkByTechStack(@Path('techStack') techStack: string) {
    if (!techStack) {
      return Result.fail(400, 'techStack is empty!');
    }
    try {
      const buffer = await exportBenchmrkByTechStackHandler(techStack);
      const filename = `${techStack}_${moment(new Date()).format('yyyyMMddHHmmSSS')}`;
      this.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
      this.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      return Readable.from(Buffer.from(buffer));
    } catch (e) {
      // return Result.fail(400, 'export failed');
      return Result.fail(400, e.message);
    }
  }
}
