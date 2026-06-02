import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkerPool } from './workerPool.js';
import type { Result } from '../utils/result';

const shellWithCloneWorkerPath = join(dirname(fileURLToPath(import.meta.url)), './shellWithCloneWorker.js');


// shell worker也内嵌了git clone逻辑
const shellThreadPool = new WorkerPool<any, Result<string>>('shell workers', shellWithCloneWorkerPath, 1);

export { shellThreadPool };
