---
'dispersa': patch
---

Fix inconsistent gamut mapping for wide-gamut color inputs. `colorToHsl` and `colorToHwb` now clamp to the sRGB gamut before formatting, so display-p3 (and other wide-gamut) reds resolve to the same color across hex/rgb/hsl/hwb instead of emitting divergent or invalid values (e.g. negative hwb percentages).
