---
'dispersa': patch
'create-dispersa': patch
---

Align gradient stop `position` handling with DTCG Format §9.7: out-of-range values are now accepted during validation (schema keeps `type: number` only) and clamped to [0, 1] at render in the iOS, Android, CSS, and Tailwind renderers. Also repoint the create-dispersa scaffolder at `dispersa-core/dispersa` instead of the personal `timges/dispersa` fork.
