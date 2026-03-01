# Data Import and Normalization Plan (Draft)

## Purpose

Enable migration from existing spreadsheet operations into the app by supporting a safe, repeatable bootstrap import flow for admins and developers.

## Background

- Current business operations rely on spreadsheets (customer info, classes, instructor schedules, etc.).
- Manual migration is not practical at the required scale.
- The same import capability should support development/testing datasets.
- For v1, destructive overwrite behavior is acceptable with a clear admin warning.

## Agreed Direction

### High-level flow

Two-step workflow:

1. Normalize raw spreadsheet export files into strict "normalized CSV" format.
2. Import normalized CSVs into the app database.

### v1 operation model

- Import mode: full reset + full import (not partial domain import).
- Existing data is cleared before import, while preserving seed admin requirements.
- Access: any authenticated admin, via a new admin dashboard page.
- Safety guard: confirmation modal before execution.
- Consistency: all-or-nothing behavior (transactional where possible).
- Reset scope includes all import-target tables, including `SystemStatus`, before re-insert.
- Seed admin preservation is defined by stable seed-admin emails from configuration, and those records are restored/preserved during reset.

### File strategy

- Use CSV as canonical import format for v1.
- Normalization accepts raw CSV exports from spreadsheet workflows (CSV only in v1).
- Normalized import package uses a fixed required file set (all required files must be present).
- Import reference keys use a uniform 2-letter prefix + 4-digit numeric suffix (e.g., `CU0001`, `CH0001`, `SU0001`) to support up to 9999 rows per entity key space.
- Normalization generates plain-text temporary passwords for login users and includes them inline in normalized CSV outputs.

### Mandatory normalized file set (v1)

1. `plans.csv`
2. `customers.csv`
3. `children.csv`
4. `subscriptions.csv`
5. `instructors.csv`
6. `instructor_schedules.csv` (domain-combined: schedule + slot data)
7. `instructor_absences.csv`
8. `events.csv`
9. `schedules.csv`
10. `system_status.csv`
11. `recurring_classes.csv`
12. `recurring_class_attendance.csv`
13. `classes.csv`
14. `class_attendance.csv`

Notes:

- `instructor_schedules.csv` is intentionally domain-combined and fans out internally to `InstructorSchedule` and `InstructorSlot`.
- All mandatory files must exist even if empty (header-only allowed where applicable).
- `customers.csv` and `instructors.csv` include `temp_password` columns in normalized outputs.
- Importer must hash temporary passwords before database write; plain text is never stored in DB.
- Support both:
  - Import from normalized files generated in the same session.
  - Re-upload/import previously downloaded normalized bundles.

### Linking strategy

- Normalize into files with explicit stable references (import keys) to resolve relationships safely.
- Do not rely on DB surrogate IDs in source files.
- Normalization step is responsible for generating/managing these references as needed.

## Normalized CSV Contract (v1)

### Common rules

1. Encoding: UTF-8.
2. Delimiter: comma.
3. Header row required.
4. Empty file is allowed only as header-only for mandatory files with no rows.
5. Date format: `YYYY-MM-DD`.
6. DateTime format: ISO 8601 with timezone offset (example: `2025-02-01T10:00:00+09:00`).
7. Time format: `HH:mm` (24-hour).
8. Boolean format: `true` / `false`.
9. Enum values must match Prisma enum names exactly (for class status).
10. Reference key format:
   - Pattern: `^[A-Z]{2}[0-9]{4}$`
   - Customer: `CU0001`
   - Child: `CH0001`
   - Subscription: `SU0001`
   - Instructor: `IN0001`
   - Plan: `PL0001`
   - Event: `EV0001`
   - Schedule: `SD0001`
   - Recurring class: `RC0001`
   - Class: `CL0001`

### File-by-file headers

1. `plans.csv`
   - Required columns: `plan_ref,name,description,weekly_class_times,is_native,termination_at`
   - Keys:
     - `plan_ref` unique.
     - `name` unique.
2. `customers.csv`
   - Required columns: `customer_ref,name,email,temp_password,prefecture,termination_at,has_seen_welcome`
   - Keys:
     - `customer_ref` unique.
     - `email` unique (auto-generated if missing in source).
3. `children.csv`
   - Required columns: `child_ref,customer_ref,name,birthdate,personal_info`
   - Keys:
     - `child_ref` unique.
     - `customer_ref` must exist in `customers.csv`.
4. `subscriptions.csv`
   - Required columns: `subscription_ref,customer_ref,plan_ref,start_at,end_at`
   - Keys:
     - `subscription_ref` unique.
     - `customer_ref` must exist in `customers.csv`.
     - `plan_ref` must exist in `plans.csv`.
5. `instructors.csv`
   - Required columns: `instructor_ref,name,email,temp_password,class_url,icon,nickname,meeting_id,passcode,birthdate,favorite_food,hobby,life_history,message_for_children,skill,working_time,is_native,termination_at`
   - Keys:
     - `instructor_ref` unique.
     - `email`, `class_url`, `icon`, `nickname`, `meeting_id`, `passcode` unique.
6. `instructor_schedules.csv`
   - Required columns: `instructor_ref,effective_from,effective_to,timezone,weekday,start_time`
   - Keys:
     - `instructor_ref` must exist in `instructors.csv`.
     - `(instructor_ref,effective_from,effective_to,timezone)` defines one schedule.
     - `(instructor_ref,effective_from,effective_to,timezone,weekday,start_time)` unique for slots.
7. `instructor_absences.csv`
   - Required columns: `instructor_ref,absent_at`
   - Keys:
     - `instructor_ref` must exist in `instructors.csv`.
     - `(instructor_ref,absent_at)` unique.
8. `events.csv`
   - Required columns: `event_ref,name,color`
   - Keys:
     - `event_ref` unique.
     - `name` unique.
     - `color` unique.
9. `schedules.csv`
   - Required columns: `schedule_ref,date,event_ref`
   - Keys:
     - `schedule_ref` unique.
     - `date` unique.
     - `event_ref` must exist in `events.csv`.
10. `system_status.csv`
   - Required columns: `status`
   - Rules:
     - Exactly one row required in v1.
11. `recurring_classes.csv`
   - Required columns: `recurring_class_ref,subscription_ref,instructor_ref,start_at,end_at`
   - Keys:
     - `recurring_class_ref` unique.
     - `subscription_ref` must exist in `subscriptions.csv` when provided.
     - `instructor_ref` must exist in `instructors.csv` when provided.
12. `recurring_class_attendance.csv`
   - Required columns: `recurring_class_ref,child_ref`
   - Keys:
     - `recurring_class_ref` must exist in `recurring_classes.csv`.
     - `child_ref` must exist in `children.csv`.
     - `(recurring_class_ref,child_ref)` unique.
13. `classes.csv`
   - Required columns: `class_ref,customer_ref,instructor_ref,recurring_class_ref,subscription_ref,date_time,status,rebookable_until,class_code,is_free_trial`
   - Keys:
     - `class_ref` unique.
     - `customer_ref` must exist in `customers.csv`.
     - `instructor_ref`, `recurring_class_ref`, `subscription_ref` must exist in their files when provided.
14. `class_attendance.csv`
   - Required columns: `class_ref,child_ref`
   - Keys:
     - `class_ref` must exist in `classes.csv`.
     - `child_ref` must exist in `children.csv`.
     - `(class_ref,child_ref)` unique.

### Column type expectations

1. Date-only columns:
   - `children.birthdate`
   - `instructors.birthdate`
   - `instructor_schedules.effective_from`
   - `instructor_schedules.effective_to`
   - `schedules.date`
2. DateTime columns:
   - `subscriptions.start_at`
   - `subscriptions.end_at`
   - `instructor_absences.absent_at`
   - `recurring_classes.start_at`
   - `recurring_classes.end_at`
   - `classes.date_time`
   - `classes.rebookable_until`

## Functional Requirements

1. Admin can open a dedicated import page from admin dashboard.
2. Admin can upload raw source file(s) for normalization.
3. System validates raw inputs and shows normalization errors clearly (file/row/column/message).
4. System produces normalized CSV outputs with strict schemas.
5. Normalized import requires all expected files; missing files fail validation.
6. Admin can download normalized outputs as a zip bundle.
7. Admin can import normalized data (same-session or re-uploaded bundle).
8. Import operation performs full data reset (excluding seed admin data policy) and loads all bootstrap data.
9. Import shows pre-execution confirmation modal.
10. If import fails at any point, system prevents partial committed state (transactional/rollback strategy).
11. System shows import result summary (success/failure, created counts, validation failures).

## Non-Functional Requirements

1. Repeatability: same normalized input must produce deterministic import outcomes.
2. No import operation logging/recording is required in v1.
3. Safety: destructive nature must be explicit in UI copy.
4. Operability: error messages should identify row/column/file for fixes.
5. v1 operational limits: max upload size 50MB, normalization/import timeout 180 seconds.

## Proposed v1 UX

Single wizard-like page:

1. Upload raw file(s).
2. Run normalization + show validation report.
3. Optional download of normalized zip.
4. Confirm destructive import in modal.
5. Execute import and show final report.

## Technical Design Outline

### Backend

1. New admin endpoints:
   - `POST /admin/import/normalize`
   - `POST /admin/import/execute`
   - `GET /admin/import/normalized/:jobId/download` (zip)
2. Normalization service:
   - Parse raw CSV.
   - Map/clean fields.
   - Generate relationship references where needed.
   - Emit strict normalized CSV artifacts.
3. Import service:
   - Validate normalized schemas and cross-file references.
   - Clear existing data in defined order.
   - Insert in dependency order.
   - Wrap in transaction strategy.
### Frontend

1. New admin page for normalization/import workflow.
2. Upload UI + validation report display.
3. Download normalized zip action.
4. Import confirmation modal (destructive warning).
5. Final run result panel.

## Data/Dependency Execution Order (Initial)

Exact table order should be finalized against Prisma schema, but expected dependency-first order is:

1. master/reference entities
2. customers and related profiles/children
3. instructors and availability/schedules
4. subscriptions
5. classes/slots
6. bookings/registrations
7. other dependent operational records

## Progress / Worklog

### Completed

1. Phase 0 discovery/design baseline captured in this document.
2. Phase 1 backend normalization implemented (raw CSV parsing, mapping, normalized artifact generation, zip packaging, unit tests).
3. Phase 2 backend import implemented (normalized validation, dependency-ordered import, full reset with seed-admin preservation, transactional safety, integration tests).
4. Phase 3 admin UI implemented (normalize flow, report display, zip download, destructive confirmation, execute + result summary).
5. Phase 4.2 guardrails for large uploads implemented:
   - 50MB upload limit enforced on `/admins/import/normalize` and `/admins/import/execute`.
   - Oversized uploads return HTTP 413.
6. Phase 4.1 strict error-granularity expansion is intentionally de-scoped for v1.
7. Rollback applied for strict execute-side issue granularity changes from PR #451 to keep the feature simpler for bootstrap/testing usage.

### Current Direction (Confirmed)

1. Prioritize simplicity and easy customization over highly strict/fully modeled error structures.
2. Keep backend validation pragmatic: enough to prevent broken imports, without over-constraining data migration workflows.
3. Backend should return human-readable parse/validation errors; frontend should display those details directly.

## TODO (Implementation Plan)

### Phase 0: Discovery

1. Inventory current spreadsheet tabs/columns and target DB tables.
2. Define normalized CSV schemas per output file.
3. Define field mapping and transformation rules from raw -> normalized.
4. Confirm seed admin preservation rule in reset logic.

### Phase 1: Backend normalization

1. Implement raw CSV parsers and schema validators.
2. Implement normalization mapping pipeline.
3. Implement normalized artifact generation.
4. Implement zip download endpoint.
5. Add unit tests for mapping/validation edge cases.

### Phase 2: Backend import

1. Implement strict normalized CSV validation.
2. Implement full reset strategy and dependency-safe delete order.
3. Implement dependency-ordered inserts with transactional guards.
4. Add integration tests with realistic fixture sets.

### Phase 3: Admin UI

1. Add admin dashboard entry and import page.
2. Build upload + normalize workflow.
3. Add validation report UI.
4. Add normalized zip download button.
5. Add destructive confirmation modal.
6. Add import execution and result summary UI.

### Phase 4: Hardening

1. Improve error reporting granularity (file/row/column) only where low-cost and high-value; avoid heavy schema complexity.
   - Status: strict/fully-structured 4.1 approach is intentionally not planned for current v1 scope.
2. Add guardrails for very large uploads.
   - Status: done (50MB limit + HTTP 413 on oversized uploads).
3. Add operational docs and runbook. *(Out of scope for v1 simplicity)*
4. Evaluate whether to disable/remove feature in production release process. *(Out of scope for v1 simplicity)*

### Next Step (Post-Implementation Validation)

1. Run end-to-end validation using a sample source export converted to CSV:
   normalize -> download normalized zip -> execute import.
2. Verify key outcomes in DB/UI (entity counts, core relationships, seed admin preservation).
3. Create and commit a sanitized simplified CSV fixture set (no real customer data) for repeatable test sharing.

## Open Questions

None at this stage.

## Confirmed Decisions (So Far)

1. Normalization input format for v1 is CSV only.
2. Full reset preserves only seeded admin account(s).
3. It is acceptable if the currently logged-in admin is removed and forced to log out during import.
4. No persistent import history is required in v1.
5. v1 limits are 50MB upload and 180s processing timeout.
6. Normalized package is a fixed mandatory file set.
7. Normalization is all-or-nothing: any validation error fails the whole normalization and no partial outputs are produced.
8. Import reference keys use uniform 2-letter + 4-digit format (e.g., `CU0001`).
9. Temporary passwords are generated during normalization and included inline as plain text in `customers.csv` and `instructors.csv`.
10. Temporary passwords are regenerated on every normalization run.
11. Import feature is always available to authenticated admins in v1 (no environment kill-switch).
12. Missing emails are auto-generated during normalization (no toggle), and normalization output/report must list which rows were assigned generated emails.
13. For v1 bootstrap/testing usage, prioritize simple, human-readable backend errors over deeply structured error contracts.
14. Hardening scope for v1 is intentionally reduced to upload-size guardrails only; other hardening items are deferred.

## Risks and Mitigations

1. Risk: accidental destructive execution.
   - Mitigation: strong modal warning and explicit admin-only access.
2. Risk: source data quality issues.
   - Mitigation: pragmatic normalization/import validation with actionable backend errors.
3. Risk: broken relationships across entities.
   - Mitigation: generated stable references + cross-file validation before write.
4. Risk: large-batch performance.
   - Mitigation: batched inserts and measured limits in hardening phase.
