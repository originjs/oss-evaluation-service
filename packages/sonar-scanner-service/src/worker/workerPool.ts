import { Worker } from 'worker_threads';
import { logger } from '@orginjs/oss-evaluation-data-model';

interface QueueItem<T, G> {
  task: T;
  resolve: (value: G) => void;
  reject: (reason: any) => void;
}

export class WorkerPool<T, G> {
  private availableWorkers: Worker[];
  private queue: QueueItem<T, G>[];
  private readonly name: string;

  constructor(name: string, file: string, size: number) {
    this.availableWorkers = [];
    this.queue = [];
    this.name = name;
    for (let i = 0; i < size; i++) {
      this.availableWorkers.push(new Worker(file));
    }
  }

  run(task: T): Promise<G> {
    return new Promise((resolve, reject) => {
      if (this.availableWorkers.length === 0) {
        this.queue.push({ task, resolve, reject });
      } else {
        this.runWorker(this.availableWorkers.pop()!, task, resolve, reject);
      }
    });
  }

  private runWorker(
    worker: Worker,
    task: T,
    resolve: (value: G) => void,
    reject: (reason: any) => void,
  ): void {
    worker.once('message', result => {
      logger.info(
        `There are still ${this.queue.length} tasks currently in ${this.name} workers pool`,
      );
      resolve(result);
      if (this.queue.length > 0) {
        const { task, resolve, reject } = this.queue.shift()!;
        this.runWorker(worker, task, resolve, reject);
      } else {
        this.availableWorkers.push(worker);
      }
    });
    worker.once('error', reject);
    worker.postMessage(task);
  }
}
