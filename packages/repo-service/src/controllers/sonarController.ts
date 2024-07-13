import { Controller, Route, Post, Body } from 'tsoa';
import type { SonarScanParam } from '../interfaces/param';
import { Result } from '../utils/result.js';
import { scan } from '../services/sonarService.js';

@Route('sonar')
export class SonarController extends Controller {
  @Post('scan')
  public scan(@Body() info: SonarScanParam): Result<string> {
    try {
      scan(info);
    } catch (_) {
      /* empty */
    }
    return Result.ok('commit task success');
  }
}
