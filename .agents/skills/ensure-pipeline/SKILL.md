---
name: ensure-pipeline
description: Run AaasoBo's local CI-equivalent checks before committing, pushing, opening a PR, or marking changes complete. Use for pre-commit or pre-push validation, reproducing GitHub Actions failures, or requests to ensure, check, or fix the pipeline.
---

# Ensure Pipeline

1. Inspect the scope with `git status -sb` and `git diff --stat`.
2. Run the bundled script with its default `all` scope before publishing changes.
3. Use a narrower scope only while iterating on a known frontend, backend, or shared failure.
4. Fix the root cause of failures, rerun the failed check, then rerun the default full gate.
5. For an existing PR failure, inspect the GitHub Actions logs before reproducing it locally.

Run the full gate:

```bash
"$(git rev-parse --show-toplevel)/.agents/skills/ensure-pipeline/scripts/aaasobo_pipeline.sh"
```

Use a targeted gate during diagnosis:

```bash
"$(git rev-parse --show-toplevel)/.agents/skills/ensure-pipeline/scripts/aaasobo_pipeline.sh" frontend
"$(git rev-parse --show-toplevel)/.agents/skills/ensure-pipeline/scripts/aaasobo_pipeline.sh" backend
"$(git rev-parse --show-toplevel)/.agents/skills/ensure-pipeline/scripts/aaasobo_pipeline.sh" shared
```

The `shared` scope also runs frontend and backend checks because both applications consume shared code. The backend gate requires Docker and forces the test suite to use its disposable Testcontainers PostgreSQL instance instead of any developer database configured in local environment files.

Summarize exactly which gates passed, which commands were skipped due to unchanged scope, and any residual external checks that cannot be reproduced locally, such as Vercel deployment status.
