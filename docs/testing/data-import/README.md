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
  --to 2025-02-28
```

- Required arguments:
  - `--from`
  - `--completed-until`
  - `--to`
- Optional:
  - `--out-dir` (default: `../docs/testing/data-import/generated`)

The generator creates all mandatory normalized CSV files and one deterministic zip file in the output directory.
