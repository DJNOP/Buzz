# Agent Instructions

- Before substantial work, read `PROJECT_STATUS.md`, `docs/product.md`, `docs/architecture.md`, and `docs/decisions.md`.
- Inspect the actual branch/worktree, Git status, relevant files, and nested/override instructions before editing. Preserve unrelated and unpublished work; use an isolated branch/worktree when implementation is active.
- Complete the agreed outcome as one coherent work package: inspect, implement, make necessary supporting changes, test, correct in-scope defects, and deliver reviewable evidence. Choose reversible implementation details independently; internal milestones do not need repeated prompts. Research-only requests remain research-only; do not add speculative features or later product milestones.
- Prefer the simplest implementation that meets current acceptance criteria. Add no dependency without a clear current need.
- Never commit secrets, credentials, API keys, private data, or local environment files.
- Keep frontend, server, shared protocol, and game-logic responsibilities clearly separated.
- Use proportionate validation and focused regression coverage for changed behaviour; wording-only edits normally need a diff/link review. For UI work, follow the rendered/physical acceptance distinctions in the README development workflow.
- Review the final diff for scope violations, accidental changes, dead code, and inconsistencies.
- Update `PROJECT_STATUS.md` at the end of completed development tasks.
- For an authorised personal-repository task, branches, task-scoped commits, non-force feature-branch pushes, linked issue/Project updates, and draft PRs are included unless explicitly local-only. Nicholas retains priorities, acceptance, and merge/integration authority. No deployment, destructive Git, sensitive access, paid calls, or scope expansion is implied.
- Follow the README development workflow; leave progress, evidence, and the next unfinished step in `PROJECT_STATUS.md` when interrupted. Distinguish a validated candidate from accepted/Done and published guidance from guidance active in the normal checkout.
- Report files changed, commands run, validation results, assumptions, and unresolved concerns.
- Stop when the requested task is complete.
