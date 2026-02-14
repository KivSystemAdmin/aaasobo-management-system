# Concurrency Test Design

## Goals

- Validate correctness under race conditions for class booking workflows.
- Catch data integrity bugs that do not appear in regular API tests.
- Keep scenarios deterministic and reproducible.

## Non-goals

- Randomized mixed/fuzz concurrency execution.
- Response code normalization (for now we tolerate existing inconsistency where appropriate).
- Performance benchmarking.

## Test suite placement

- New suite directory: `backend/src/test/concurrency/`
- Existing `simulation` tests can be referenced and gradually moved/renamed into this suite.

## Execution model

- Use Vitest + supertest against the real app server.
- Use fixed clock (`vi.useFakeTimers`, `vi.setSystemTime`) for deterministic behavior.
- Use fixed seed by default; allow overriding via CLI/env in runner helpers.
- Repetition count is configurable.
  - Default: `1`
  - Override: `CONCURRENCY_REPETITIONS=<n>`

## Scenarios

### C1. Double booking race (same instructor + same datetime)

**Intent**

- Ensure only one booking/rebook can win for the same instructor slot when requests are concurrent.

**Setup**

- One instructor.
- Two or more customers with rebookable classes.
- Same target datetime for all concurrent requests.

**Operation**

- Execute requests in parallel (`Promise.all`) for the same instructor+slot.

**Expected**

- Exactly one request succeeds.
- Remaining requests fail with conflict-like response.
- DB invariant: exactly one booked/rebooked class for that instructor+datetime.

### C2. Absence creation vs booking race (same instructor + same datetime)

**Intent**

- Ensure system stays consistent when admin marks absence while customer books/rebooks the same slot.

**Setup**

- One instructor with available slot at target datetime.
- Customer with class eligible for booking/rebooking.
- Admin operation to create absence for same instructor+datetime.

**Operation**

- Run absence create request and booking/rebooking request concurrently.

**Expected**

- Only one path wins in a consistent way:
  - booking succeeds and absence is rejected/conflicted, or
  - absence succeeds and booking is rejected as unavailable/conflicted.
- DB invariants after completion:
  - no contradictory final state (no class confirmed at a slot that is effectively blocked by accepted absence logic).
  - exactly one final truth for that instructor+datetime.

### C3. Schedule update vs booking race (slot being removed)

**Intent**

- Ensure consistency when an admin updates an instructor schedule and removes a slot while a customer books/rebooks that same slot concurrently.

**Setup**

- One instructor with an active schedule that includes the target slot.
- A schedule update payload that removes the target slot from the next effective schedule.
- A customer with class eligible for booking/rebooking to that target slot.

**Operation**

- Execute schedule update request and booking/rebooking request concurrently.

**Expected**

- Only one path wins in a consistent way:
  - booking/rebooking succeeds and schedule update is rejected/conflicted, or
  - schedule update succeeds and booking/rebooking is rejected as unavailable/conflicted.
- DB invariants after completion:
  - no class remains confirmed in a slot removed by the accepted schedule version.
  - final schedule and class records describe one consistent state for that instructor+datetime.

## Invariants to assert in every concurrency test

- No double booking for same instructor+datetime.
- No class in impossible status transition for the scenario under test.
- All assertions are made against persisted DB state, not only response payloads.

## Proposed command interface

- `npm run test:concurrency`
- Optional flags/env:
  - `CONCURRENCY_REPETITIONS=1`
  - `CONCURRENCY_SEED=123456`
  - `CONCURRENCY_SCENARIO=C1|C2|C3` (optional filter)

## CI policy

- Concurrency tests are intended to be lightweight and merge-gate candidates.
- Keep data setup minimal per test to avoid flaky runtime.
