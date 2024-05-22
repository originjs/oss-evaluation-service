import { Worker } from 'worker_threads';

type Task = any;

interface QueueItem {
  task: Task;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export class WorkerPool {
  private availableWorkers: Worker[];
  private queue: QueueItem[];

  constructor(file: string, size: number) {
    this.availableWorkers = [];
    this.queue = [];
    for (let i = 0; i < size; i++) {
      this.availableWorkers.push(new Worker(file));
    }
  }

  run(task: Task): Promise<any> {
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
    task: Task,
    resolve: (value: any) => void,
    reject: (reason: any) => void,
  ): void {
    worker.postMessage(task);
    worker.once('message', result => {
      resolve(result);
      if (this.queue.length > 0) {
        const { task, resolve, reject } = this.queue.shift()!;
        this.runWorker(worker, task, resolve, reject);
      } else {
        this.availableWorkers.push(worker);
      }
    });
    worker.once('error', reject);
  }
}
