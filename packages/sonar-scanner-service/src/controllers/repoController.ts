import { Controller, Route, Post, Body } from 'tsoa';
import type { GitCloneParam } from '../interfaces/param';
import { Result } from '../utils/result.js';
import { getCodeLines } from '../services/repoService.js';

@Route('repo')
export class RepoController extends Controller {
  @Post('getCodeSize')
  public scan(@Body() repoInfo: GitCloneParam): Result<string> {
    getCodeLines(repoInfo);
    return Result.ok('commit task success');
  }
}
