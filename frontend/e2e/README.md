# Critical workflow E2E

The suite always generates and imports the same deterministic fixture: 10
instructors, 100 customers, 120 children, multiple plans, three months of
history, and seven months of future classes. Mutations are performed through
the UI; API reads are used only to verify persisted outcomes.

Local mode is the default and creates a disposable PostgreSQL container:

```sh
npm run test:e2e
```

Deployed mode requires an isolated test environment whose database has already
been reset. It never starts or connects to the developer database:

```sh
E2E_BASE_URL=https://test.example.com \
E2E_ADMIN_EMAIL=e2e-admin@example.com \
E2E_ADMIN_PASSWORD='test-only-password' \
npm run test:e2e:deployed
```

`E2E_TARGET` accepts only `local` or `deployed`. Screenshots and traces are
retained only on failures under `test-results/`.

Desktop journeys run in Chromium. Mobile-critical journeys use Playwright's
Mobile Safari device profile (iPhone viewport, touch behavior, and user agent)
on the same portable browser engine.
