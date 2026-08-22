---
'dispersa': patch
---

Scale DTCG hsl and hwb percentage components (S/L, W/B, defined 0-100) to culori's 0-1 range in the color converter. hsl(210 50 40) now resolves to #336699 and hwb(0 25 0) to #ff4040 across all output formats instead of #ffff00 / white.
