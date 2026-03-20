import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQueue } from '../../dist/index.js';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('async-queue', () => {
  it('respects concurrency limit', async () => {
    const queue = createQueue({ concurrency: 2 });
    let concurrent = 0;
    let maxConcurrent = 0;

    const task = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await delay(50);
      concurrent--;
    };

    queue.add(task);
    queue.add(task);
    queue.add(task);
    queue.add(task);

    await queue.onIdle();
    assert.strictEqual(maxConcurrent, 2);
  });

  it('higher priority tasks run first', async () => {
    const queue = createQueue({ concurrency: 1 });
    const order: string[] = [];

    // Add a slow task to occupy the queue
    queue.add(async () => {
      await delay(50);
      order.push('first');
    });

    // While first task is running, add tasks with different priorities
    queue.add(
      async () => {
        order.push('low');
      },
      { priority: 1 },
    );

    queue.add(
      async () => {
        order.push('high');
      },
      { priority: 10 },
    );

    queue.add(
      async () => {
        order.push('medium');
      },
      { priority: 5 },
    );

    await queue.onIdle();
    assert.deepStrictEqual(order, ['first', 'high', 'medium', 'low']);
  });

  it('pause and resume works', async () => {
    const queue = createQueue({ concurrency: 1 });
    const order: string[] = [];

    queue.pause();

    queue.add(async () => {
      order.push('a');
    });
    queue.add(async () => {
      order.push('b');
    });

    assert.strictEqual(queue.isPaused, true);
    assert.strictEqual(queue.size, 2);

    // Nothing should have run yet
    await delay(50);
    assert.deepStrictEqual(order, []);

    queue.resume();
    assert.strictEqual(queue.isPaused, false);

    await queue.onIdle();
    assert.deepStrictEqual(order, ['a', 'b']);
  });

  it('clear rejects pending tasks', async () => {
    const queue = createQueue({ concurrency: 1 });

    // Occupy the queue
    queue.add(async () => {
      await delay(100);
    });

    // These will be pending
    const pendingPromise = queue.add(async () => 'should not run');

    await delay(10);
    queue.clear();

    await assert.rejects(pendingPromise, { message: 'Queue was cleared' });
  });

  it('onIdle resolves when all tasks are done', async () => {
    const queue = createQueue({ concurrency: 2 });
    let completed = 0;

    queue.add(async () => {
      await delay(30);
      completed++;
    });
    queue.add(async () => {
      await delay(50);
      completed++;
    });
    queue.add(async () => {
      await delay(20);
      completed++;
    });

    await queue.onIdle();
    assert.strictEqual(completed, 3);
  });

  it('onEmpty resolves when queue has no pending tasks', async () => {
    const queue = createQueue({ concurrency: 1 });

    queue.add(async () => {
      await delay(50);
    });
    queue.add(async () => {
      await delay(50);
    });
    queue.add(async () => {
      await delay(50);
    });

    await queue.onEmpty();
    // All tasks should have started (no more pending), but some may still be running
    assert.strictEqual(queue.size, 0);
  });

  it('size and running report correctly', async () => {
    const queue = createQueue({ concurrency: 1 });

    assert.strictEqual(queue.size, 0);
    assert.strictEqual(queue.running, 0);

    queue.add(async () => {
      await delay(100);
    });
    queue.add(async () => {
      await delay(100);
    });
    queue.add(async () => {
      await delay(100);
    });

    // Give the first task time to start
    await delay(10);

    assert.strictEqual(queue.running, 1);
    assert.strictEqual(queue.size, 2);

    await queue.onIdle();
    assert.strictEqual(queue.running, 0);
    assert.strictEqual(queue.size, 0);
  });

  it('onIdle resolves immediately when queue is empty', async () => {
    const queue = createQueue({ concurrency: 1 });
    await queue.onIdle(); // should resolve immediately
  });

  it('abort signal clears the queue', async () => {
    const controller = new AbortController();
    const queue = createQueue({ concurrency: 1, signal: controller.signal });

    queue.add(async () => {
      await delay(100);
    });

    const pendingPromise = queue.add(async () => 'should not run');

    await delay(10);
    controller.abort();

    await assert.rejects(pendingPromise, { message: 'Queue was cleared' });
  });
});
