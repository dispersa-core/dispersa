---
'dispersa': minor
---

Surface detailed lint issues on build errors. `BuildError` now includes a `LINT` error code with a `lintIssues` array (rule id, severity, message, token name, and path), and the CLI prints each issue in verbose mode.
