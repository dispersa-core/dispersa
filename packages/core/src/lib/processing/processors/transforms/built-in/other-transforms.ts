/**
 * @fileoverview Other built-in value transforms
 */

import { ResolvedToken } from '@lib/tokens/types'

import type { Transform } from '../types'

/**
 * Convert font weight to numeric value
 */
export function fontWeightToNumber(): Transform {
  return {
    matcher: (token: ResolvedToken) => token.$type === 'fontWeight',
    transform: (token: ResolvedToken) => {
      const value = token.$value

      if (typeof value === 'number') {
        return token
      }

      if (typeof value === 'string') {
        const weightMap: Record<string, number> = {
          thin: 100,
          hairline: 100,
          'extra-light': 200,
          'ultra-light': 200,
          light: 300,
          normal: 400,
          regular: 400,
          medium: 500,
          'semi-bold': 600,
          'demi-bold': 600,
          bold: 700,
          'extra-bold': 800,
          'ultra-bold': 800,
          black: 900,
          heavy: 900,
          'extra-black': 950,
          'ultra-black': 950,
        }

        const weight = weightMap[value.toLowerCase()]
        if (weight !== undefined) {
          return { ...token, $value: weight }
        }
      }

      return token
    },
  }
}

/**
 * Convert duration to milliseconds
 */
export function durationToMs(): Transform {
  return {
    matcher: (token: ResolvedToken) => token.$type === 'duration',
    transform: (token: ResolvedToken) => {
      const rawValue = token.$value
      if (
        typeof rawValue === 'object' &&
        rawValue !== null &&
        'value' in rawValue &&
        'unit' in rawValue
      ) {
        const unit = rawValue.unit as string
        const numeric = Number((rawValue as { value?: unknown }).value)
        if (Number.isFinite(numeric)) {
          if (unit === 'ms') {
            return token
          }
          if (unit === 's') {
            return { ...token, $value: { value: numeric * 1000, unit: 'ms' } }
          }
        }
        return token
      }

      const value =
        typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : ''

      // Already ms
      if (value.endsWith('ms')) {
        const numeric = parseFloat(value)
        if (Number.isFinite(numeric)) {
          return { ...token, $value: { value: numeric, unit: 'ms' } }
        }
        return token
      }

      // Convert seconds to ms
      if (value.endsWith('s')) {
        const num = parseFloat(value)
        return { ...token, $value: { value: num * 1000, unit: 'ms' } }
      }

      return token
    },
  }
}

/**
 * Convert duration to seconds
 */
export function durationToSeconds(): Transform {
  return {
    matcher: (token: ResolvedToken) => token.$type === 'duration',
    transform: (token: ResolvedToken) => {
      const rawValue = token.$value
      if (
        typeof rawValue === 'object' &&
        rawValue !== null &&
        'value' in rawValue &&
        'unit' in rawValue
      ) {
        const unit = rawValue.unit as string
        const numeric = Number((rawValue as { value?: unknown }).value)
        if (Number.isFinite(numeric)) {
          if (unit === 's') {
            return token
          }
          if (unit === 'ms') {
            return { ...token, $value: { value: numeric / 1000, unit: 's' } }
          }
        }
        return token
      }

      const value =
        typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : ''

      // Already seconds
      if (value.endsWith('s') && !value.endsWith('ms')) {
        const numeric = parseFloat(value)
        if (Number.isFinite(numeric)) {
          return { ...token, $value: { value: numeric, unit: 's' } }
        }
        return token
      }

      // Convert ms to seconds
      if (value.endsWith('ms')) {
        const num = parseFloat(value)
        return { ...token, $value: { value: num / 1000, unit: 's' } }
      }

      return token
    },
  }
}
