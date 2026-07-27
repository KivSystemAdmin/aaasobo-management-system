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
  --target customers \
  --number 5 \
  --start-id 1 \
  --start-instructor-id 1 \
  --end-instructor-id 5 \
  --start-date 2026-01-01
```

This creates one directly uploadable, deterministic customer package:

- `incremental-customers-0001-0005.zip`
  - `customers.csv`
  - `children.csv`
  - `subscriptions.csv`
  - `recurring_classes.csv`
  - `recurring_class_attendance.csv`

To generate an instructor package independently:

```sh
npm run fixture:generate:incremental-import -- \
  --target instructors \
  --number 5 \
  --start-id 1 \
  --start-date 2026-01-01
```

This creates:

- `incremental-instructors-0001-0005.zip`
  - `instructors.csv`
  - `instructor_fees.csv`
  - `instructor_schedules.csv`

The selected package's CSV files are also written into its corresponding
subdirectory for inspection.

Arguments:

- `--target` is required and accepts `customers` or `instructors`.
- `--number` configures the selected target's count and defaults to `5`.
- `--start-id` defaults to `1` and controls generated reference and credential
  suffixes, not database primary keys. For example, `--target customers
  --start-id 25` starts at `CU0025`.
- `--start-instructor-id` and `--end-instructor-id` are optional customer-only
  arguments that must be supplied together. They are inclusive existing
  database instructor IDs. When supplied, each ¥5,980 subscription receives two
  regular classes.
- `--start-date` defaults to `2026-01-01`.
- `--out-dir` defaults to
  `../docs/testing/data-import/generated/incremental`.

The exported `generateIncrementalImportFixture()` function accepts the
required `target` and its corresponding count and start-ID options. It returns
the selected file map and ZIP buffer for automated tests or other programmatic
use.

Customer subscriptions use the `月5,980円プラン / 5,980 yen/month Plan`
created by the initial import generator.

Regular classes rotate through the inclusive instructor range before consuming
the next slot for each instructor. For example, instructor IDs 1 through 3 are
assigned as `1/slot 1`, `2/slot 1`, `3/slot 1`, `1/slot 2`, and so on. Slots
follow the initial generator's Pattern A and Pattern B ordering. The customer
import verifies that every instructor exists and that each selected slot
matches an active database schedule. It fails atomically if the range has
insufficient unique slots or the database does not match the generated fixture.

Customer, instructor, and child names use the same seeded Faker patterns as the
initial import generator. Customer prefecture is `東京都 / Tokyo`.
Instructor English backgrounds alternate between Program Original and Native A,
and instructor schedules use the initial generator's Pattern A and Pattern B
weekly slots. Instructor nicknames use the Faker-generated first name, adding a
numeric suffix only when a duplicate first name occurs.

Generated login credentials follow the normalized fixture convention:

- customer `CU0001`: `cu0001@example.com` / `Temp-cu0001`
- instructor `IN0001`: `in0001@example.com` / `Temp-in0001`
