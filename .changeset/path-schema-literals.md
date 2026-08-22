---
'dispersa': patch
---

Fix the `path-schema` lint rule rejecting its own documented multi-segment patterns. Literals in path patterns are now split on `.` into one part per segment at compile time, so patterns like `color.base.{brand}` and `color.semantic.{element}.{role}` match valid tokens instead of reporting `INVALID_PATH`.
