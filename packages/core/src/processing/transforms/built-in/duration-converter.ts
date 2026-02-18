/**
 * @fileoverview Duration format conversion utilities for DTCG 2025.10
 * Handles duration object format { value: number, unit: 'ms' | 's' }
 */

import type { DurationValue } from '@tokens/types'

/**
 * Check if a value is in duration object format
 */
export function isDurationObject(value: unknown): value is DurationValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'unit' in value &&
    (value as { unit?: unknown }).unit !== undefined
  )
}

/**
 * Convert DTCG duration object to CSS string
 */
export function durationObjectToString(duration: DurationValue): string {
  return `${duration.value}${duration.unit}`
}
