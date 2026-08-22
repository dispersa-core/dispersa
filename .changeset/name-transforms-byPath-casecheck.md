---
'dispersa': patch
---

Fix three processing bugs: case name transforms now derive from the current `token.name` instead of the original `path`, so `namePrefix`/`nameSuffix` compose correctly with `nameKebabCase` and friends; the `byPath` filter matches string patterns on segment boundaries instead of substrings (`byPath('color')` no longer matches `colors.blue`); and the `case-check` lint rule no longer re-applies a per-segment custom `pattern` to the full dotted token name, eliminating spurious `INVALID_FORMAT` reports.
