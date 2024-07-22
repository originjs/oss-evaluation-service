import { Controller, Post, Body, Get, Query, Route, Tags, Request } from 'tsoa';
import type { Request as ExRequest } from 'express';
import type { NewProjectApply } from '../interfaces/SoftwareInfo.js';
import {
  existsApplication,
  getApplyRecordByEmployeeNumber,
  newProjectApply,
} from '../services/NewProjectApplyService.js';
import { Result } from '../utils/result.js';
import type { UploadedFile } from 'express-fileupload';

@Tags('新软件申请')
@Route('newProjectApply')
export class NewProjectApplyController extends Controller {
  @Post('submitApplication')
  public async newProjectApply(
    @Body() application: NewProjectApply,
    @Request() req: ExRequest,
  ): Promise<Result<string>> {
    const file = req.files?.['file'] as UploadedFile;
    if (application.type === 3 && !file) {
      return Result.fail(400, 'no benchmark file!');
    }
    return newProjectApply(application, file);
  }

  @Get('existsApplication')
  public async existsApplication(@Query() username: string, @Query() repoUrl: string) {
    return existsApplication(username, repoUrl);
  }

  @Get('getApplyRecord')
  public async getApplyRecordByEmployeeNumber(@Query() employeeNumber: string) {
    return Result.ignoreErrorWithDefault(() => getApplyRecordByEmployeeNumber(employeeNumber), {});
  }
}
