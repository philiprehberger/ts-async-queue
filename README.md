# @philiprehberger/async-queue

[![CI](https://github.com/philiprehberger/ts-async-queue/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-async-queue/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/async-queue.svg)](https://www.npmjs.com/package/@philiprehberger/async-queue)
[![License](https://img.shields.io/github/license/philiprehberger/ts-async-queue)](LICENSE)

Priority queue for async tasks with concurrency control

## Installation

```bash
npm install @philiprehberger/async-queue
```

## Usage

```ts
import { createQueue } from '@philiprehberger/async-queue';

const queue = createQueue({ concurrency: 2 });

queue.add(() => fetch('/api/one'));
queue.add(() => fetch('/api/two'));
queue.add(() => fetch('/api/urgent'), { priority: 10 });

await queue.onIdle();
console.log('All tasks complete');
```

### Pause and resume

```ts
queue.pause();
queue.add(() => fetch('/api/deferred'));
queue.resume(); // queued tasks start executing
```

### Abort signal

```ts
const controller = new AbortController();
const queue = createQueue({ concurrency: 3, signal: controller.signal });

queue.add(() => longRunningTask());
controller.abort(); // clears pending tasks
```

## API

| Export | Description |
| --- | --- |
| `createQueue(options?)` | Create a new async queue instance |
| `QueueOptions.concurrency` | Max concurrent tasks (default: `Infinity`) |
| `QueueOptions.signal` | `AbortSignal` to cancel the queue |
| `queue.add(fn, options?)` | Add a task; returns a promise for its result |
| `AddOptions.priority` | Higher number = higher priority (default: `0`) |
| `queue.pause()` | Pause task execution |
| `queue.resume()` | Resume task execution |
| `queue.clear()` | Reject and remove all pending tasks |
| `queue.onIdle()` | Promise that resolves when queue is idle |
| `queue.onEmpty()` | Promise that resolves when no pending tasks remain |
| `queue.size` | Number of pending tasks |
| `queue.running` | Number of currently running tasks |
| `queue.isPaused` | Whether the queue is paused |

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
