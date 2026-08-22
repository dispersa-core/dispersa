---
'dispersa': patch
---

Enforce inherited group `$type` on child token values during validation. Tokens without a local `$type` under a typed group are now schema-validated against the inherited type, so a mismatched value (e.g. a dimension-shaped value in a `color` group) is rejected instead of silently passing. Alias references and token-level `$ref`s remain exempt from parse-time validation.
