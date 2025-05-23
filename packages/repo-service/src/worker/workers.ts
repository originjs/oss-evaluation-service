import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkerPool } from './workerPool.js';
import type { SonarScanParam, RepoCloneParam } from '../interfaces/param';
import type { Result } from '../utils/result';

// thread pool for git and sonar scanner
const sonarScannerWorkerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  './sonarScannerWorker.js',
);
const gitWorkerPath = join(dirname(fileURLToPath(import.meta.url)), './gitWorker.js');
// if the machine's performance is sufficient, you can try increasing the number of workers(change size param)
const sonarScannerThreadPool = new WorkerPool<SonarScanParam, Result<SonarScanParam>>(
  'sonar scanner workers',
  sonarScannerWorkerPath,
  1,
);
const gitThreadPool = new WorkerPool<RepoCloneParam, Result<RepoCloneParam>>(
  'git clone workers',
  gitWorkerPath,
  1,
);

const shellWorkerPath = join(dirname(fileURLToPath(import.meta.url)), './shellWorker.js');
const shellThreadPool = new WorkerPool<string, Result<string>>('shell workers', shellWorkerPath, 1);

export {
  sonarScannerThreadPool as sonarScannerThreadPool,
  gitThreadPool as gitCloneThreadPool,
  shellThreadPool,
};
