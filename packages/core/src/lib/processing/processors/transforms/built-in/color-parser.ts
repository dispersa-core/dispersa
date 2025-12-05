/**
 * @fileoverview Color parsing utilities
 * Uses culori for comprehensive CSS color parsing
 */

import { parse as culoriParse } from 'culori'

export type ColorFormat =
  | 'hex'
  | 'rgb'
  | 'hsl'
  | 'oklch'
  | 'oklab'
  | 'lch'
  | 'lab'
  | 'hwb'
  | 'color-function'
  | 'named'

export type ParsedColor = {
  format: ColorFormat
  values: number[]
  alpha?: number
  colorSpace?: string
  original: string
}

/**
 * Parse any CSS color string into a structured format
 * This is a compatibility wrapper around culori for existing code
 */
export function parseColor(color: string): ParsedColor | null {
  const parsed = culoriParse(color)

  if (!parsed) {
    return null
  }

  // Determine format from mode
  let format: ColorFormat = 'rgb'
  const values: number[] = []

  switch (parsed.mode) {
    case 'rgb':
      format = color.startsWith('#') ? 'hex' : 'rgb'
      values.push(parsed.r * 255, parsed.g * 255, parsed.b * 255)
      break
    case 'hsl':
      format = 'hsl'
      values.push(parsed.h ?? 0, parsed.s * 100, parsed.l * 100)
      break
    case 'oklch':
      format = 'oklch'
      values.push(parsed.l, parsed.c ?? 0, parsed.h ?? 0)
      break
    case 'oklab':
      format = 'oklab'
      values.push(parsed.l, parsed.a ?? 0, parsed.b ?? 0)
      break
    case 'lch':
      format = 'lch'
      values.push(parsed.l, parsed.c ?? 0, parsed.h ?? 0)
      break
    case 'lab':
      format = 'lab'
      values.push(parsed.l, parsed.a ?? 0, parsed.b ?? 0)
      break
    case 'hwb':
      format = 'hwb'
      values.push(parsed.h ?? 0, (parsed.w ?? 0) * 100, (parsed.b ?? 0) * 100)
      break
    case 'p3':
    case 'a98':
    case 'prophoto':
    case 'rec2020':
      format = 'color-function'
      values.push(parsed.r, parsed.g, parsed.b)
      break
    default:
      // For named colors or other formats
      format = 'named'
      // Culori's Color type includes RGB properties for all color modes
      if ('r' in parsed && 'g' in parsed && 'b' in parsed) {
        values.push((parsed.r ?? 0) * 255, (parsed.g ?? 0) * 255, (parsed.b ?? 0) * 255)
      }
  }

  return {
    format,
    values,
    alpha: parsed.alpha,
    colorSpace: parsed.mode,
    original: color,
  }
}
