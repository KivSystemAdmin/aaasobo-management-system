# Date-critical workflow validation

Validation date: 2026-08-28 JST

## Results

| Layer                | Environment / profile                                                        | Coverage                                                                                                                                                                                                                                                                                                    | Result                                                                                  |
| -------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Backend API          | Disposable Testcontainers PostgreSQL, frozen clock                           | JST day/month boundaries, 28/29/30/31-day and year transitions, selected-weekday recurrence, exact seven-day update boundary, finite schedule periods, regular 3-hour and free-trial 72-hour cutoffs immediately before/at/after, early-morning monthly generation, absences, and duplicate-safe generation | Pass                                                                                    |
| Schedule API         | Disposable Testcontainers PostgreSQL                                         | Schedule creation/versioning, half-open periods, adjacent and gapped versions, removed recurring slots, absences, and booked/completed slot filtering                                                                                                                                                       | Pass                                                                                    |
| Concurrency          | Disposable Testcontainers PostgreSQL                                         | Simultaneous booking, schedule-update versus booking, and absence versus booking                                                                                                                                                                                                                            | Pass (3/3)                                                                              |
| UI workflow          | Disposable local PostgreSQL; desktop Chromium; Canada/Eastern and Asia/Tokyo | Fixture import, regular-class replacement, recurrence/history persistence, monthly generation repeated twice, customer cancellation, instructor cross-role verification, schedule-version creation with half-open boundaries, unrelated-record isolation, and historical/upcoming state                      | Pass (5/5 desktop journeys)                                                             |
| UI workflow          | Disposable local PostgreSQL; Mobile Safari iPhone profile on Chromium; UTC   | Customer cancellation and persisted state after reload                                                                                                                                                                                                                                                      | Pass (1/1 mobile journey)                                                               |
| Full local pipeline  | Shared, frontend, and backend                                                | Format, lint, unused exports, production build, and complete API suite                                                                                                                                                                                                                                      | Pass                                                                                    |
| Deployed UI workflow | Vercel dev frontend/backend; desktop Chromium and Mobile Safari iPhone profile | Same deterministic fixture import, UI mutations, cross-role persistence, reloads, Canada/Eastern, Asia/Tokyo, and UTC                                                                                                                                                                                        | Pass (6/6)                                                                              |

Browser console errors and failed requests fail the Playwright suite. Screenshots
and traces are retained only for failures.

## Defects fixed

- Monthly generation treated UTC month boundaries as JST boundaries, omitting or
  misclassifying classes before 09:00 JST on the first or last day.
- Absence matching added nine hours to already-UTC class instants, preventing
  exact absence/class matches during monthly generation.
- A recurring class beginning on the selected start-date weekday was incorrectly
  deferred by one week.
- The exact seven-day regular-class update boundary was calculated from the UTC
  date instead of the current JST calendar date.
- Recurring-class creation rejected slots belonging to an active finite schedule
  version because it only accepted open-ended schedules.
- Replacing a recurring class with the same slot treated the old recurrence's
  first future class as a conflict at the half-open replacement boundary.
- Regular-class and schedule-version date inputs used the browser's local date
  instead of the JST business date for their defaults and minimum values.
- The deterministic acceptance fixture generated 110 rather than the required
  120 children.
- Deployed authentication could pass through the expected server-side
  `/auth/post-login` transition for longer than the setup's five-second wait.
- Role-login tests navigated away from the authenticated landing page while its
  calendar request was still in flight, producing false console failures on a
  slower deployed backend.

## Regression coverage added

- Frozen JST month ranges for 28-, 29-, 30-, and 31-day boundaries and the
  December-January transition.
- Frozen early-morning JST date keys and exact JST calendar rollover.
- Exact seven-day recurring update behavior on both sides of JST midnight.
- Exact regular and free-trial booking cutoffs immediately before, at, and after
  their deadlines.
- January generation at 00:30 JST, including first/last occurrences, an exact
  instructor absence, and repeated duplicate-safe generation.
- Deterministic fixture scaling assertions for 12 children per instructor.
- Same-slot recurring-class replacement without a gap or overlap, while
  preserving past attendance.
- UI-first regular-class replacement, schedule-version creation, and customer
  cancellation, with API reads used only for persistence verification.
- Customer cancellation on a Mobile Safari device profile with persistence
  verified after reload.
- Bounded serverless login waits and network-idle role transitions, preserving
  the console/network failure gate without suppressing genuine failures.

## Residual risk

- The Mobile Safari device profile validates viewport, touch behavior, and user
  agent on Chromium. Native WebKit is not exercised on this Linux host.
- The current E2E suite mutates regular-class replacement, schedule-version
  creation, monthly generation, and cancellation through the UI. Regular-class
  creation, schedule insertion between two existing versions, slot-level
  add/remove/retain combinations, and both rebooking orderings remain primarily
  covered at the API/service layer rather than as browser journeys.
- The deployed environment completed the fixture import and workflows without
  visible integration errors, but its email/test-sink configuration was not
  independently inspected.
