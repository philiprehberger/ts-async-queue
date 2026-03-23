# Changelog

## 0.1.5

- Standardize README badges and CHANGELOG formatting

## 0.1.4

- Standardize package.json configuration

## 0.1.3

- Version bump for republish

## 0.1.2

- Version bump for republish

## 0.1.1

- Add publish workflow

## 0.1.0

- `createQueue` factory with configurable concurrency
- `add` method with priority support (higher priority runs first)
- `pause` / `resume` flow control
- `onIdle` promise that resolves when all tasks complete
- `onEmpty` promise that resolves when the queue is empty
- `AbortSignal` support for cancelling the queue
- `size`, `running`, and `isPaused` read-only properties
