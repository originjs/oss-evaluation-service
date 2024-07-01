import { parentPort } from 'worker_threads';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';

function execCommand(command: string): Result<string> {
  if (!command) {
    throw new Error('the command is empty!');
  }
  const commandResult = shelljs.exec(command);
  //   because promise cant clone,use a instead of Result
  return commandResult.code === 0
    ? Result.ok(commandResult.stdout)
    : Result.fail(commandResult.stderr);
}

parentPort.on('message', command => {
  try {
    logger.info(`shell worker start exec:{${command}}`);
    const startTime = new Date();
    const result = execCommand(command);
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    logger.info(`shell worker end:{${duration}s} exec:{${command}}`);
    parentPort.postMessage(result);
  } catch (e) {
    parentPort.postMessage(Result.fail(e.message));
  }
});
