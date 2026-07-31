---
name: launch-task-worktree
description: Create an AaasoBo task branch and Git worktree from the latest origin/develop, copy local environment files, and install monorepo dependencies. Use when starting isolated development work or when asked to create, launch, or set up a task worktree.
---

# Launch Task Worktree

## Inputs

- Required: `branch_name`
- Optional: `worktree_path`, resolved relative to the repository root (defaults to `../<branch_name>`)

Run:

```bash
"$(git rev-parse --show-toplevel)/.agents/skills/launch-task-worktree/scripts/launch_task_worktree.sh" <branch_name> [worktree_path]
```

The script:

1. Validate the branch name and destination.
2. Fetch and validate `origin/develop`.
3. Create the branch and worktree directly from `origin/develop`.
4. Copy these files when present:
   - `backend/.env`
   - `frontend/.env`
   - `shared/.env`
5. Run `npm install` in:
   - `shared`
   - `backend`
   - `frontend`

Do not overwrite an existing branch or path. If dependency installation fails after worktree creation, report the created worktree and the failed directory rather than deleting the worktree.
