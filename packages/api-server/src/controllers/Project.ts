import { Controller, Path, Route, Get, Post } from 'tsoa';
import {
  getProjectDetailInfo,
  getSoftwareActivity,
  exportScoreExcel,
  exportBenchmarkExcel,
} from '../services/ProjectDetailService.js';
import type { EcologyActivityCategory, SoftwareInfo } from '../interfaces/SoftwareInfo.js';
import { appendSheet } from '../utils/excel.js';
import { Result } from '../utils/result.js';
import { Readable } from 'stream';

@Route('project')
export class ProjectController extends Controller {
  @Get('{repoName}')
  public async getProjectInfo(@Path() repoName: string): Promise<Result<SoftwareInfo>> {
    const data = await getProjectDetailInfo(repoName);
    return Result.ok(data);
  }

  @Get('activity/{repoName}')
  public async getActivityData(@Path() repoName: string): Promise<Result<EcologyActivityCategory>> {
    const data = await getSoftwareActivity(repoName);
    return Result.ok(data);
  }

  @Post('export/{repoName}')
  public async exportReport(@Path() repoName: string): Promise<Readable> {
    const scoreExcel = await exportScoreExcel(repoName);
    const benchmarkExcel = await exportBenchmarkExcel(repoName);
    let exportBuffer;

    if (!scoreExcel) {
      throw new Error(`no data for export excel,repo name :${repoName}`);
    }
    if (benchmarkExcel) {
      //   merge scoreExcel and benchmarkExcel into one excel
      exportBuffer = appendSheet(scoreExcel, benchmarkExcel);
    } else {
      exportBuffer = scoreExcel;
    }
    this.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(repoName)}.xlsx`,
    );
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return Readable.from(exportBuffer);
  }
}
