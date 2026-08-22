---
'dispersa': patch
---

Fix public API/type hygiene and lint option validation. `LintResult`/`LintIssue` are now exported from the package root so `lint()`'s return type is importable from `dispersa`; the `tailwind()` builder now auto-injects `nameKebabCase()` like `css()` so both CSS-emitting builders case custom-property names identically; `lint()` validates its config against the lint config schema so an invalid rule severity (e.g. `'warning'`) throws a `ConfigurationError` instead of being silently counted as neither error nor warning; and the `case-check` rule throws on an unknown `format` (without a custom `pattern`) instead of silently validating against kebab-case.
