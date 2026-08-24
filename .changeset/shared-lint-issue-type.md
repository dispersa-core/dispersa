---
'dispersa': patch
---

Extract the `LintIssue` type to `shared/types/lint-issue` so `LintError.issues` no longer duplicates its shape inline. The lint module re-exports `LintIssue` from the shared type, keeping the public import path (`@lint/types` / `dispersa`) unchanged. No behavior change.
