import { Controller, Path, Route, Get, Post, Body } from 'tsoa';
import {
  getProjectDetailInfo,
  getSoftwareActivity,
  getSoftwareInnovate,
  getPerformance,
  getInnovation,
  compareExportScoreExcel,
} from '../services/ProjectDetailService.js';
import type {
  EcologyActivityCategory,
  InnovationData,
  InnovationInfo,
  PerformanceInfo,
  SoftwareInfo,
} from '../interfaces/SoftwareInfo.js';
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

  @Get('innovate/{repoName}')
  public async getInnovateData(@Path() repoName: string): Promise<Result<InnovationData>> {
    const data = await getSoftwareInnovate(repoName);
    return Result.ok(data);
  }

  @Get('performance/{repoName}')
  public async getPerformanceData(
    @Path() repoName: string,
  ): Promise<Result<PerformanceInfo | unknown>> {
    try {
      const data = await getPerformance(repoName);
      return Result.ok(data);
    } catch (e) {
      return Result.ok({});
    }
  }

  @Get('innovation/{repoName}')
  public async getInnovationData(
    @Path() repoName: string,
  ): Promise<Result<InnovationInfo | unknown>> {
    try {
      const data = await getInnovation(repoName);
      return Result.ok(data);
    } catch (e) {
      return Result.ok({});
    }
  }

  @Post('export/{repoName}')
  public async exportReport(@Path() repoName: string): Promise<Readable> {
    const scoreExcel = await compareExportScoreExcel([repoName]);
    this.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(repoName)}.xlsx`,
    );
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return Readable.from(scoreExcel);
  }

  @Post('compareExport')
  public async compareExportReport(@Body() repoNameList: string[]): Promise<Readable> {
    const scoreExcel = await compareExportScoreExcel(repoNameList);
    const fileName = repoNameList.join('-');
    this.setHeader(
      'Content-Disposition',
      `attachment; filename=softwareCompare-${encodeURIComponent(fileName)}.xlsx`,
    );
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return Readable.from(scoreExcel);
  }
}
