import type { Request as ExRequest } from 'express';
import type { UploadedFile } from 'express-fileupload';
import { existsSync, readFileSync } from 'fs';
import { Readable } from 'node:stream';
import { Body, Controller, Get, Path, Post, Query, Request, Route, Tags } from 'tsoa';
import type { NewProjectApply } from '../interfaces/SoftwareInfo.js';
import {
  existsApplication,
  getApplyRecordByEmployeeNumber,
  newProjectApply,
} from '../services/NewProjectApplyService.js';
import { Result } from '../utils/result.js';

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

  @Get('downloadBenchmarkFile/{filename}')
  public async donwloadBenchmarkFile(@Path() filename: string) {
    if (!filename) {
      return Result.fail(400, 'filename is empty');
    }
    const filePath = `${process.env.UPLOAD_DIR}/benchmark/${filename}`;
    if (!existsSync(filePath)) {
      return Result.fail(400, 'file doesnt exist');
    }
    const buffer = Buffer.from(readFileSync(filePath));
    this.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return Readable.from(buffer);
  }
}
