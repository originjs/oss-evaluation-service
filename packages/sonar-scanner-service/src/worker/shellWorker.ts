import { parentPort } from 'worker_threads';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';

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
    const result = execCommand(command);
    parentPort.postMessage(result);
  } catch (e) {
    parentPort.postMessage(Result.fail(e.message));
  }
});
