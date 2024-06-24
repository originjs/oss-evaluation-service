import { Controller, Post, Body, Get, Query, Route } from 'tsoa';
import type { NewProjectApply } from '../interfaces/SoftwareInfo.js';
import { existsApplication, newProjectApply } from '../services/NewProjectApplyService.js';
import type { Result } from '../utils/result.js';

@Route('newProjectApply')
export class NewProjectApplyController extends Controller {
  @Post('submitApplication')
  public async newProjectApply(@Body() application: NewProjectApply): Promise<Result<string>> {
    return newProjectApply(application);
  }

  @Get('existsApplication')
  public async existsApplication(@Query() username: string, @Query() repoUrl: string) {
    return existsApplication(username, repoUrl);
  }
}
