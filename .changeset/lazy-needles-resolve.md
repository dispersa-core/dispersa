---
'dispersa': patch
---

Resolve sibling array `$ref` elements sequentially so two array items referencing the same JSON pointer no longer throw a false "Circular reference detected" error (previously caused by concurrent `Promise.all` resolution over a shared visited-set).
