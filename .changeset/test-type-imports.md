---
'dispersa': patch
---

Fix test type-safety: repoint 29 test files importing types from the removed `src/tokens` and `src/config` modules to the current homes (`@shared/token-types`, `@outputs/types`, `@engine/types`), and delete the dead `@tokens` path alias from tsconfig, vitest, and tsup configs.
