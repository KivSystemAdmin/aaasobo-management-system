# Data Import Test Fixtures

## `raw-schedule-clean-sample.csv`

Raw schedule CSV fixture for end-to-end import testing.

- Format: compatible with `POST /admins/import/normalize` raw schedule input
- Purpose: commit-safe dummy data (no real customer data)
- Data quality: intentionally clean for baseline performance and functional checks
  - no missing customer emails
  - no invalid email formats
  - no invalid weekday/time values

### Dataset size

- instructors: 10
- customers: 100
- children: 120
  - 20 customers have 2 children
  - 80 customers have 1 child
- plans: 3

### Validation snapshot

When normalized by `normalizeRawScheduleCsvToPackage`:

- raw rows: 120
- warnings: 0
- generated customer emails: 0
- normalized rows:
  - `customers.csv`: 100
  - `children.csv`: 120
  - `subscriptions.csv`: 100
  - `instructors.csv`: 10
  - `instructor_fees.csv`: 10

## Next Fixture Direction

- Deterministic generator spec: [normalized-fixture-generator-spec.md](./normalized-fixture-generator-spec.md)
- Policy:
  - Commit generator code and docs only.
  - Do not commit generated normalized `.csv` or `.zip` files.

## Deterministic Generator

Run from `backend/`:

```sh
npm run fixture:generate:normalized-import -- \
  --from 2025-01-01 \
  --completed-until 2025-01-20 \
  --to 2025-02-28 \
  --instructors 10
```

- Required arguments:
  - `--from`
  - `--completed-until`
  - `--to`
- Optional:
  - `--instructors` (default: `10`; customers are generated at a `1:10` instructor-to-customer ratio)
  - `--out-dir` (default: `../docs/testing/data-import/generated`)

The generator creates all mandatory normalized CSV files and one deterministic zip file in the output directory.

It also emits `instructor_fees.csv` with one active fee row per instructor using:

- `currency = PHP`
- `trial_fee = 75`
- `regular_fee = 100`
- `cancel_fee = 50`
- `cancel_without_notice_fee = 100`

## Incremental Import Generator

Run from `backend/`:

```sh
npm run fixture:generate:incremental-import -- \
  --customers 5 \
  --instructors 5 \
  --namespace local-01 \
  --plan-name "月5,980円プラン / 5,980 yen/month Plan" \
  --start-date 2026-01-01
```

This creates two directly uploadable, deterministic packages:

- `incremental-customers-<namespace>.zip`
  - `customers.csv`
  - `children.csv`
  - `subscriptions.csv`
- `incremental-instructors-<namespace>.zip`
  - `instructors.csv`
  - `instructor_fees.csv`
  - `instructor_schedules.csv`

All CSV files are also written into `customers/` and `instructors/`
subdirectories for inspection.

Optional arguments:

- `--customers` and `--instructors` default to `5`.
- `--namespace` defaults to `sample` and differentiates generated URLs,
  nicknames, meeting IDs, and passcodes.
- `--plan-name` defaults to the weekly native-A plan created by
  `npm run seed:dummy`. The name must exactly match one existing database plan.
- `--start-date` defaults to `2026-01-01`.
- `--out-dir` defaults to
  `../docs/testing/data-import/generated/incremental`.

The exported `generateIncrementalImportFixture()` function returns both file
maps and ZIP buffers for automated tests or other programmatic use.

Generated login credentials follow the normalized fixture convention:

- customer `CU0001`: `cu0001@example.com` / `Temp-cu0001`
- instructor `IN0001`: `in0001@example.com` / `Temp-in0001`
