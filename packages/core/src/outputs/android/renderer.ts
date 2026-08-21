/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @fileoverview Android/Jetpack Compose renderer for design tokens
 * Generates Kotlin code targeting Jetpack Compose with Material 3.
 *
 * @experimental This renderer is experimental. Its API, generated code structure,
 * and options may change in future releases.
 *
 * Supports two structure modes:
 * - `'nested'` — token path hierarchy as nested `object` declarations
 * - `'flat'` — tokens grouped by type into semantic sub-objects (Colors, Spacing, etc.)
 */

import {
  colorObjectToHex,
  isColorObject,
  dtcgObjectToCulori,
} from '@processing/transforms/built-in/color-converter'
import { isDimensionObject } from '@processing/transforms/built-in/dimension-converter'
import { isDurationObject } from '@processing/transforms/built-in/duration-converter'
import { ConfigurationError } from '@shared/errors/index'
import { getSortedTokenEntries } from '@shared/utils/token-utils'
import type {
  ColorValueObject,
  DimensionValue,
  GradientStop,
  ResolvedToken,
  ResolvedTokens,
} from '@shared/token-types'
import { converter } from 'culori'

import {
  assertFileRequired,
  buildGeneratedFileHeader,
  buildInMemoryOutputKey,
  groupTokensByType,
  indentStr,
  resolveFileName,
  stripInternalMetadata,
  toSafeIdentifier,
} from '../utils'
import type { TokenGroup } from '../utils'
import { buildKotlinDeprecationAnnotation, buildTokenDescriptionComment } from '../metadata'
import { outputTree } from '../output-tree'
import { getShadowLayers } from '../composite-value'
import type { RenderContext, RenderOutput, Renderer } from '../types'

/**
 * Options for Android/Jetpack Compose renderer
 *
 * Note: `packageName` is marked optional for type compatibility with the Renderer
 * generic, but is validated as required at runtime in the renderer's format() method.
 *
 * @experimental This type is experimental. Properties and behavior may change.
 */
export type AndroidRendererOptions = {
  preset?: 'standalone' | 'bundle'
  packageName?: string
  objectName?: string
  /**
   * Color output format for Kotlin Color initializers.
   * - `'argb_hex'` (default) — `Color(0xAARRGGBB)` hex literal
   * - `'argb_float'` — `Color(r, g, b, a)` float components
   *
   * Legacy aliases: `'argb8'` maps to `'argb_hex'`, `'argb_floats'` maps to `'argb_float'`.
   */
  colorFormat?: 'argb_hex' | 'argb_float' | 'argb8' | 'argb_floats'
  /**
   * Color space for generated Color values.
   * - `'sRGB'` (default) — standard sRGB color space
   * - `'displayP3'` — Display P3 wide gamut via `ColorSpaces.DisplayP3`
   */
  colorSpace?: 'sRGB' | 'displayP3'
  /**
   * Structure mode for token organization.
   * - `'nested'` (default) — mirror token path hierarchy as nested objects
   * - `'flat'` — group tokens by $type into semantic sub-objects (Colors, Spacing, etc.)
   */
  structure?: 'nested' | 'flat'
  /**
   * Kotlin visibility modifier for the generated object and its members.
   * - `undefined` (default) — no explicit modifier, which means `public` in Kotlin
   * - `'public'` — explicit `public object` / `public val`
   * - `'internal'` — `internal object` / `internal val` (useful for KMP / multi-module)
   */
  visibility?: 'public' | 'internal'
  /** Number of spaces per indentation level (default 4) */
  indent?: number
}

/**
 * Internal resolved options with all defaults applied.
 */
type ResolvedOptions = {
  preset: 'standalone' | 'bundle'
  packageName: string
  objectName: string
  colorFormat: 'argb_hex' | 'argb_float'
  colorSpace: 'sRGB' | 'displayP3'
  structure: 'nested' | 'flat'
  visibility: 'public' | 'internal' | undefined
  visPrefix: string
  indent: number
}

type TokenTreeNode = {
  children: Map<string, TokenTreeNode>
  token?: ResolvedToken
}

const toSRGB = converter('rgb')
const toP3 = converter('p3')

const KOTLIN_KEYWORDS = new Set([
  'val',
  'var',
  'fun',
  'class',
  'object',
  'when',
  'is',
  'in',
  'return',
  'break',
  'continue',
  'do',
  'while',
  'for',
  'if',
  'else',
  'try',
  'catch',
  'throw',
  'as',
  'this',
  'super',
  'null',
  'true',
  'false',
])

const KOTLIN_TYPE_GROUP_MAP: Record<string, string> = {
  color: 'Colors',
  dimension: 'Spacing',
  fontFamily: 'Fonts',
  fontWeight: 'FontWeights',
  duration: 'Durations',
  shadow: 'Shadows',
  typography: 'Typography',
  number: 'Numbers',
  cubicBezier: 'Animations',
  border: 'Borders',
  gradient: 'Gradients',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveColorFormat(format?: string): 'argb_hex' | 'argb_float' {
  if (format === 'argb_floats' || format === 'argb_float') {
    return 'argb_float'
  }
  return 'argb_hex'
}

function escapeKotlinString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\$/g, '\\$')
}

function formatKotlinNumber(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value)
}

function formatKotlinFloat(value: number): string {
  return `${value}f`
}

function roundComponent(value: number): number {
  return Math.round(value * 1000) / 1000
}

function toResourceName(family: string): string {
  return family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export class AndroidRenderer implements Renderer<AndroidRendererOptions> {
  async format(context: RenderContext, options?: AndroidRendererOptions): Promise<RenderOutput> {
    if (!options?.packageName) {
      throw new ConfigurationError(
        `Output "${context.output.name}": packageName is required for Android output`,
      )
    }

    const visibility = options?.visibility
    const opts: ResolvedOptions = {
      preset: options?.preset ?? 'standalone',
      packageName: options.packageName,
      objectName: options?.objectName ?? 'DesignTokens',
      colorFormat: resolveColorFormat(options?.colorFormat),
      colorSpace: options?.colorSpace ?? 'sRGB',
      structure: options?.structure ?? 'nested',
      visibility,
      visPrefix: visibility ? `${visibility} ` : '',
      indent: options?.indent ?? 4,
    }

    if (opts.preset === 'bundle') {
      return await this.formatBundle(context, opts)
    }

    return await this.formatStandalone(context, opts)
  }

  // -----------------------------------------------------------------------
  // Token tree (nested mode)
  // -----------------------------------------------------------------------

  private buildTokenTree(tokens: ResolvedTokens): TokenTreeNode {
    const root: TokenTreeNode = { children: new Map() }

    for (const [, token] of getSortedTokenEntries(tokens)) {
      let current = root
      const segments = token.path

      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]!
        if (!current.children.has(seg)) {
          current.children.set(seg, { children: new Map() })
        }
        current = current.children.get(seg)!
      }

      const leafName = segments[segments.length - 1] ?? token.name
      const leaf: TokenTreeNode = current.children.get(leafName) ?? { children: new Map() }
      leaf.token = token
      current.children.set(leafName, leaf)
    }

    return root
  }

  // -----------------------------------------------------------------------
  // Flat structure grouping
  // -----------------------------------------------------------------------

  /**
   * Builds a flattened camelCase name from a token's path, stripping the
   * type prefix segment (which is already represented by the group object).
   */
  private buildFlatKotlinName(token: ResolvedToken): string {
    const path = token.path
    const withoutTypePrefix = path.length > 1 ? path.slice(1) : path
    const joined = withoutTypePrefix.join('_')
    return toSafeIdentifier(joined, KOTLIN_KEYWORDS, false)
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  private formatTokens(tokens: ResolvedTokens, options: ResolvedOptions): string {
    if (options.structure === 'flat') {
      return this.formatAsFlat(tokens, options)
    }
    return this.formatAsNested(tokens, options)
  }

  private formatAsNested(tokens: ResolvedTokens, options: ResolvedOptions): string {
    const tokenTypes = this.collectTokenTypesFromEntries(tokens)
    const tree = this.buildTokenTree(tokens)

    return this.buildFile(tokenTypes, options, (lines) => {
      lines.push(`@Suppress("unused")`)
      lines.push(`${options.visPrefix}object ${options.objectName} {`)
      this.renderTreeChildren(lines, tree, 1, options)
      lines.push('}')
    })
  }

  private formatAsFlat(tokens: ResolvedTokens, options: ResolvedOptions): string {
    const groups = groupTokensByType(tokens, KOTLIN_TYPE_GROUP_MAP)
    const tokenTypes = this.collectTokenTypesFromEntries(tokens)

    return this.buildFile(tokenTypes, options, (lines) => {
      lines.push(`@Suppress("unused")`)
      lines.push(`${options.visPrefix}object ${options.objectName} {`)
      this.renderFlatGroups(lines, groups, 1, options)
      lines.push('}')
    })
  }

  /**
   * Shared file preamble: header, package, imports, optional data class definitions.
   * The `renderBody` callback appends the main object(s) to `lines`.
   */
  private buildFile(
    tokenTypes: Set<string>,
    options: ResolvedOptions,
    renderBody: (lines: string[]) => void,
  ): string {
    const imports = this.collectImports(tokenTypes, options)
    const lines: string[] = []

    lines.push(buildGeneratedFileHeader())
    lines.push('')
    lines.push(`package ${options.packageName}`)
    lines.push('')

    for (const imp of imports) {
      lines.push(`import ${imp}`)
    }
    if (imports.length > 0) {
      lines.push('')
    }

    if (tokenTypes.has('shadow')) {
      lines.push(...this.buildShadowTokenClass(options))
      lines.push('')
    }

    if (tokenTypes.has('transition')) {
      lines.push(...this.buildTransitionStyleClass(options))
      lines.push('')
    }

    if (tokenTypes.has('strokeStyle') || tokenTypes.has('border')) {
      lines.push(...this.buildStrokeStyleTokenClass(options))
      lines.push('')
    }

    if (tokenTypes.has('border')) {
      lines.push(...this.buildBorderTokenClass(options))
      lines.push('')
    }

    renderBody(lines)
    lines.push('')

    return lines.join('\n')
  }

  private renderFlatGroups(
    lines: string[],
    groups: TokenGroup[],
    baseDepth: number,
    options: ResolvedOptions,
  ): void {
    const groupIndent = indentStr(options.indent, baseDepth)
    const valIndent = indentStr(options.indent, baseDepth + 1)

    for (const group of groups) {
      lines.push(`${groupIndent}${options.visPrefix}object ${group.name} {`)
      for (const token of group.tokens) {
        const kotlinName = this.buildFlatKotlinName(token)
        const kotlinValue = this.formatKotlinValue(token, options, baseDepth + 1)
        const annotation = this.typeAnnotationSuffix(token)

        const descriptionComment = buildTokenDescriptionComment(token, 'kotlin')
        if (descriptionComment) {
          lines.push(`${valIndent}${descriptionComment}`)
        }

        const deprecation = buildKotlinDeprecationAnnotation(token)
        if (deprecation) {
          lines.push(`${valIndent}${deprecation}`)
        }

        lines.push(
          `${valIndent}${options.visPrefix}val ${kotlinName}${annotation} = ${kotlinValue}`,
        )
      }
      lines.push(`${groupIndent}}`)
      lines.push('')
    }
  }

  private renderTreeChildren(
    lines: string[],
    node: TokenTreeNode,
    depth: number,
    options: ResolvedOptions,
  ): void {
    const pad = indentStr(options.indent, depth)
    const entries = Array.from(node.children.entries())

    for (let idx = 0; idx < entries.length; idx++) {
      const [key, child] = entries[idx]!

      if (child.token && child.children.size === 0) {
        this.renderLeaf(lines, key, child.token, depth, options)
      } else if (child.children.size > 0 && !child.token) {
        const objectName = toSafeIdentifier(key, KOTLIN_KEYWORDS, true)
        lines.push(`${pad}${options.visPrefix}object ${objectName} {`)
        this.renderTreeChildren(lines, child, depth + 1, options)
        lines.push(`${pad}}`)
        if (idx < entries.length - 1) {
          lines.push('')
        }
      } else {
        this.renderLeaf(lines, key, child.token!, depth, options)
        this.renderTreeChildren(lines, child, depth, options)
      }
    }
  }

  private renderLeaf(
    lines: string[],
    key: string,
    token: ResolvedToken,
    depth: number,
    options: ResolvedOptions,
  ): void {
    const pad = indentStr(options.indent, depth)
    const kotlinName = toSafeIdentifier(key, KOTLIN_KEYWORDS, false)
    const kotlinValue = this.formatKotlinValue(token, options, depth)
    const annotation = this.typeAnnotationSuffix(token)

    const descriptionComment = buildTokenDescriptionComment(token, 'kotlin')
    if (descriptionComment) {
      lines.push(`${pad}${descriptionComment}`)
    }

    const deprecation = buildKotlinDeprecationAnnotation(token)
    if (deprecation) {
      lines.push(`${pad}${deprecation}`)
    }

    lines.push(`${pad}${options.visPrefix}val ${kotlinName}${annotation} = ${kotlinValue}`)
  }

  // -----------------------------------------------------------------------
  // Shadow data class
  // -----------------------------------------------------------------------

  private buildShadowTokenClass(options: ResolvedOptions): string[] {
    const i1 = indentStr(options.indent, 1)
    return [
      '@Immutable',
      `${options.visPrefix}data class ShadowToken(`,
      `${i1}val color: Color,`,
      `${i1}val elevation: Dp,`,
      `${i1}val offsetX: Dp,`,
      `${i1}val offsetY: Dp,`,
      ')',
    ]
  }

  private buildTransitionStyleClass(options: ResolvedOptions): string[] {
    const i1 = indentStr(options.indent, 1)
    return [
      '@Immutable',
      `${options.visPrefix}data class TransitionStyle(`,
      `${i1}val duration: Duration,`,
      `${i1}val delay: Duration,`,
      `${i1}val easing: Easing,`,
      ')',
    ]
  }

  private buildStrokeStyleTokenClass(options: ResolvedOptions): string[] {
    const i1 = indentStr(options.indent, 1)
    return [
      '@Immutable',
      `${options.visPrefix}data class StrokeStyleToken(`,
      `${i1}val dash: List<Dp>,`,
      `${i1}val cap: StrokeCap,`,
      ')',
    ]
  }

  private buildBorderTokenClass(options: ResolvedOptions): string[] {
    const i1 = indentStr(options.indent, 1)
    return [
      '@Immutable',
      `${options.visPrefix}data class BorderToken(`,
      `${i1}val width: Dp,`,
      `${i1}val color: Color,`,
      `${i1}val style: StrokeStyleToken,`,
      ')',
    ]
  }

  // -----------------------------------------------------------------------
  // Imports (tree-shaken)
  // -----------------------------------------------------------------------

  private collectImports(tokenTypes: Set<string>, options: ResolvedOptions): string[] {
    const imports = new Set<string>()
    const ns = 'androidx.compose'
    const hasColors =
      tokenTypes.has('color') ||
      tokenTypes.has('shadow') ||
      tokenTypes.has('border') ||
      tokenTypes.has('gradient')

    if (hasColors) {
      imports.add(`${ns}.ui.graphics.Color`)
    }
    if (
      tokenTypes.has('dimension') ||
      tokenTypes.has('shadow') ||
      tokenTypes.has('border') ||
      tokenTypes.has('strokeStyle')
    ) {
      imports.add(`${ns}.ui.unit.Dp`)
      imports.add(`${ns}.ui.unit.dp`)
    }
    if (tokenTypes.has('typography') || tokenTypes.has('fontFamily')) {
      imports.add(`${ns}.ui.text.TextStyle`)
      imports.add(`${ns}.ui.unit.sp`)
    }
    if (tokenTypes.has('typography') || tokenTypes.has('fontWeight')) {
      imports.add(`${ns}.ui.text.font.FontWeight`)
    }
    if (tokenTypes.has('fontFamily')) {
      imports.add(`${ns}.ui.text.font.FontFamily`)
    }
    if (tokenTypes.has('duration') || tokenTypes.has('transition')) {
      imports.add('kotlin.time.Duration')
      imports.add('kotlin.time.Duration.Companion.milliseconds')
      imports.add('kotlin.time.Duration.Companion.seconds')
    }
    if (tokenTypes.has('cubicBezier') || tokenTypes.has('transition')) {
      imports.add(`${ns}.animation.core.CubicBezierEasing`)
    }
    if (tokenTypes.has('transition')) {
      imports.add(`${ns}.animation.core.Easing`)
      imports.add(`${ns}.animation.core.LinearEasing`)
    }
    if (
      tokenTypes.has('shadow') ||
      tokenTypes.has('transition') ||
      tokenTypes.has('strokeStyle') ||
      tokenTypes.has('border')
    ) {
      imports.add(`${ns}.runtime.Immutable`)
    }
    if (tokenTypes.has('strokeStyle') || tokenTypes.has('border')) {
      imports.add(`${ns}.ui.graphics.StrokeCap`)
    }
    if (tokenTypes.has('gradient')) {
      imports.add(`${ns}.ui.graphics.Brush`)
    }
    if (options.colorSpace === 'displayP3' && hasColors) {
      imports.add(`${ns}.ui.graphics.colorspace.ColorSpaces`)
    }

    return Array.from(imports).sort()
  }

  private collectTokenTypesFromEntries(tokens: ResolvedTokens): Set<string> {
    const types = new Set<string>()
    for (const [, token] of Object.entries(tokens)) {
      if (token.$type) {
        types.add(token.$type)
      }
    }
    return types
  }

  // -----------------------------------------------------------------------
  // Type annotations
  // -----------------------------------------------------------------------

  private getTypeAnnotation(token: ResolvedToken): string | undefined {
    switch (token.$type) {
      case 'color':
        return 'Color'
      case 'dimension':
        return 'Dp'
      case 'fontFamily':
        return 'FontFamily'
      case 'fontWeight':
        return 'FontWeight'
      case 'duration':
        return 'Duration'
      case 'shadow':
        return Array.isArray(token.$value) && token.$value.length > 1
          ? 'List<ShadowToken>'
          : 'ShadowToken'
      case 'cubicBezier':
        return 'CubicBezierEasing'
      case 'transition':
        return 'TransitionStyle'
      case 'strokeStyle':
        return 'StrokeStyleToken'
      case 'gradient':
        return 'Brush'
      case 'number':
        return 'Double'
      case 'typography':
        return 'TextStyle'
      case 'border':
        return 'BorderToken'
      default: {
        const value = token.$value
        if (typeof value === 'string') {
          return 'String'
        }
        if (typeof value === 'boolean') {
          return 'Boolean'
        }
        if (typeof value === 'number') {
          return 'Double'
        }
        return undefined
      }
    }
  }

  private typeAnnotationSuffix(token: ResolvedToken): string {
    const type = this.getTypeAnnotation(token)
    return type ? `: ${type}` : ''
  }

  // -----------------------------------------------------------------------
  // Value formatting
  // -----------------------------------------------------------------------

  private formatKotlinValue(token: ResolvedToken, options: ResolvedOptions, depth: number): string {
    const value = token.$value

    if (token.$type === 'color') {
      return this.formatColorValue(value, options)
    }
    if (token.$type === 'dimension') {
      return this.formatDimensionValue(value)
    }
    if (token.$type === 'fontFamily') {
      return this.formatFontFamilyValue(value)
    }
    if (token.$type === 'fontWeight') {
      return this.formatFontWeightValue(value)
    }
    if (token.$type === 'duration') {
      return this.formatDurationValue(value)
    }
    if (token.$type === 'shadow') {
      return this.formatShadowValue(value, options, depth)
    }
    if (token.$type === 'typography') {
      return this.formatTypographyValue(value, options, depth)
    }
    if (token.$type === 'border') {
      return this.formatBorderValue(value, options)
    }
    if (token.$type === 'transition') {
      return this.formatTransitionValue(value)
    }
    if (token.$type === 'strokeStyle') {
      return this.formatStrokeStyleValue(value)
    }
    if (token.$type === 'gradient') {
      return this.formatGradientValue(value, options)
    }

    if (token.$type === 'number') {
      return typeof value === 'number' ? formatKotlinNumber(value) : String(value)
    }

    if (token.$type === 'cubicBezier' && Array.isArray(value) && value.length === 4) {
      return `CubicBezierEasing(${value[0]}f, ${value[1]}f, ${value[2]}f, ${value[3]}f)`
    }

    if (typeof value === 'string') {
      return `"${escapeKotlinString(value)}"`
    }
    if (typeof value === 'number') {
      return formatKotlinNumber(value)
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    }

    return `"${escapeKotlinString(String(value))}"`
  }

  private formatColorValue(value: unknown, options: ResolvedOptions): string {
    if (!isColorObject(value)) {
      if (typeof value === 'string') {
        const hex = value.replace('#', '')
        if (/^[0-9a-fA-F]{6,8}$/.test(hex)) {
          const argb = hex.length === 8 ? hex : `FF${hex}`
          return `Color(0x${argb.toUpperCase()})`
        }
      }
      return 'Color.Unspecified'
    }

    const colorObj = value as ColorValueObject
    const alpha = colorObj.alpha ?? 1

    if (options.colorFormat === 'argb_float' || options.colorSpace === 'displayP3') {
      return this.formatFloatColor(colorObj, alpha, options)
    }

    return this.formatHexColor(colorObj, alpha)
  }

  private formatFloatColor(
    colorObj: ColorValueObject,
    alpha: number,
    options: ResolvedOptions,
  ): string {
    if (options.colorSpace === 'displayP3') {
      const p3 = toP3(dtcgObjectToCulori(colorObj))
      const r = roundComponent(p3?.r ?? 0)
      const g = roundComponent(p3?.g ?? 0)
      const b = roundComponent(p3?.b ?? 0)
      return `Color(${r}f, ${g}f, ${b}f, ${roundComponent(alpha)}f, ColorSpaces.DisplayP3)`
    }

    const rgb = toSRGB(dtcgObjectToCulori(colorObj))
    const r = roundComponent(rgb?.r ?? 0)
    const g = roundComponent(rgb?.g ?? 0)
    const b = roundComponent(rgb?.b ?? 0)
    return `Color(${r}f, ${g}f, ${b}f, ${roundComponent(alpha)}f)`
  }

  private formatHexColor(colorObj: ColorValueObject, alpha: number): string {
    const hex = colorObjectToHex(colorObj)
    const hexClean = hex.replace('#', '')

    if (hexClean.length === 8) {
      const rrggbb = hexClean.slice(0, 6)
      const aa = hexClean.slice(6, 8)
      return `Color(0x${aa.toUpperCase()}${rrggbb.toUpperCase()})`
    }

    const alphaHex =
      alpha < 1
        ? Math.round(alpha * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase()
        : 'FF'
    return `Color(0x${alphaHex}${hexClean.toUpperCase()})`
  }

  private formatDimensionValue(value: unknown): string {
    if (isDimensionObject(value)) {
      const dim = value as DimensionValue
      const dpValue = dim.unit === 'rem' ? dim.value * 16 : dim.value
      return `${dpValue}.dp`
    }

    return typeof value === 'number' ? `${value}.dp` : `0.dp`
  }

  private formatFontFamilyValue(value: unknown): string {
    if (Array.isArray(value)) {
      const primary = value[0]
      if (typeof primary === 'string') {
        return this.mapKotlinFontFamily(primary)
      }
      return 'FontFamily.Default'
    }

    return typeof value === 'string' ? this.mapKotlinFontFamily(value) : 'FontFamily.Default'
  }

  private mapKotlinFontFamily(family: string): string {
    const normalized = family.toLowerCase().replace(/['"]/g, '').trim()
    const builtIn: Record<string, string> = {
      'sans-serif': 'FontFamily.SansSerif',
      serif: 'FontFamily.Serif',
      monospace: 'FontFamily.Monospace',
      cursive: 'FontFamily.Cursive',
    }

    return (
      builtIn[normalized] ??
      `FontFamily.Default // TODO: load "${family}" via Font(R.font.${toResourceName(family)})`
    )
  }

  private formatFontWeightValue(value: unknown): string {
    if (typeof value === 'number') {
      return this.numericFontWeight(value)
    }
    if (typeof value === 'string') {
      return this.namedFontWeight(value) ?? 'FontWeight.Normal'
    }
    return 'FontWeight.Normal'
  }

  private numericFontWeight(weight: number): string {
    if (weight <= 100) {
      return 'FontWeight.Thin'
    }
    if (weight <= 200) {
      return 'FontWeight.ExtraLight'
    }
    if (weight <= 300) {
      return 'FontWeight.Light'
    }
    if (weight <= 400) {
      return 'FontWeight.Normal'
    }
    if (weight <= 500) {
      return 'FontWeight.Medium'
    }
    if (weight <= 600) {
      return 'FontWeight.SemiBold'
    }
    if (weight <= 700) {
      return 'FontWeight.Bold'
    }
    if (weight <= 800) {
      return 'FontWeight.ExtraBold'
    }
    return 'FontWeight.Black'
  }

  private namedFontWeight(name: string): string | undefined {
    const map: Record<string, string> = {
      thin: 'FontWeight.Thin',
      extralight: 'FontWeight.ExtraLight',
      ultralight: 'FontWeight.ExtraLight',
      light: 'FontWeight.Light',
      regular: 'FontWeight.Normal',
      normal: 'FontWeight.Normal',
      medium: 'FontWeight.Medium',
      semibold: 'FontWeight.SemiBold',
      demibold: 'FontWeight.SemiBold',
      bold: 'FontWeight.Bold',
      extrabold: 'FontWeight.ExtraBold',
      heavy: 'FontWeight.ExtraBold',
      black: 'FontWeight.Black',
      ultrabold: 'FontWeight.Black',
    }

    return map[name.toLowerCase()]
  }

  private formatDurationValue(value: unknown): string {
    if (isDurationObject(value)) {
      return value.unit === 'ms' ? `${value.value}.milliseconds` : `${value.value}.seconds`
    }

    return typeof value === 'number' ? `${value}.milliseconds` : '0.milliseconds'
  }

  private formatShadowValue(value: unknown, options: ResolvedOptions, depth: number): string {
    const layers = getShadowLayers(value)
    if (layers.length === 0) {
      return 'ShadowToken(color = Color.Unspecified, elevation = 0.dp, offsetX = 0.dp, offsetY = 0.dp)'
    }

    if (layers.length === 1) {
      return this.formatSingleShadow(layers[0] as Record<string, unknown>, options, depth)
    }

    const itemIndent = indentStr(options.indent, depth + 1)
    const shadows = layers
      .map((layer) => {
        const block = this.formatSingleShadow(layer as Record<string, unknown>, options, depth + 1)
        return block.replace(/^ShadowToken/, `${itemIndent}ShadowToken`)
      })
      .join(',\n')
    return `listOf(\n${shadows},\n${indentStr(options.indent, depth)})`
  }

  private formatSingleShadow(
    shadow: Record<string, unknown>,
    options: ResolvedOptions,
    depth: number,
  ): string {
    const color = isColorObject(shadow.color)
      ? this.formatColorValue(shadow.color, options)
      : 'Color.Black'

    const elevation = isDimensionObject(shadow.blur)
      ? this.formatDimensionValue(shadow.blur)
      : '0.dp'

    const offsetX = isDimensionObject(shadow.offsetX)
      ? this.formatDimensionValue(shadow.offsetX)
      : '0.dp'

    const offsetY = isDimensionObject(shadow.offsetY)
      ? this.formatDimensionValue(shadow.offsetY)
      : '0.dp'

    const propIndent = indentStr(options.indent, depth + 1)
    const closeIndent = indentStr(options.indent, depth)
    return [
      'ShadowToken(',
      `${propIndent}color = ${color},`,
      `${propIndent}elevation = ${elevation},`,
      `${propIndent}offsetX = ${offsetX},`,
      `${propIndent}offsetY = ${offsetY},`,
      `${closeIndent})`,
    ].join('\n')
  }

  private formatBorderValue(value: unknown, options: ResolvedOptions): string {
    if (typeof value !== 'object' || value === null) {
      return 'BorderToken(width = 0.dp, color = Color.Unspecified, style = StrokeStyleToken(dash = emptyList(), cap = StrokeCap.Butt))'
    }

    const border = value as Record<string, unknown>
    const width = isDimensionObject(border.width) ? this.formatDimensionValue(border.width) : '0.dp'

    const color = isColorObject(border.color)
      ? this.formatColorValue(border.color, options)
      : 'Color.Unspecified'

    const style = this.formatStrokeStyleValue(border.style)

    return `BorderToken(width = ${width}, color = ${color}, style = ${style})`
  }

  private formatTransitionValue(value: unknown): string {
    if (typeof value !== 'object' || value === null) {
      return 'TransitionStyle(duration = 0.milliseconds, delay = 0.milliseconds, easing = LinearEasing)'
    }

    const transition = value as Record<string, unknown>
    const duration = this.formatDurationValue(transition.duration)
    const delay = this.formatDurationValue(transition.delay)

    return `TransitionStyle(duration = ${duration}, delay = ${delay}, easing = ${this.formatEasingValue(
      transition.timingFunction,
    )})`
  }

  private formatEasingValue(value: unknown): string {
    if (
      Array.isArray(value) &&
      value.length === 4 &&
      value.every((v) => typeof v === 'number' && Number.isFinite(v))
    ) {
      return `CubicBezierEasing(${value[0]}f, ${value[1]}f, ${value[2]}f, ${value[3]}f)`
    }
    return 'LinearEasing'
  }

  /**
   * Maps a DTCG stroke-style keyword to a Kotlin dash pattern.
   *
   * `solid`/`double`/`groove`/`ridge`/`outset`/`inset` have no Compose stroke-path
   * equivalent and fall back to a solid (empty-dash) render — a documented
   * limitation mirroring the iOS renderer's identical carve-out.
   */
  private keywordStrokeStyle(keyword: string): string {
    const normalized = keyword.toLowerCase()
    const dash: Record<string, string> = {
      dashed: 'listOf(4.dp, 4.dp)',
      dotted: 'listOf(1.dp, 2.dp)',
    }
    const lineCap: Record<string, string> = {
      dotted: 'StrokeCap.Round',
    }
    return `StrokeStyleToken(dash = ${dash[normalized] ?? 'emptyList()'}, cap = ${lineCap[normalized] ?? 'StrokeCap.Butt'})`
  }

  private formatStrokeStyleValue(value: unknown): string {
    if (typeof value === 'string') {
      return this.keywordStrokeStyle(value)
    }

    if (typeof value === 'object' && value !== null) {
      const style = value as Record<string, unknown>
      const dash = Array.isArray(style.dashArray)
        ? style.dashArray
            .map((d) => (isDimensionObject(d) ? this.formatDimensionValue(d) : '0.dp'))
            .join(', ')
        : ''

      return `StrokeStyleToken(dash = ${
        dash ? `listOf(${dash})` : 'emptyList()'
      }, cap = ${this.formatLineCap(style.lineCap)})`
    }

    return 'StrokeStyleToken(dash = emptyList(), cap = StrokeCap.Butt)'
  }

  private formatLineCap(lineCap: unknown): string {
    if (lineCap === 'round') {
      return 'StrokeCap.Round'
    }
    if (lineCap === 'square') {
      return 'StrokeCap.Square'
    }
    return 'StrokeCap.Butt'
  }

  private formatGradientValue(value: unknown, options: ResolvedOptions): string {
    if (!Array.isArray(value) || value.length === 0) {
      return 'Brush.linearGradient(colorStops = arrayOf())'
    }

    const stops = (value as GradientStop[]).map((stop) => {
      const color = isColorObject(stop.color)
        ? this.formatColorValue(stop.color, options)
        : 'Color.Unspecified'
      const position = typeof stop.position === 'number' ? formatKotlinFloat(stop.position) : '0f'
      return `${position} to ${color}`
    })

    return `Brush.linearGradient(colorStops = arrayOf(${stops.join(', ')}))`
  }

  private formatTypographyValue(value: unknown, options: ResolvedOptions, depth: number): string {
    if (typeof value !== 'object' || value === null) {
      return 'TextStyle()'
    }

    const typo = value as Record<string, unknown>
    const parts: string[] = []

    if (isDimensionObject(typo.fontSize)) {
      const dim = typo.fontSize as DimensionValue
      const spValue = dim.unit === 'rem' ? dim.value * 16 : dim.value
      parts.push(`fontSize = ${spValue}.sp`)
    }

    if (typo.fontWeight != null) {
      parts.push(`fontWeight = ${this.formatFontWeightValue(typo.fontWeight)}`)
    }

    if (typo.lineHeight != null && typeof typo.lineHeight === 'number') {
      if (isDimensionObject(typo.fontSize)) {
        const dim = typo.fontSize as DimensionValue
        const spValue = dim.unit === 'rem' ? dim.value * 16 : dim.value
        const lineHeightSp = Math.round(spValue * typo.lineHeight * 100) / 100
        parts.push(`lineHeight = ${lineHeightSp}.sp`)
      }
    }

    if (isDimensionObject(typo.letterSpacing)) {
      const dim = typo.letterSpacing as DimensionValue
      const spValue = dim.unit === 'rem' ? dim.value * 16 : dim.value
      parts.push(`letterSpacing = ${spValue}.sp`)
    }

    if (parts.length === 0) {
      return 'TextStyle()'
    }

    const propIndent = indentStr(options.indent, depth + 1)
    const closeIndent = indentStr(options.indent, depth)
    return `TextStyle(\n${parts.map((p) => `${propIndent}${p}`).join(',\n')},\n${closeIndent})`
  }

  // -----------------------------------------------------------------------
  // Output: standalone
  // -----------------------------------------------------------------------

  private async formatStandalone(
    context: RenderContext,
    options: ResolvedOptions,
  ): Promise<RenderOutput> {
    assertFileRequired(
      context.buildPath,
      context.output.file,
      context.output.name,
      'standalone Android',
    )

    const files: Record<string, string> = {}
    for (const { tokens, modifierInputs } of context.permutations) {
      const processedTokens = stripInternalMetadata(tokens)
      const content = this.formatTokens(processedTokens, options)
      const fileName = context.output.file
        ? resolveFileName(context.output.file, modifierInputs)
        : buildInMemoryOutputKey({
            outputName: context.output.name,
            extension: 'kt',
            modifierInputs,
            resolver: context.resolver,
            defaults: context.meta.defaults,
          })
      files[fileName] = content
    }

    return outputTree(files)
  }

  // -----------------------------------------------------------------------
  // Output: bundle
  // -----------------------------------------------------------------------

  private async formatBundle(
    context: RenderContext,
    options: ResolvedOptions,
  ): Promise<RenderOutput> {
    assertFileRequired(
      context.buildPath,
      context.output.file,
      context.output.name,
      'bundle Android',
    )

    const content = this.formatBundleContent(context, options)
    const fileName = context.output.file
      ? resolveFileName(context.output.file, context.meta.basePermutation)
      : buildInMemoryOutputKey({
          outputName: context.output.name,
          extension: 'kt',
          modifierInputs: context.meta.basePermutation,
          resolver: context.resolver,
          defaults: context.meta.defaults,
        })

    return outputTree({ [fileName]: content })
  }

  private formatBundleContent(context: RenderContext, options: ResolvedOptions): string {
    const allTokenTypes = this.collectAllPermutationTypes(context)

    return this.buildFile(allTokenTypes, options, (lines) => {
      const i1 = indentStr(options.indent, 1)

      lines.push(`@Suppress("unused")`)
      lines.push(`${options.visPrefix}object ${options.objectName} {`)

      for (let idx = 0; idx < context.permutations.length; idx++) {
        const { tokens, modifierInputs } = context.permutations[idx]!
        const processedTokens = stripInternalMetadata(tokens)
        const permName = this.buildPermutationName(modifierInputs)
        lines.push(`${i1}${options.visPrefix}object ${permName} {`)
        this.renderBundleTokens(lines, processedTokens, options, 2)
        lines.push(`${i1}}`)
        if (idx < context.permutations.length - 1) {
          lines.push('')
        }
      }

      lines.push('}')
    })
  }

  private collectAllPermutationTypes(context: RenderContext): Set<string> {
    const types = new Set<string>()
    for (const { tokens } of context.permutations) {
      for (const t of this.collectTokenTypesFromEntries(stripInternalMetadata(tokens))) {
        types.add(t)
      }
    }
    return types
  }

  private renderBundleTokens(
    lines: string[],
    tokens: ResolvedTokens,
    options: ResolvedOptions,
    baseDepth: number,
  ): void {
    if (options.structure === 'flat') {
      const groups = groupTokensByType(tokens, KOTLIN_TYPE_GROUP_MAP)
      this.renderFlatGroups(lines, groups, baseDepth, options)
      return
    }

    const tree = this.buildTokenTree(tokens)
    this.renderTreeChildren(lines, tree, baseDepth, options)
  }

  private buildPermutationName(modifierInputs: Record<string, string>): string {
    const values = Object.values(modifierInputs)
    if (values.length === 0) {
      return 'Default'
    }
    return values.map((v) => toSafeIdentifier(v, KOTLIN_KEYWORDS, true)).join('')
  }
}

/**
 * Android/Jetpack Compose renderer factory function.
 *
 * @example
 * ```typescript
 * outputs: [{
 *   name: 'android',
 *   renderer: androidRenderer(),
 *   options: {
 *     packageName: 'com.example.tokens',
 *     objectName: 'DesignTokens',
 *     colorFormat: 'argb_hex',
 *   },
 *   file: 'DesignTokens-{theme}.kt'
 * }]
 * ```
 */
export function androidRenderer(): Renderer<AndroidRendererOptions> {
  const rendererInstance = new AndroidRenderer()
  return {
    format: (context, options) =>
      rendererInstance.format(
        context,
        options ?? (context.output.options as AndroidRendererOptions | undefined),
      ),
  }
}
