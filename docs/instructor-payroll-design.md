# Instructor Payroll Design

## Status

- Owner: TBD
- Status: Draft
- Last updated: 2026-03-09

## Purpose

Add an instructor payroll feature to the admin dashboard that calculates pay for one instructor for the current month, split into the two operational payroll periods:

- `1st to 15th`
- `16th to last day`

The feature must show not only the total amount to pay, but also the reasoning behind it so admins can verify the result while processing payments manually.

## Scope

### In scope

- Store instructor fee history with effective periods.
- Store class cancellation timestamp via `Class.canceledAt`.
- Calculate payroll for one instructor for a given month.
- Show both payroll halves for the month in the admin instructor page.
- Show category counts, subtotals, total, applied fee periods, and `sourceLastUpdatedAt`.

### Out of scope

- Batch payroll for all instructors.
- Finalize workflow.
- Snapshot tables such as payroll runs or payroll line items.
- CSV export.
- Tax, withholding, or accounting integration.

## Agreed Product Decisions

1. Payroll is a read-only calculation from current data. No saved runs in v1.
2. The UI is a new `Payroll` tab on the admin instructor page.
3. The page shows the current month and always renders both payroll halves. No period selector.
4. The API accepts only `month` in `YYYY-MM` format.
5. Fee record selection uses class `dateTime`, not `canceledAt`.
6. `canceledAt` is used only to classify instructor cancellations as normal cancel vs cancel without notice.
7. `canceledByCustomer` does not contribute to instructor pay.
8. Payroll boundaries and cancellation deadline use Japan time (`Asia/Tokyo`).
9. Fee history editing may change historical payroll inputs. v1 does not guarantee payroll consistency after fee edits; admins are responsible for reviewing and correcting any downstream impact.

## Business Rules

### Fee fields

Each instructor has fee history records with:

- `currency`
- `trialFee`
- `regularFee`
- `cancelFee`
- `cancelWithoutNoticeFee`
- `monthlyCancelFee`
- `effectiveFrom`
- `effectiveTo` nullable

### Payroll periods

For a target month:

- Period A: `1st 00:00:00 JST` to `15th 23:59:59.999 JST`
- Period B: `16th 00:00:00 JST` to `last day 23:59:59.999 JST`

### Payroll categories

- `trial`
  - `status = completed`
  - `isFreeTrial = true`
- `regular`
  - `status = completed`
  - `isFreeTrial = false`
- `cancel`
  - `status = canceledByInstructor`
  - `canceledAt` is before the start of the class day in JST
- `cancelWithoutNotice`
  - `status = canceledByInstructor`
  - `canceledAt` is on or after the start of the class day in JST

### Excluded classes

These do not contribute to instructor pay:

- `canceledByCustomer`
- `booked`
- `pending`
- `rebooked`
- `declined`

### Fee record selection

The applicable fee record is chosen by the class scheduled datetime, `Class.dateTime`.

Example:

- Class scheduled on March 14
- Instructor cancels on March 16
- Use the fee record covering March 14

The monthly cancel fee uses the fee record active on the target month's last JST date. This is independent of which fee records applied to individual canceled classes earlier in the month.

### Monthly cancel fee

Instructor cancellations are counted across the full selected JST month:

- Count only classes with `status = canceledByInstructor`.
- Do not count `canceledByCustomer`.
- Apply the fixed threshold once per 10 instructor cancellations.
- `timesApplied = Math.floor(cancelCount / 10)`.
- `total = timesApplied * monthlyCancelFee`.

The monthly cancel fee is deducted only from the `16-last` payroll period. The `1-15` period still returns the monthly cancel fee response object for a stable API shape, but its `total` is always `0`.

The deduction is period-level, not day-level. It must not create daily breakdown rows. The admin UI may show it as a footer adjustment row above the table total so the table total reconciles with the period total.

### Cancellation deadline rule

The current system rule is not rolling 24 hours. It is based on the JST calendar day:

- before the class day in JST: normal cancel
- on the class day in JST or later: cancel without notice

Current reference implementation:

- [frontend/src/lib/utils/dateUtils.ts](/home/momori/src/github.com/KivSystemAdmin/aaasobo-management-system/frontend/src/lib/utils/dateUtils.ts#L51)
- [frontend/src/lib/utils/validationUtils.ts](/home/momori/src/github.com/KivSystemAdmin/aaasobo-management-system/frontend/src/lib/utils/validationUtils.ts#L15)

## Data Model

### New table: `InstructorFee`

Purpose:

- store instructor fee history with effective periods

Proposed fields:

- `id`
- `instructorId`
- `currency`
- `effectiveFrom` `DateTime @db.Date`
- `effectiveTo` `DateTime? @db.Date`
- `trialFee`
- `regularFee`
- `cancelFee`
- `cancelWithoutNoticeFee`
- `monthlyCancelFee`

Proposed constraints:

- one currency per fee record
- no overlapping fee periods for the same instructor
- `effectiveTo` is exclusive
- open-ended active period allowed via `effectiveTo = null`
- every payable class must match exactly one fee record

Editing behavior:

- admins can add a new fee record with a new `effectiveFrom`
- creating a new fee record sets the previous latest record `effectiveTo` to the same date as the new `effectiveFrom`
- admins can delete only the latest fee record as an undo operation
- deleting the latest fee record reopens the previous fee record by setting its `effectiveTo` back to `null`
- v1 does not block fee edits or deletes based on payroll impact; admins are responsible for maintaining payroll consistency after changes

Currency behavior:

- payroll does not convert currencies
- each applied fee record must carry its currency
- the UI must show currency alongside unit fees, subtotals, and total
- v1 should reject a single payroll period if it mixes multiple currencies across applied fee records
- if the `16-last` period has a monthly cancel fee deduction, its month-end fee currency must match any class fee currency already used in that period

### Schema change: `Class.canceledAt`

Purpose:

- store the timestamp when a class became canceled
- support payroll classification for instructor cancellations

Proposed field:

- `canceledAt DateTime?`

Rules:

- set when `status` becomes `canceledByInstructor`
- set when `status` becomes `canceledByCustomer`
- keep `null` for non-canceled statuses

## Calculation Design

### Inputs

- `instructorId`
- `month` in `YYYY-MM`
- matching instructor classes in the target month
- matching fee records

### Calculation steps

1. Resolve the JST start and end boundaries for the month.
2. Fetch the instructor's classes whose `dateTime` falls within the month.
3. Split classes into the two payroll periods using JST boundaries.
4. Classify each class into one payroll category or exclude it.
5. For included classes, resolve the applicable fee by `dateTime`.
6. Aggregate counts and subtotals by category.
7. Calculate the final total as `trial + regular - cancel - cancelWithoutNotice`.
8. Calculate `sourceLastUpdatedAt` from used class rows only.
9. Return both period summaries in a single response.

### `sourceLastUpdatedAt`

Purpose:

- help admins notice whether source data changed after they last checked a result

Definition:

- max `updatedAt` from:
  - all classes used in the payroll period

## API Spec

### Endpoint

`GET /admins/instructors/:id/payroll?month=YYYY-MM`

### Request

Path params:

- `id`: instructor ID

Query params:

- `month`: target month in `YYYY-MM`

### Response

```json
{
  "instructorId": 123,
  "month": "2026-03",
  "timezone": "Asia/Tokyo",
  "periods": [
    {
      "label": "1-15",
      "from": "2026-03-01",
      "to": "2026-03-15",
      "sourceLastUpdatedAt": "2026-03-15T09:12:00.000Z",
      "currency": "JPY",
      "counts": {
        "trial": 2,
        "regular": 18,
        "cancel": 1,
        "cancelWithoutNotice": 0
      },
      "subtotals": {
        "trial": 2000,
        "regular": 18000,
        "cancel": 500,
        "cancelWithoutNotice": 0
      },
      "total": 19500,
      "monthlyCancelFee": {
        "cancelCount": 10,
        "threshold": 10,
        "unitFee": 0,
        "timesApplied": 0,
        "total": 0
      },
      "appliedFeePeriods": [
        {
          "currency": "JPY",
          "effectiveFrom": "2026-03-01",
          "effectiveTo": "2026-03-15",
          "trialFee": 1000,
          "regularFee": 1000,
          "cancelFee": 500,
          "cancelWithoutNoticeFee": 0,
          "monthlyCancelFee": 1000
        }
      ]
    },
    {
      "label": "16-last",
      "from": "2026-03-16",
      "to": "2026-03-31",
      "sourceLastUpdatedAt": "2026-03-28T03:00:00.000Z",
      "currency": "JPY",
      "counts": {
        "trial": 1,
        "regular": 20,
        "cancel": 0,
        "cancelWithoutNotice": 1
      },
      "subtotals": {
        "trial": 1000,
        "regular": 20000,
        "cancel": 0,
        "cancelWithoutNotice": 0
      },
      "total": 20000,
      "monthlyCancelFee": {
        "cancelCount": 10,
        "threshold": 10,
        "unitFee": 1000,
        "timesApplied": 1,
        "total": 1000
      },
      "appliedFeePeriods": [
        {
          "currency": "JPY",
          "effectiveFrom": "2026-03-16",
          "effectiveTo": null,
          "trialFee": 1000,
          "regularFee": 1000,
          "cancelFee": 500,
          "cancelWithoutNoticeFee": 0,
          "monthlyCancelFee": 1000
        }
      ]
    }
  ]
}
```

### Error handling

- `400`: invalid `month` format
- `404`: instructor not found
- `422`: payable class has no matching fee record
- `422`: monthly cancel fee is needed but no fee record is active on the target month's last day
- `422`: payroll period resolves to multiple currencies
- `500`: unexpected server error

For `422` responses, return:

- `code`: machine-readable error code such as `MISSING_FEE_RATE` or `MULTIPLE_CURRENCIES`
- `message`: short human-readable explanation

## UI Spec

### Placement

Add a new `Payroll` tab to the admin instructor page.

Current tab container:

- [frontend/src/components/admins-dashboard/instructors-dashboard/InstructorDashboardClient.tsx](/home/momori/src/github.com/KivSystemAdmin/aaasobo-management-system/frontend/src/components/admins-dashboard/instructors-dashboard/InstructorDashboardClient.tsx#L1)

### Initial state

- show current month by default
- fetch payroll data once for the selected month
- render both payroll periods without requiring extra admin action

### Each period section shows

- period label
- currency
- counts by category
- unit fee information
- subtotals by category
- final total
  - net of cancel fees
- `sourceLastUpdatedAt`
- applied fee period summary
  - include `monthlyCancelFee` as `Monthly Cancel / 10` with the other unit fees

The daily breakdown table shows class-day rows only and its total is the daily subtotal. Period-level adjustments, such as the monthly cancel fee, are shown below the `16-last` daily breakdown table; the monthly cancel fee section is labeled `Monthly Cancel`, shows the expression `{count} total cancels / 10 = {timesApplied} x {monthlyCancelFee}`, and displays the deducted amount. A session list is out of scope for v1.

## Implementation Plan

### Phase 0: Test-first specification

Goal:

- clarify behavior with tests before implementing new payroll logic

Tasks:

- define and implement the most important payroll test scenarios
- cover payroll classification, fee resolution, JST boundary handling, and error cases

Status:

- [x] completed

### Phase 1: Data model

Goal:

- add the minimum data needed for payroll logic

Tasks:

- add `InstructorFee` model and migration
- add `Class.canceledAt` field and migration
- define allowed currency values for fee records
- define indexes needed for month-based lookup
- update shared types if needed

Status:

- [x] completed

### Phase 2: Cancellation timestamp propagation

Goal:

- ensure `canceledAt` is set consistently everywhere

Tasks:

- audit all code paths that set `canceledByInstructor`
- audit all code paths that set `canceledByCustomer`
- set `canceledAt` when status changes to a canceled state
- verify existing non-cancel updates do not set `canceledAt`

Status:

- [x] completed

### Phase 3: Payroll backend

Goal:

- build deterministic payroll calculation for one instructor and one month

Tasks:

- add payroll calculation service
- add JST month boundary helpers if needed
- resolve fee record by class `dateTime`
- classify instructor cancellations using `canceledAt`
- validate that each payroll period resolves to exactly one currency
- compute counts, subtotals, totals, and `sourceLastUpdatedAt`
- return both payroll halves in one response

Status:

- [x] completed

### Phase 4: Admin API

Goal:

- expose payroll calculation to the frontend

Tasks:

- add `GET /admins/instructors/:id/payroll?month=YYYY-MM`
- validate request params
- map service errors to HTTP responses
- document response contract in code comments or schema

Status:

- [x] completed

### Phase 5: Admin UI

Goal:

- show payroll summary inside the instructor admin page

Tasks:

- add `Payroll` tab to the instructor dashboard
- fetch payroll for current month
- render `1-15` and `16-last` sections
- show counts, subtotals, total, fee periods, and `sourceLastUpdatedAt`
- add loading and error states

Status:

- [x] completed

### Phase 6: Verification and cleanup

Goal:

- prove the feature is stable enough to merge

Tasks:

- run backend tests
- run frontend tests or lint where applicable
- verify admin UI against expected spreadsheet workflow
- confirm all phase checkboxes and findings are updated in this doc

Status:

- [x] completed

### Phase 7: Fee Rate Management UI

Goal:

- allow admins to manage instructor fee history from the instructor admin page

Tasks:

- show the current active fee rate in the `Instructor's Profile` tab
- show fee rate history with effective periods in a collapsed-by-default section
- add a compact form to create a new fee rate with a new `effectiveFrom`
- add latest-rate delete as an undo operation
- when deleting the latest fee rate, set the previous rate `effectiveTo` back to `null`
- show loading, success, and error states for fee rate mutations
- document that admins are responsible for any payroll consistency impact caused by fee edits

Status:

- [x] completed

## Task Log

Use this section to update progress during implementation.

### 2026-03-09

- Drafted v1 design and agreed product decisions.
- Clarified that cancel penalties apply only to `canceledByInstructor`.
- Confirmed current cancellation deadline rule is based on JST same-day boundary, not rolling 24 hours.
- Added Phase 7 for fee rate management in the admin instructor profile.
- Implemented admin instructor fee history endpoints for list, create-latest, and delete-latest undo flows.
- Added the fee rate section to the admin `Instructor's Profile` tab with current rate, collapsed history, and compact mutation UI.
- Verified instructor fee API tests, existing payroll API tests, and frontend lint pass.
- Agreed that fee record selection uses class `dateTime`.
- Agreed to add `Class.canceledAt`.
- Added fee `currency` to the payroll design. No conversion in v1.
- Decided the initial UI is summary only.
- Decided `422` errors return a short `code` and `message`.
- Decided currency is stored as a string validated by `^[A-Z]{3}$`.
- Decided no backfill is needed for missing `canceledAt` because the app is not yet released.
- Merged backend payroll API work and fixed follow-up TypeScript issues in `instructorPayrollService`.
- Added the admin instructor `Payroll` tab and frontend payroll fetch integration.
- Added payroll loading and error states plus summary rendering for both payroll halves.
- Fixed the instructor page tab container to tolerate missing breadcrumb context.
- Verified the payroll API test passes, frontend lint passes, and the payroll tab renders in Playwright.
- Added deterministic dummy seed data for payroll UI verification and updated the seed reset flow to use `deleteMany()` instead of Prisma raw `TRUNCATE`.
- Refined the payroll tab labels and layout with a month selector and compact daily breakdown tables.
- Updated payroll totals so instructor cancel fees are subtracted from the displayed total.
- Confirmed instructor fee create/edit management is not part of this scope and remains the next follow-up task.
