import { Controller, Route, Post, Body, Get, Path } from 'tsoa';
import type { SonarScanParam } from '../interfaces/RepoInfo.js';
import { Result } from '../utils/result.js';
import { getDefaultBranch, scan } from '../services/SonarService.js';

@Route('sonar')
export class SonarController extends Controller {
  @Post('scan')
  public async scan(@Body() info: SonarScanParam): Promise<Result<boolean>> {
    try {
      const result = await scan(info);
      return Result.bean(result.ok);
    } catch (e) {
      console.error(e);
      return Result.fail(e);
    }
  }

  @Get('getDefaultBranch/{owner}/{repoName}')
  public async getDefaultBranch(@Path() owner: string, @Path() repoName: string) {
    try {
      const data = await getDefaultBranch({
        owner: owner,
        repoName: repoName,
        sonarKey: null,
        pullIfExists: false,
      });
      return Result.ok(data);
    } catch (e) {
      console.error(e);
      return Result.fail(e);
    }
  }
}
