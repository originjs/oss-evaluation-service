import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkerPool } from './workerPool.js';
import type { SonarScanParam } from '../interfaces/param';
import type { Result } from '../utils/result';

// thread pool for sonar scanner and shell
const sonarScannerWorkerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  './sonarScannerWorker.js',
);
const shellWithCloneWorkerPath = join(dirname(fileURLToPath(import.meta.url)), './shellWithCloneWorker.js');

// 不再需要独立的git worker，因为git clone已经内嵌到各个worker中
// const gitThreadPool = ...

// sonar worker已经内嵌了git clone逻辑
const sonarScannerThreadPool = new WorkerPool<SonarScanParam, Result<SonarScanParam>>(
  'sonar scanner workers',
  sonarScannerWorkerPath,
  1, // 限制并发数，避免磁盘空间问题
);

// shell worker也内嵌了git clone逻辑
const shellThreadPool = new WorkerPool<any, Result<string>>('shell workers', shellWithCloneWorkerPath, 1);

export {
  sonarScannerThreadPool as sonarScannerThreadPool,
  shellThreadPool,
};
