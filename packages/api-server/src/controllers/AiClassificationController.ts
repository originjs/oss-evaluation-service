import { Controller, Route, Post, Body, Tags } from 'tsoa';
import type { RepoInfo, RepoList } from '../interfaces/SoftwareInfo';
import { Result } from '../utils/result.js';
import {
  getTechnologyClassificationBatch,
  getTechnologyClassificationSingle,
} from '../services/AiClassificationService.js';

@Tags('AI分类')
@Route('aiClassification')
export class AiClassificationController extends Controller {
  @Post('/getTechnologyClassificationBatch')
  public async getTechnologyClassificationBatch(@Body() repoList: RepoList): Promise<Result<any>> {
    const result = await getTechnologyClassificationBatch(repoList);
    return Result.ok(result);
  }
  @Post('/getTechnologyClassificationSingle')
  public async getTechnologyClassificationSingle(@Body() repoInfo: RepoInfo): Promise<Result<any>> {
    const result = await getTechnologyClassificationSingle(repoInfo);
    return Result.ok(result);
  }
}
