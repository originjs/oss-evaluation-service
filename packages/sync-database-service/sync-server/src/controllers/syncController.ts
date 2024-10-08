import { Controller, Route, Get } from 'tsoa';
import { executeDatabaseSync } from '../service/syncService.js';
import { Result } from '@orginjs/oss-evaluation-util';

@Route('syncData')
export class SyncDatabaseController extends Controller {
  @Get('execSync')
  public async execSync() {
    try {
      return await executeDatabaseSync();
    } catch (e) {
      return Result.fail(e.message);
    }
  }
}
