#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  launch_task_worktree.sh <branch-name> [worktree-path]

Examples:
  launch_task_worktree.sh issue-123-fix-login
  launch_task_worktree.sh issue-123-fix-login ../aaasobo-issue-123-fix-login
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit 1
fi

branch_name="$1"
worktree_path="${2:-../${branch_name}}"

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "Error: this command must run inside a git repository." >&2
  exit 1
fi

cd "$repo_root"

if ! git check-ref-format --branch "$branch_name" >/dev/null 2>&1; then
  echo "Error: invalid branch name: ${branch_name}" >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
  echo "Error: branch '${branch_name}' already exists." >&2
  exit 1
fi

if [[ -e "$worktree_path" || -L "$worktree_path" ]]; then
  echo "Error: worktree path already exists: ${worktree_path}" >&2
  exit 1
fi

echo "==> Fetch latest origin/develop"
git fetch origin develop

if ! git rev-parse --verify --quiet refs/remotes/origin/develop >/dev/null; then
  echo "Error: origin/develop was not found after fetch." >&2
  exit 1
fi

echo "==> Create worktree '${worktree_path}' on branch '${branch_name}' from origin/develop"
git worktree add -b "$branch_name" "$worktree_path" origin/develop

copy_if_exists() {
  local rel_path="$1"
  local src="${repo_root}/${rel_path}"
  local dst="${worktree_path}/${rel_path}"
  if [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "==> Copied ${rel_path}"
  else
    echo "==> Skipped ${rel_path} (not found)"
  fi
}

copy_if_exists "backend/.env"
copy_if_exists "frontend/.env"
copy_if_exists "shared/.env"

npm_install_if_exists() {
  local dir="$1"
  if [[ -f "${worktree_path}/${dir}/package.json" ]]; then
    echo "==> npm install in ${dir}"
    if ! (cd "${worktree_path}/${dir}" && npm install); then
      echo "Error: npm install failed in ${dir}." >&2
      echo "Worktree remains available at: ${worktree_path}" >&2
      echo "Branch remains available as: ${branch_name}" >&2
      exit 1
    fi
  else
    echo "==> Skipped ${dir} (package.json not found)"
  fi
}

npm_install_if_exists "shared"
npm_install_if_exists "backend"
npm_install_if_exists "frontend"

echo "==> Done"
echo "Worktree: ${worktree_path}"
echo "Branch:   ${branch_name}"
