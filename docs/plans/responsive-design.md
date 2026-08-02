# Responsive Design Plan (Customer + Instructor Dashboards)

## Purpose
Track the responsive design rollout for the customer and instructor dashboards. This document serves as:
- design doc
- requirements definition
- work log
- to-do list

## Scope
- In scope: Instructor and customer dashboards (starting with instructor)
- Out of scope (for now): Admin dashboard

## Goals
- Ensure usability on desktop and mobile for all instructor pages
- Add a tablet breakpoint to avoid mid-width layout issues
- Apply consistent patterns across pages after the first page is completed

## Non-goals
- Visual redesign or new UI patterns beyond responsive layout adjustments
- Admin dashboard responsiveness

## Breakpoints (tentative)
- Mobile: <= 640px
- Tablet: 641px to 1024px
- Desktop: >= 1025px

## Instructor Dashboard Pages
- Profile
- Class Schedule
- Business Calendar
- Availability

## Customer Dashboard Pages
- TBD after instructor rollout

## Target Page (first)
- Instructor Profile page

## Tracking Issue
- https://github.com/KivSystems/aaasobo-management-system/issues/406

## Requirements (Instructor Profile)
- Single-column layout on mobile
- Form fields and buttons full-width on mobile
- Maintain desktop layout with sensible max-width
- Tablet layout should avoid cramped two-column form fields

## Current State (Instructor Profile)
- Layout: a single form container with stacked sections; most sections are `.insideContainer` rows using `display: flex` with an icon and a text/form block.
- The name section uses a horizontal flex row (`.instructorName`) alongside status controls.
- Several inputs use fixed widths (e.g., 50% or 200px) and `min-width: 200px` for meeting ID/passcode.
- Container padding is 30px, which can feel tight on small screens.
- Potential overflow risks on mobile: fixed-width inputs, `urlInfo` rows with long strings, and horizontal flex for name/status.
- Files: `frontend/src/app/instructors/[id]/profile/page.tsx`, `frontend/src/app/components/instructors-dashboard/instructor-profile/InstructorProfile.tsx`, `frontend/src/app/components/instructors-dashboard/instructor-profile/InstructorProfile.module.scss`.

## Decisions Log
- 2025-01-14: Include tablet breakpoint in addition to mobile and desktop
- 2025-01-14: Start with instructor profile page

## Work Log
- 2025-01-14: Created this plan; instructor profile page selected as first target
- 2025-01-14: Updated instructor profile page for mobile/tablet; added mobile header + drawer toggle; refined item layout and URL rows
- 2025-01-14: Made instructor class schedule calendar toolbar mobile-friendly with compact controls and view dropdown
- 2025-01-14: Stacked instructor class details layout on tablet/mobile
- 2025-01-14: Adjusted instructor availability schedule calendar typography and title sizing for mobile
- 2025-01-14: Made business calendar multi-month view responsive with mobile/tablet column counts and compact toolbar
- 2026-01-15: Made customer class calendar layout responsive (header actions, legend, calendar sizing)
- 2026-01-15: Reworked cancel classes modal layout for mobile cards and spacing
- 2026-01-15: Updated customer rebooking modals (options, instructor list, time slots, confirm step) for responsive layouts
- 2026-01-15: Tuned customer booking flow UI (mode selection cards, instructor grid, calendar toolbar) for mobile/desktop

## To-Do
- Validate at mobile/tablet/desktop widths
- Continue customer dashboard rollout (remaining pages + QA)
