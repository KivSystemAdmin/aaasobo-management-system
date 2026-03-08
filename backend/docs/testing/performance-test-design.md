# Performance Test Design

## Goals

- Verify that class-related workflows run reliably at realistic-to-heavy local scale.
- Surface practical latency/throughput/error signals.
- Keep initial model simple, domain-aware, and runnable on developer machines.

## Non-goals

- CI gating or hard SLO thresholds.
- DB-level profiling/lock metrics.
- Production-grade regression dashboarding.

## Test suite placement

- Suite directory: `backend/src/test/performance/`
- Reuse bootstrap patterns from existing simulation helpers where practical.

## Workload model

The workload follows domain flow rather than synthetic random endpoint spam.

1. Bootstrap data:
   - customers: configurable via `PERF_CUSTOMERS`
   - instructors: configurable via `PERF_INSTRUCTORS`
   - slots per instructor: configurable via `PERF_SLOTS_PER_INSTRUCTOR`
   - one recurring-class setup per customer to generate ongoing classes
2. Simulate time period day-by-day (example: `2025-01-01` to `2025-01-31`).
3. For each simulated day:
   - customer daily operation (except last week of run):
     - each customer rolls a random chance (`PERF_CANCEL_PROBABILITY`)
     - on success, pick one random cancel target among customer future classes
       (`status in [pending, booked, rebooked]`, at least 24h ahead)
     - cancel it via API
     - fetch next-7-day available slots and pick one random slot/instructor
     - rebook canceled class to the picked slot
   - admin daily operation:
     - each instructor fetches calendar classes
     - classes scheduled on that day and in completable statuses are marked completed
4. During the final 7 simulated days, customer cancel/rebook operation is skipped so
   no new classes are created outside the completion horizon.
5. After the final day, count and report rebookable classes for all customers.

## Execution model

- Single-node app process.
- Concurrent clients simulated via async/await + parallel request batches.
- Fake clock control via Vitest time APIs.
- Isolated local DB through test setup (Testcontainers-compatible approach).

## Metrics (application-level only)

Collect and report aggregate metrics including:

- total completion count
- cancel attempts/success/skipped-no-target
- rebook attempts/success/skipped-no-slot/business-errors
- rebookable class count at end of run
- overall latency stats (min/max/avg/median)
- operation-level average latency (fetch/complete/cancel/rebook)
- operation errors

## Invariants (checked at end of full run)

- No unexpected operation errors (5xx-level or malformed responses).
- Workload completes full day range.
- Class completion workload continues to function while customer cancel/rebook traffic is present.

## Output format

- Human-readable markdown report written to file.
- Include:
  - test config snapshot (seed, scale, period, probabilities)
  - summary counters and latency metrics
  - detailed error list

## Proposed command interface

- `npm run test:performance`
- Optional env:
  - `PERF_SEED=123456`
  - `PERF_START_DATE=2025-01-01`
  - `PERF_END_DATE=2025-01-31`
  - `PERF_CUSTOMERS=<n>`
  - `PERF_INSTRUCTORS=<n>`
  - `PERF_SLOTS_PER_INSTRUCTOR=<n>`
  - `PERF_CANCEL_PROBABILITY=0.25`
  - `PERF_OUTPUT=./logs/performance-report.md`

## Operational policy

- Run locally (developer machine), non-blocking.
- Unexpected server errors should fail the run.

## Future extensions

- Add multiple-seed batch runs for bug-hunting mode.
- Run against deployed environment with configurable server URL.
- Externalized isolated DB configuration for shared staging-style runs.
- Optional regression comparison reports.
