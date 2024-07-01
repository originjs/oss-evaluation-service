import { Controller, Route, Post, Body, Get, Path } from 'tsoa';
import type { SonarScanParam } from '../interfaces/param';
import { Result } from '../utils/result.js';
import { getDefaultBranch, scan } from '../services/sonarService.js';

@Route('sonar')
export class SonarController extends Controller {
  @Post('scan')
  public scan(@Body() info: SonarScanParam): Result<string> {
    scan(info);
    return Result.ok('commit task success');
  }

  @Get('getDefaultBranch/{owner}/{repoName}')
  public getDefaultBranch(@Path() owner: string, @Path() repoName: string) {
    getDefaultBranch({
      owner: owner,
      repoName: repoName,
      sonarKey: null,
      pullIfExists: false,
    });
    return Result.ok('commit task success');
  }
}
