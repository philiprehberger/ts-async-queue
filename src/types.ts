export interface QueueOptions {
  concurrency?: number;
  signal?: AbortSignal;
}

export interface AddOptions {
  priority?: number;
}

export interface AsyncQueue {
  add<T>(fn: () => Promise<T>, options?: AddOptions): Promise<T>;
  pause(): void;
  resume(): void;
  clear(): void;
  onIdle(): Promise<void>;
  onEmpty(): Promise<void>;
  readonly size: number;
  readonly running: number;
  readonly isPaused: boolean;
}
