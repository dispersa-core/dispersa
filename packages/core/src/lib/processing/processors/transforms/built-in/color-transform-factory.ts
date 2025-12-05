/**
 * @fileoverview Unified factory for creating color transforms
 * Handles both simple conversions and modern color space transformations
 */

import { ColorComponent, ColorValue, ColorValueObject, ResolvedToken } from '@lib/tokens/types'
import {
  A98,
  Hsl,
  Hwb,
  Lab,
  Lch,
  Lrgb,
  Oklab,
  Oklch,
  P3,
  Prophoto,
  Rec2020,
  Rgb,
  Xyz50,
  Xyz65,
  converter,
  formatCss,
  type Mode,
} from 'culori'

import { Transform } from '..'

import { isColorObject } from './color-converter'

/**
 * Convert a color component value to culori format
 * The "none" keyword becomes undefined (culori's representation of missing channels)
 */
function componentToCulori(component: ColorComponent): number | undefined {
  return component === 'none' ? undefined : component
}

/**
 * Convert DTCG color object to culori color object
 * Handles all 14 DTCG color spaces and the "none" keyword
 * Returns null if value is not a ColorValueObject (e.g., unresolved alias reference)
 */
export function dtcgObjectToCulori(value: ColorValue) {
  if (!isColorObject(value)) {
    // String values should be alias references that get resolved before transforms
    return null
  }

  const [c1, c2, c3] = value.components.map(componentToCulori)
  const alpha = value.alpha !== undefined ? componentToCulori(value.alpha) : undefined
  const colorSpace = value.colorSpace.toLowerCase()

  // Map DTCG color spaces to culori color objects with proper property names
  switch (colorSpace) {
    case 'srgb':
      return { mode: 'rgb', r: c1, g: c2, b: c3, alpha } as Rgb
    case 'srgb-linear':
      return { mode: 'lrgb', r: c1, g: c2, b: c3, alpha } as Lrgb
    case 'hsl':
      return { mode: 'hsl', h: c1, s: c2, l: c3, alpha } as Hsl
    case 'hwb':
      return { mode: 'hwb', h: c1, w: c2, b: c3, alpha } as Hwb
    case 'lab':
      return { mode: 'lab', l: c1, a: c2, b: c3, alpha } as Lab
    case 'lch':
      return { mode: 'lch', l: c1, c: c2, h: c3, alpha } as Lch
    case 'oklab':
      return { mode: 'oklab', l: c1, a: c2, b: c3, alpha } as Oklab
    case 'oklch':
      return { mode: 'oklch', l: c1, c: c2, h: c3, alpha } as Oklch
    case 'display-p3':
      return { mode: 'p3', r: c1, g: c2, b: c3, alpha } as P3
    case 'a98-rgb':
      return { mode: 'a98', r: c1, g: c2, b: c3, alpha } as A98
    case 'prophoto-rgb':
      return { mode: 'prophoto', r: c1, g: c2, b: c3, alpha } as Prophoto
    case 'rec2020':
      return { mode: 'rec2020', r: c1, g: c2, b: c3, alpha } as Rec2020
    case 'xyz-d65':
      return { mode: 'xyz65', x: c1, y: c2, z: c3, alpha } as Xyz65
    case 'xyz-d50':
      return { mode: 'xyz50', x: c1, y: c2, z: c3, alpha } as Xyz50
    default:
      return { mode: 'rgb', r: c1, g: c2, b: c3, alpha } as Rgb
  }
}

/**
 * Create a simple color transform with direct string conversion
 * Used for basic color formats (hex, rgb, hsl)
 *
 * @param converter - Function to convert color object to string
 * @returns Transform object
 *
 * @example
 * ```typescript
 * const hexTransform = createColorTransform('color:hex', colorObjectToHex)
 * ```
 */
export function createColorTransform(converter: (value: ColorValueObject) => string): Transform {
  return {
    matcher: (token: ResolvedToken) => token.$type === 'color',
    transform: (token: ResolvedToken) => {
      const value = token.$value as ColorValue

      if (!isColorObject(value)) {
        // String values should be alias references that get resolved before transforms
        return token
      }

      try {
        const converted = converter(value)
        return { ...token, $value: converted }
      } catch {
        // If conversion fails, return token unchanged
        return token
      }
    },
  }
}

/**
 * Create a modern color transform using culori converter
 * Used for CSS Color Module Level 4 color spaces (oklch, oklab, lch, lab, hwb)
 *
 * @param mode - Culori color mode to convert to
 * @returns Transform object
 *
 * @example
 * ```typescript
 * const oklchTransform = createModernColorTransform('color:oklch', 'oklch')
 * ```
 */
export function createModernColorTransform(mode: Mode): Transform {
  return {
    matcher: (token: ResolvedToken) => token.$type === 'color',
    transform: (token: ResolvedToken) => {
      const value = token.$value as ColorValue

      try {
        const parsed = dtcgObjectToCulori(value)

        if (parsed === null) {
          return token
        }

        // Convert to target color space
        const converted = converter(mode)(parsed)
        const formatted = formatCss(converted)

        if (formatted === '') {
          return token
        }

        return { ...token, $value: formatted }
      } catch {
        return token
      }
    },
  }
}
