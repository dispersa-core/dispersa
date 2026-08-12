---
'dispersa': patch
---

Fix CSS renderer emitting unescaped `*/` in set and modifier description comments, which could terminate the comment early and corrupt the generated stylesheet.
