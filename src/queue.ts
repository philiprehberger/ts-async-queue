import type { QueueOptions, AddOptions, AsyncQueue } from './types.js';

interface PendingTask {
  fn: () => Promise<unknown>;
  priority: number;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export function createQueue(options: QueueOptions = {}): AsyncQueue {
  const concurrency = options.concurrency ?? Infinity;
  const pending: PendingTask[] = [];
  let _running = 0;
  let _paused = false;

  const idleListeners: Array<() => void> = [];
  const emptyListeners: Array<() => void> = [];

  function notifyIdle(): void {
    if (_running === 0 && pending.length === 0) {
      for (const listener of idleListeners.splice(0)) {
        listener();
      }
    }
  }

  function notifyEmpty(): void {
    if (pending.length === 0) {
      for (const listener of emptyListeners.splice(0)) {
        listener();
      }
    }
  }

  function dequeue(): void {
    while (!_paused && _running < concurrency && pending.length > 0) {
      const task = pending.shift()!;
      _running++;
      notifyEmpty();

      task
        .fn()
        .then(
          (value) => task.resolve(value),
          (err) => task.reject(err),
        )
        .finally(() => {
          _running--;
          notifyIdle();
          dequeue();
        });
    }

    notifyEmpty();
    notifyIdle();
  }

  function clearQueue(): void {
    const tasks = pending.splice(0);
    for (const task of tasks) {
      task.reject(new Error('Queue was cleared'));
    }
    notifyEmpty();
    notifyIdle();
  }

  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      () => {
        clearQueue();
      },
      { once: true },
    );
  }

  const queue: AsyncQueue = {
    add<T>(fn: () => Promise<T>, addOptions: AddOptions = {}): Promise<T> {
      const priority = addOptions.priority ?? 0;

      return new Promise<T>((resolve, reject) => {
        const task: PendingTask = {
          fn: fn as () => Promise<unknown>,
          priority,
          resolve: resolve as (value: unknown) => void,
          reject,
        };

        // Insert in sorted position (higher priority first, FIFO within same priority)
        let inserted = false;
        for (let i = 0; i < pending.length; i++) {
          if (pending[i]!.priority < priority) {
            pending.splice(i, 0, task);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          pending.push(task);
        }

        dequeue();
      });
    },

    pause(): void {
      _paused = true;
    },

    resume(): void {
      _paused = false;
      dequeue();
    },

    clear(): void {
      clearQueue();
    },

    onIdle(): Promise<void> {
      if (_running === 0 && pending.length === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        idleListeners.push(resolve);
      });
    },

    onEmpty(): Promise<void> {
      if (pending.length === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        emptyListeners.push(resolve);
      });
    },

    get size(): number {
      return pending.length;
    },

    get running(): number {
      return _running;
    },

    get isPaused(): boolean {
      return _paused;
    },
  };

  return queue;
}
