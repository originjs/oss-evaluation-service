import { Controller, Route, Post, Body, Tags } from 'tsoa';
import type { RepoList } from '../interfaces/SoftwareInfo';
import { Result } from '../utils/result.js';
import { getTechnologyClassificationBatch } from '../services/AiClassificationService.js';

@Tags('AI分类')
@Route('aiClassification')
export class AiClassificationController extends Controller {
  @Post('/getTechnologyClassificationBatch')
  public async getTechnologyClassificationBatch(@Body() repoList: RepoList): Promise<Result<any>> {
    const result = await getTechnologyClassificationBatch(repoList);
    return Result.ok(result);
  }
}
