/**
 * @fileoverview Color format conversions that use culori's formatRgb / formatHsl
 * Split from color-converter to avoid pulling these into bundles that only need hex.
 */

import type { ColorValueObject } from '@shared/token-types'
import { clampRgb, converter, formatCss, formatHsl, formatRgb, type Hwb } from 'culori'

import { dtcgObjectToCulori } from './color-converter'

/**
 * Convert DTCG color object to rgb/rgba string
 * culori's formatRgb clamps out-of-gamut channels to the sRGB range
 */
export function colorObjectToRgb(color: ColorValueObject): string {
  const culoriColor = dtcgObjectToCulori(color)
  return formatRgb(culoriColor)
}

/**
 * Convert DTCG color object to hsl/hsla string
 * Clamps to the sRGB gamut first so hsl output matches hex/rgb for out-of-gamut colors
 */
export function colorObjectToHsl(color: ColorValueObject): string {
  const culoriColor = dtcgObjectToCulori(color)
  return formatHsl(clampRgb(culoriColor))
}

/**
 * Convert DTCG color object to hwb string
 * Clamps to the sRGB gamut first since hwb is gamut-bound to sRGB
 * Channels are clamped to [0, 1] and rounded to 6 decimals to strip
 * floating-point noise (e.g. -1e-13% from display-p3 red conversions)
 */
export function colorObjectToHwb(color: ColorValueObject): string {
  const culoriColor = dtcgObjectToCulori(color)
  const hwb = converter('hwb')(clampRgb(culoriColor)) as Hwb

  const round6 = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v * 1e6) / 1e6

  return formatCss({
    mode: 'hwb',
    h: round6(hwb.h),
    w: hwb.w === undefined ? undefined : Math.max(0, round6(hwb.w) as number),
    b: hwb.b === undefined ? undefined : Math.max(0, round6(hwb.b) as number),
    alpha: hwb.alpha,
  } as Hwb)
}
