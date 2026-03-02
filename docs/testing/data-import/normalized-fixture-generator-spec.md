# Normalized Fixture Generator Spec

## Purpose

Define a deterministic normalized-import fixture generator for shared testing.

This spec is for generating normalized import artifacts (CSV set and optional zip) from fixed rules, without randomness, so every developer can reproduce the same dataset from the same parameters.

## Source Control Policy

- Commit:
  - generator code
  - this spec and usage README
- Do not commit:
  - generated normalized `.csv`
  - generated normalized `.zip`

## Required CLI Parameters

All parameters are required:

- `--from YYYY-MM-DD`
- `--completed-until YYYY-MM-DD`
- `--to YYYY-MM-DD`

Date constraints:

- `from <= completed-until <= to`

## Fixed Global Rules

- Timezone is fixed to `Asia/Tokyo` (not configurable).
- Seeded faker generation with a constant seed.
- No dependency on current date/time.
- Same inputs should produce stable outputs for the same faker/package version.

## Dataset Size (Fixed)

- instructors: `10`
- customers: `100`
- child distribution:
  - 90 customers with 1 child
  - 10 customers with 2 children

Derived totals:

- children: `110`
- subscriptions: `100`
- recurring classes: `110` (see plan mapping below)

## Plan Mapping

Use only two plans:

- `Weekly 1` (`weekly_class_times = 1`)
- `Weekly 2` (`weekly_class_times = 2`)

Mapping rule:

- customer with 1 child -> `Weekly 1`
- customer with 2 children -> `Weekly 2`

Child naming rule:

- Child `name` is always a single first name token.
- Do not encode multiple children in one name (no `&`, no `.` composite pattern).

Name style rule:

- Customer names: Japanese-style names.
- Instructor names: English-style names.
- Instructor nicknames: realistic English-style nicknames, deterministic and unique.

## Instructor Schedule Patterns

Use two fixed patterns:

- Pattern A (Mon-Wed):
  - times: `16:00`, `16:30`, `17:00`, `17:30`, `18:00`
- Pattern B (Thu-Sat):
  - Thu/Fri times: `18:30`, `19:00`, `19:30`, `20:00`, `20:30`
  - Sat times: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`

Assignment:

- instructor index odd -> Pattern A
- instructor index even -> Pattern B

Sunday has no slots.

## Instructor Assignment for Recurring Classes

Recurring classes must be evenly distributed across instructors.

Rule:

- Let `R = total recurring classes`.
- Let `I = total instructors`.
- Assign exactly `R / I` recurring classes per instructor (this spec currently yields `110 / 10 = 11`).
- Use deterministic ordering:
  - recurring class candidates sorted by `subscription_ref`, then class sequence index
  - instructors sorted by `instructor_ref`
  - assign in contiguous batches or strict round-robin as long as per-instructor count is exactly equal and deterministic

## Recurring Class Generation

For each subscription:

- Create `plan.weekly_class_times` recurring classes.
- Each recurring class is assigned to one instructor by the distribution rule above.
- For each recurring class, assign one weekday/time slot from the instructor's available pattern deterministically.

## Attendance Rules

- `recurring_class_attendance.csv`:
  - customer with 1 child -> that child attends all recurring classes
  - customer with 2 children -> both children attend all recurring classes

- `class_attendance.csv`:
  - expanded from recurring class attendance for each generated class instance

## Class Expansion Rules (`classes.csv`)

Expand each recurring class weekly across the target range `[from, to]`:

- First class is the first matching weekday/time on or after `from`.
- Next classes are every 7 days until `to` (inclusive).

Field rules:

- `status`:
  - `completed` when `class.date <= completed-until`
  - `booked` when `class.date > completed-until`
- `rebookable_until`: empty
- `is_free_trial`: `false`
- `class_code`: short deterministic unique string (stable for same inputs)

## Other Files

Generator should also emit:

- `events.csv`
- `schedules.csv` with exactly one row:
  - `date = --from`
  - `event_ref = EV0001`
- `system_status.csv`
- plus all other mandatory normalized files required by the importer contract

## Determinism Expectations

Given the same `--from`, `--completed-until`, and `--to`:

- row counts must match
- row content/order must match
- reference keys must match
- generated zip (if produced) should be reproducible
