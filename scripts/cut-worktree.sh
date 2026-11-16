#!/usr/bin/env bash
# Usage: scripts/cut-worktree.sh <n>-<title> [<cut-point>]   (cut-point default: master; a spec child passes spec/<n>-<title>)
# Cuts or reuses <main>/.claude/worktrees/<n>-<title> from the remote tip and prints its path.
set -euo pipefail
branch=${1:?usage: cut-worktree.sh <n>-<title> [cut-point]}
cut=${2:-master}
main=$(cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)
wt="$main/.claude/worktrees/$branch"
cd "$main"
git fetch origin "$cut" || git rev-parse -q --verify "refs/heads/$cut" > /dev/null  # a local-only spec branch is allowed
tip=$(git rev-parse -q --verify "origin/$cut" || git rev-parse "refs/heads/$cut")
if [ -d "$wt" ]; then
  [ -z "$(git -C "$wt" status --porcelain)" ] || { echo "dirty worktree: $wt" >&2; exit 1; }
  [ "$(git -C "$wt" merge-base HEAD "$tip")" = "$tip" ] || { echo "off-tip worktree: $wt" >&2; exit 1; }
elif git rev-parse -q --verify "refs/heads/$branch" > /dev/null; then
  [ "$(git merge-base "$branch" "$tip")" = "$tip" ] || { echo "off-tip branch: $branch" >&2; exit 1; }
  git worktree add --no-track "$wt" "$branch"
else
  git worktree add --no-track -b "$branch" "$wt" "$tip"
fi
echo "$wt"
