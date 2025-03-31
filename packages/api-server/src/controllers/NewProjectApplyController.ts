import {
  Body,
  Controller,
  Delete,
  FormField,
  Get,
  Post,
  Query,
  Route,
  Tags,
  UploadedFile,
} from 'tsoa';
import type { NewProjectApply } from '../interfaces/SoftwareInfo.js';
import {
  deleteApplicationById,
  existsApplication,
  getApplyRecordByEmployeeNumber,
  newProjectApply,
  exportApplyRecordToExcel,
} from '../services/NewProjectApplyService.js';
import { Result } from '../utils/result.js';
import type { Readable } from 'stream';

@Tags('新软件申请')
@Route('newProjectApply')
export class NewProjectApplyController extends Controller {
  @Post('submitApplication')
  public async newProjectApply(
    @FormField() applicantEmail: string,
    @FormField() type: number,
    @UploadedFile() file?: Express.Multer.File,
    @FormField() repoUrl?: string,
    @FormField() comment?: string,
    @FormField() username?: string,
    @FormField() alternativeProjectId?: string,
    @FormField() expandField1?: string,
    @FormField() techStack?: string,
    @FormField() employeeNumber?: string,
    @FormField() buName?: string,
    @FormField() isBuOwner?: boolean,
    @FormField() subTechStack?: string,
    @FormField() envInfo?: string,
  ): Promise<Result<string>> {
    const apply = {
      repoUrl,
      comment,
      applicantEmail,
      username,
      alternativeProjectId,
      expandField1,
      techStack,
      employeeNumber,
      buName,
      isBuOwner,
      subTechStack,
      envInfo,
      type: Number(type),
    } as NewProjectApply;
    if (apply.type === 3 && !file) {
      return Result.fail(400, 'no benchmark file!');
    }
    return newProjectApply(apply, file);
  }

  @Get('existsApplication')
  public async existsApplication(@Query() username: string, @Query() repoUrl: string) {
    return existsApplication(username, repoUrl);
  }

  @Get('getApplyRecord')
  public async getApplyRecordByEmployeeNumber(
    @Query() employeeNumber: string,
    @Query() buName: string,
    @Query() isBuOwner: boolean,
  ) {
    return Result.ignoreErrorWithDefault(
      () => getApplyRecordByEmployeeNumber(employeeNumber, buName, isBuOwner),
      {},
    );
  }

  @Delete('deleteApplyRecord')
  public async deleteApplyRecord(@Query() id: string, @Query() employeeNumber: string) {
    return deleteApplicationById(id, employeeNumber);
  }

  @Post('exportApplyRecord')
  public async exportApplyRecord(
    @Body() body: { employeeNumber: string; buName: string; isBuOwner: boolean },
  ): Promise<Readable> {
    const { employeeNumber, buName, isBuOwner } = body;
    const fileName = `apply_record_${buName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    this.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    this.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

    return exportApplyRecordToExcel(employeeNumber, buName, isBuOwner);
  }
}
