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
