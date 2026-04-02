# Process Speed Review (branch: `work`)

This document lists concrete speed-up opportunities observed across frontend rendering/data-fetching and backend query/mutation paths.

## A. Highest impact candidates (implement first)

1. **Replace client `router.refresh()` + local refetch loops with server actions + targeted cache invalidation only.**
   - Current pattern triggers both a route refresh and local state refetch in several places, creating duplicate work and extra network trips.
2. **Add lightweight list/count endpoints for recurring classes history.**
   - Current UI fetches full history just to compute count, then often fetches again when expanded.
3. **Introduce a shared API fetch wrapper in frontend (`apiClient`) with standardized cache mode, retries, timeout, error parsing, and telemetry.**
   - Current API modules duplicate request setup and status parsing extensively.
4. **Stop image cache busting on every render (`useId()` + `?t=`) for instructor icons.**
   - This defeats browser/CDN cache and can significantly increase payload and paint time.
5. **Tighten backend `include` usage to explicit `select` for list endpoints.**
   - Multiple service methods return whole related entities where only a few fields are used.
6. **Introduce request-level batching/concurrency limits for expensive calendar/schedule recomputation paths.**
   - Avoid heavy work spikes during schedule changes and class-cancel cascades.
7. **Add end-to-end performance budgets and tracing (TTFB/P95 API latency/query duration) before and after each optimization.**

---

## B. Frontend fetch path improvements

### B1) Remove duplicated fetches and unnecessary refreshes

8. In customer regular classes, avoid calling both `setUpdateCount` and `router.refresh()`; choose one update strategy.
9. In regular classes table edit success, same duplication: local refetch + route refresh.
10. Prefer optimistic local updates for small row-level edits (e.g., edit recurring class name/time) to avoid full page refresh.
11. When mutation result contains updated entity, patch local state directly instead of triggering broad re-fetch.
12. Normalize mutation return payloads to include enough data for local reconciliation.

### B2) Avoid over-fetching history data

13. Add `GET /recurring-classes/:subscriptionId/history-count` endpoint.
14. Or return `{ active[], historyCount }` in one API call.
15. Defer full history fetch until panel expansion.
16. Cache history by `subscriptionId` in memory/store with stale timestamp to prevent repeated calls during quick UI navigation.
17. For large history, paginate or cursor-load instead of all-at-once.

### B3) Cache policy clean-up

18. Audit `cache: "no-store"` usage and keep it only for sensitive/rapidly-changing views.
19. Prefer tag-based revalidation where consistency requirements allow it.
20. For read-heavy admin lists, add small TTL (`revalidate`) where full real-time consistency is not required.
21. Unify `no-cache` custom header semantics (`"true"` vs `"no-cache"`) to prevent branchy proxy logic.

### B4) API client consolidation

22. Create `frontend/src/lib/api/client.ts` wrapper and migrate all modules.
23. Centralize header building for server vs client runtime.
24. Centralize backend endpoint/proxy route mapping.
25. Add per-request timeout with `AbortController`.
26. Add idempotent retry policy for GETs only.
27. Parse and normalize error response once.
28. Emit lightweight timing logs (dev only) for each endpoint.
29. Deduplicate identical in-flight GETs using a request key map.

### B5) Proxy route overhead reduction

30. In proxy handler, avoid JSON re-stringify when body can be streamed or directly forwarded.
31. Only parse body when required by content-type and method.
32. Add keep-alive/connection reuse config where hosting platform allows.
33. Ensure compressed responses are preserved when possible; currently response headers strip encoding/length.
34. Introduce request ID passthrough to correlate frontend wait with backend latency.

### B6) Rendering and React performance

35. Remove `useId()` as cache-bust token for instructor icons.
36. Cache bust only when icon actually changes (e.g., with `updatedAt` version key from backend).
37. Review `priority` on repeated event images; use sparingly to avoid network contention.
38. Memoize expensive event render callback factories when dependencies unchanged.
39. Memoize `dayCellColors` map handler if `businessSchedule` stable across renders.
40. For calendar-heavy pages, split non-critical widgets (e.g., message board panel) with dynamic import.
41. Virtualize large card lists where applicable (history recurring classes).
42. Avoid inline style object recreation in hot list render paths.

---

## C. Backend query/mutation path improvements

### C1) Query shape and payload size

43. Replace broad `include: { instructor: true, customer: true }` in list endpoints with explicit `select` of fields actually rendered.
44. For class/calendar endpoints, create dedicated projection DTOs (calendar-card shape).
45. Avoid returning heavy text fields (lifeHistory, messageForChildren, etc.) in list APIs.
46. Add dedicated read models for dashboard pages to reduce transform work in controllers.

### C2) Reduce sequential DB calls

47. Combine independent lookups using `Promise.all` where safe.
48. For instructor profile lists + tags, evaluate single query strategy (join/select) or materialized view for peak pages.
49. In schedule creation flow, replace row-by-row cancellation loop with batched `updateMany` grouped by datetime.
50. Consider SQL-side conflict detection for child/class conflicts instead of loading full nested relations.

### C3) Transaction and locking efficiency

51. Re-evaluate advisory lock granularity in schedule updates; coarse keys can serialize too much.
52. Keep transaction scopes tight (compute derived sets before transaction when possible).
53. Add statement timeout for non-critical batch jobs.
54. Make cron/job cleanup endpoints chunked to avoid long transactions.

### C4) Index and DB maintenance opportunities

55. Validate query plans for common filters: `terminationAt`, `effectiveFrom/effectiveTo`, `status + dateTime`.
56. Add composite indexes only when proven by `EXPLAIN ANALYZE` workload; prune unused ones.
57. Add partial indexes for common active-record filters where PostgreSQL supports it (e.g., `terminationAt IS NULL`).
58. Run periodic `VACUUM (ANALYZE)`/autovacuum tuning review due to heavy update/delete paths.
59. Add DB-level slow query logging threshold for production diagnostics.

### C5) Storage and media operations

60. For icon update path, perform blob deletion asynchronously after successful DB commit to reduce request latency.
61. Pre-generate and store optimized image variants to cut client download/render time.
62. Use immutable URLs + long cache headers for static avatar objects.

---

## D. API design improvements for speed and scalability

63. Add bulk mutation endpoints for repeated UI operations (bulk cancel/update) to reduce request fan-out.
64. Return ETags or version fields for list endpoints so clients can short-circuit unchanged responses.
65. Add cursor-based pagination to high-growth lists (classes, posts, history lists).
66. Add selective field query support (`fields=`) for admin dashboards.
67. Provide combined endpoints for page bootstrap data to reduce waterfall on initial render.

---

## E. Observability, profiling, and guardrails

68. Add structured timing logs around each controller/service boundary.
69. Add Prisma middleware to record query duration and SQL model/action.
70. Correlate frontend request ID ↔ backend logs.
71. Create weekly latency report (P50/P95/P99) by endpoint.
72. Add budget checks in CI (e.g., Lighthouse for key pages, API smoke benchmarks).
73. Add load test scenarios for schedule updates and class booking conflicts.
74. Define explicit SLOs (e.g., P95 GET list < 300ms, mutation < 500ms).

---

## F. Concrete code hotspots observed on this branch

75. Proxy route has branching cache/header/body behavior and may incur avoidable body processing overhead.
76. Admin API module has large repeated fetch boilerplate that increases maintenance and drift risk.
77. Regular classes components refetch and refresh redundantly.
78. Calendar utilities append cache-busting query params to instructor images at render-time.
79. Children/class service methods often include whole related records where partial select could be enough.
80. Schedule service performs multi-step transactional logic where batching opportunities exist.

---

## G. Suggested rollout order

1. Instrumentation first (items 68–74).
2. Frontend duplicate-fetch elimination + icon cache fix (items 8–12, 35–37).
3. Recurring-class API shape improvements (items 13–17).
4. Shared API client migration (items 22–29).
5. Backend query projection tightening (items 43–46).
6. Transaction/query optimization in schedule/class hotspots (items 49–54).
7. Index tuning based on real plans (items 55–59).

---

## H. Acceptance criteria examples

- Regular classes page: reduce total requests on edit flow by **>=40%**.
- Calendar page: reduce image requests on navigation by **>=60%**.
- Admin list APIs: reduce payload size by **>=30%** through select projection.
- Schedule mutation endpoint: reduce P95 latency by **>=25%** under synthetic load.

