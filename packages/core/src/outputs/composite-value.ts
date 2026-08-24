/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @fileoverview Shared composite-value formatting helpers for renderers
 * Consolidates composite-token leaf traversal, whole-value builders, and
 * shadow-layer normalization shared by the CSS, Tailwind, iOS, and Android renderers.
 */

import { colorObjectToHex, isColorObject } from '@processing/transforms/built-in/color-converter'
import {
  dimensionObjectToString,
  isDimensionObject,
} from '@processing/transforms/built-in/dimension-converter'
import {
  durationObjectToString,
  isDurationObject,
} from '@processing/transforms/built-in/duration-converter'
import type { GradientStop, ResolvedToken, ShadowValueObject } from '@shared/token-types'

export type CompositeLeaf = {
  path: string[]
  value: unknown
}

/**
 * Determines whether a token holds a composite (object- or array-valued) value
 * for one of the DTCG composite types (shadow, typography, border, strokeStyle,
 * transition, gradient).
 */
export function isCompositeToken(token: ResolvedToken): boolean {
  const isCompositeType = [
    'shadow',
    'typography',
    'border',
    'strokeStyle',
    'transition',
    'gradient',
  ].includes(token.$type ?? '')
  if (!isCompositeType) {
    return false
  }

  const value = token.$value
  return (typeof value === 'object' && value !== null) || Array.isArray(value)
}

/**
 * Builds the whole-value string for a composite token.
 *
 * @param token - The composite token
 * @param preserveReferences - Whether references should be kept as var() references
 * @param formatResolvedValue - Callback that formats a token's resolved value (used
 *   when references are not preserved)
 */
export function buildCompositeWholeValue(
  token: ResolvedToken,
  preserveReferences: boolean,
  formatResolvedValue: (token: ResolvedToken) => string,
): string | undefined {
  if (token.$type === 'shadow') {
    // Shadow always supports a whole-value (single or multi-layer)
    return preserveReferences ? buildShadowWholeValue(token) : formatResolvedValue(token)
  }
  if (token.$type === 'border') {
    // Border shorthand only works when style is a simple string (e.g. "solid").
    // Complex strokeStyle objects can't be represented as a CSS shorthand.
    if (!hasBorderShorthandStyle(token)) {
      return undefined
    }
    return preserveReferences ? buildBorderWholeValue(token) : formatResolvedValue(token)
  }
  if (token.$type === 'transition') {
    return preserveReferences ? buildTransitionWholeValue(token) : formatResolvedValue(token)
  }
  if (token.$type === 'gradient') {
    if (!isNonEmptyArray(token.$value)) {
      return undefined
    }
    return preserveReferences ? buildGradientWholeValue(token) : formatResolvedValue(token)
  }
  return undefined
}

/**
 * Returns whether a border token's style is a simple string (e.g. "solid"),
 * meaning it can be represented as a CSS border shorthand.
 */
export function hasBorderShorthandStyle(token: ResolvedToken): boolean {
  const value = token.$value
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return typeof (value as { style?: unknown }).style === 'string'
}

/**
 * Builds a var()-reference whole value for a shadow token (single or multi-layer).
 */
export function buildShadowWholeValue(token: ResolvedToken): string | undefined {
  const value = token.$value
  if (Array.isArray(value)) {
    return value
      .map((shadow, index) => buildShadowLayerValue(token.name, shadow, [String(index)]))
      .join(', ')
  }
  if (typeof value === 'object' && value !== null) {
    return buildShadowLayerValue(token.name, value, [])
  }
  return undefined
}

/**
 * Builds the var()-reference string for a single shadow layer.
 */
export function buildShadowLayerValue(baseName: string, shadow: unknown, prefix: string[]): string {
  if (typeof shadow !== 'object' || shadow === null) {
    return String(shadow)
  }
  const shadowObj = shadow as ShadowValueObject
  const parts: string[] = []

  if (shadowObj.inset === true) {
    parts.push('inset')
  }

  parts.push(buildCompositeVar(baseName, [...prefix, 'offsetX']))
  parts.push(buildCompositeVar(baseName, [...prefix, 'offsetY']))
  parts.push(buildCompositeVar(baseName, [...prefix, 'blur']))

  if (shadowObj.spread != null) {
    parts.push(buildCompositeVar(baseName, [...prefix, 'spread']))
  }

  parts.push(buildCompositeVar(baseName, [...prefix, 'color']))
  return parts.join(' ')
}

/**
 * Builds the var()-reference whole value for a border token with a string style.
 */
export function buildBorderWholeValue(token: ResolvedToken): string | undefined {
  const value = token.$value
  if (typeof value !== 'object' || value === null) {
    return undefined
  }
  const border = value as { style?: unknown }
  if (typeof border.style !== 'string') {
    return undefined
  }
  return [
    buildCompositeVar(token.name, ['width']),
    buildCompositeVar(token.name, ['style']),
    buildCompositeVar(token.name, ['color']),
  ].join(' ')
}

/**
 * Builds the var()-reference whole value for a transition token.
 */
export function buildTransitionWholeValue(token: ResolvedToken): string | undefined {
  const value = token.$value
  if (typeof value !== 'object' || value === null) {
    return undefined
  }
  return [
    buildCompositeVar(token.name, ['duration']),
    `cubic-bezier(${buildCompositeVar(token.name, ['timingFunction', '0'])}, ${buildCompositeVar(token.name, ['timingFunction', '1'])}, ${buildCompositeVar(token.name, ['timingFunction', '2'])}, ${buildCompositeVar(token.name, ['timingFunction', '3'])})`,
    buildCompositeVar(token.name, ['delay']),
  ].join(' ')
}

/**
 * Builds the var()-reference whole value for a gradient token.
 */
export function buildGradientWholeValue(token: ResolvedToken): string | undefined {
  const value = token.$value
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }
  return `linear-gradient(${value
    .map((_, index) => {
      const prefix = [String(index)]
      return `${buildCompositeVar(token.name, [...prefix, 'color'])} ${buildCompositeVar(
        token.name,
        [...prefix, 'position'],
      )}`
    })
    .join(', ')})`
}

/**
 * Clamps a DTCG gradient stop position to [0, 1].
 *
 * Per DTCG Format Appendix §9.7, positions outside [0, 1] are clamped rather
 * than rejected.
 */
export function clampGradientPosition(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Formats a gradient stop position (DTCG 0-1 number) as a clamped CSS percentage.
 *
 * Clamps to [0, 1] per DTCG Format Appendix §9.7, then rounds to two decimal
 * places to avoid float noise (e.g. `33.333333333333336%`).
 */
export function formatGradientPosition(value: number): string {
  const clamped = clampGradientPosition(value)
  return `${Math.round(clamped * 10000) / 100}%`
}

/**
 * Formats a gradient value as a CSS `linear-gradient()` string.
 */
export function formatGradientValue(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return String(value)
  }
  const stops = value as GradientStop[]
  return `linear-gradient(${stops
    .map((stop) => {
      const color = isColorObject(stop.color) ? colorObjectToHex(stop.color) : String(stop.color)
      const position =
        typeof stop.position === 'number'
          ? formatGradientPosition(stop.position)
          : String(stop.position)
      return `${color} ${position}`
    })
    .join(', ')})`
}

function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Builds a var() reference for a composite field path.
 */
export function buildCompositeVar(baseName: string, path: string[]): string {
  return `var(--${buildCompositeName(baseName, path)})`
}

/**
 * Collects leaf entries (path + value) from a composite value tree.
 */
export function collectCompositeLeaves(value: unknown): CompositeLeaf[] {
  const leaves: CompositeLeaf[] = []
  collectLeafEntries(value, [], leaves)
  return leaves
}

function collectLeafEntries(value: unknown, path: string[], leaves: CompositeLeaf[]): void {
  if (isPrimitiveValue(value)) {
    leaves.push({ path, value })
    return
  }

  if (isColorObject(value) || isDimensionObject(value) || isDurationObject(value)) {
    leaves.push({ path, value })
    return
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      leaves.push({ path, value })
      return
    }
    value.forEach((item, index) => {
      collectLeafEntries(item, [...path, String(index)], leaves)
    })
    return
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      leaves.push({ path, value })
      return
    }
    for (const [key, child] of entries) {
      collectLeafEntries(child, [...path, normalizePathSegment(key)], leaves)
    }
    return
  }

  leaves.push({ path, value })
}

function normalizePathSegment(segment: string): string {
  return segment.trim().replace(/\s+/g, '-')
}

/**
 * Builds a flattened CSS variable name from a base name and leaf path.
 */
export function buildCompositeName(base: string, path: string[]): string {
  if (path.length === 0) {
    return base
  }
  return `${base}-${path.join('-')}`
}

/**
 * Formats a single leaf value to its CSS string representation.
 */
export function formatLeafValue(value: unknown): string {
  if (isColorObject(value)) {
    return colorObjectToHex(value)
  }

  if (isDimensionObject(value)) {
    return dimensionObjectToString(value)
  }

  if (isDurationObject(value)) {
    return durationObjectToString(value)
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }

  if (typeof value === 'object' && value != null) {
    return JSON.stringify(value)
  }

  return String(value)
}

function isPrimitiveValue(value: unknown): boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Normalizes a shadow value into a list of shadow layers.
 *
 * Arrays pass through unchanged; single objects are wrapped in a one-element
 * array; any other value yields an empty array. Deliberately permissive (no
 * per-item type check) so it can serve as a drop-in for the renderers' existing
 * (sometimes no-guard) shadow-value branching.
 */
export function getShadowLayers(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'object' && value !== null) {
    return [value]
  }
  return []
}
