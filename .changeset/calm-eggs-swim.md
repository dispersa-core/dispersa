---
'dispersa': minor
---

`BuildResult` now includes an optional `lintResult` field, populated whenever `lint.enabled` is true (on both successful and failed builds), so consumers can inspect lint issues and counts programmatically instead of relying on `console.warn` output.
