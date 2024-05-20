import { Controller, Route, Post, Body } from 'tsoa';
import type { SonarScanParam } from '../interfaces/RepoInfo.js'
import { Result } from '../utils/result.js';
import { scan } from '../services/SonarService.js';

@Route('sonar')
export class SonarController extends Controller {
  @Post('scan')
  public async scan(@Body() info: SonarScanParam): Promise<Result<boolean>> {
    const data = await scan(info);
    return Result.ok(data);
  }
}
