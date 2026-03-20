# Changelog

All notable changes to this project will be documented in this file.

## 0.1.3

- Version bump for republish

## 0.1.2

- Version bump for republish

## [0.1.1] - 2026-03-20

- Add publish workflow

## [0.1.0] - 2026-03-20

### Added

- `createQueue` factory with configurable concurrency
- `add` method with priority support (higher priority runs first)
- `pause` / `resume` flow control
- `onIdle` promise that resolves when all tasks complete
- `onEmpty` promise that resolves when the queue is empty
- `AbortSignal` support for cancelling the queue
- `size`, `running`, and `isPaused` read-only properties
