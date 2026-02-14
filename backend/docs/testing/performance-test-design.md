# Performance Test Design

## Goals

- Verify that class-related workflows run reliably at realistic-to-heavy local scale.
- Surface practical latency/throughput/error signals.
- Keep initial model simple (uniform traffic), domain-aware, and runnable on developer machines.

## Non-goals

- CI gating or hard SLO thresholds.
- DB-level profiling/lock metrics.
- Production-grade regression dashboarding.

## Test suite placement

- New suite directory: `backend/src/test/performance/`
- Reuse bootstrap patterns from existing simulation helpers where practical.

## Workload model

The workload follows domain flow rather than synthetic random endpoint spam.

1. Bootstrap data:
   - customers: `1000`
   - instructors: `250`
   - slots per instructor: `10`
   - multiple plans with different weekly class counts
   - each customer gets random subscriptions count in `1..3`
2. Register recurring classes.
3. Simulate time period day-by-day (example: `2025-01-01` to `2025-03-31`).
4. For each simulated day:
   - execute configured count of operations (uniform selection)
   - ensure scheduled classes for the day are fully processed (complete or cancel) before advancing day
5. At month boundaries, trigger class generation for upcoming period.

## Execution model

- Single-node app process.
- Concurrent clients simulated via async/await + parallel request batches.
- Fake clock control via Vitest time APIs.
- Isolated local DB through test setup (Testcontainers-compatible approach).

## Metrics (application-level only)

Collect and report per endpoint + aggregate:

- total request count
- success/failure counts
- error breakdown (HTTP status + errorType when available)
- latency p50/p95/p99
- throughput (requests/sec)

## Invariants (checked at end of full run)

- No double-booked instructor slot (same instructor+datetime).
- No class assigned to an unavailable instructor slot.
- No unresolved invalid states for processed classes in the simulated period.

## Output format

- Human-readable markdown report written to file.
- Include:
  - test config snapshot (seed, scale, period, operation budget)
  - summary table of endpoint metrics
  - invariant check results

## Proposed command interface

- `npm run test:performance`
- Optional flags/env:
  - `PERF_SEED=123456`
  - `PERF_START_DATE=2025-01-01`
  - `PERF_END_DATE=2025-03-31`
  - `PERF_DAILY_OPERATIONS=<n>`
  - `PERF_OUTPUT=./artifacts/performance-report.md`

## Operational policy

- Run locally (developer machine), non-blocking.
- Any exception or unexpected operation error should fail the run.

## Future extensions (post-v1)

- Run against deployed environment with configurable server URL.
- Externalized isolated DB configuration for shared staging-style runs.
- Optional regression comparison reports.
