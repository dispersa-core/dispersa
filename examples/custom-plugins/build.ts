#!/usr/bin/env tsx

/**
 * Custom Plugins Example - Dispersa Build Script
 *
 * This script demonstrates how to extend Dispersa with custom plugins:
 * 1. Custom Filter - Filter tokens by type (color tokens only)
 * 2. Custom Renderer - YAML output format
 * 3. Custom Transform - Transform token names (uppercase)
 *
 * Custom plugins allow you to extend Dispersa with any output format,
 * transformation logic, or filtering criteria your design system needs.
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import yaml from 'yaml'

import {
  Dispersa,
  outputTree,
  type Filter,
  type ModifierInputs,
  type Renderer,
  type RenderContext,
  type ResolvedToken,
  type ResolvedTokens,
} from 'dispersa'
import type { Transform } from 'dispersa/transforms'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Output directory
const outputDir = path.join(__dirname, 'output')

// ============================================================================
// CUSTOM PLUGINS
// ============================================================================

/**
 * Custom Filter: Filter only color tokens
 *
 * Filters determine which tokens are included in the output.
 * This filter only includes tokens of type 'color'.
 */
const colorOnlyFilter: Filter = {
  filter: (token: ResolvedToken) => {
    // Filter based on token type
    const isColor = token.$type === 'color'

    if (isColor) {
      console.log(`   ✓ Including color token: ${token.name}`)
    }

    return isColor
  },
}

/**
 * Custom Transform: Transform token names to uppercase
 *
 * Transforms modify tokens during processing. This transform changes
 * all token names to uppercase for the output format.
 */
const uppercaseNamesTransform: Transform = {
  // matcher determines which tokens this transform applies to
  // undefined/omitted means it applies to all tokens
  transform: (token: ResolvedToken) => {
    // Return a new token with transformed name
    return {
      ...token,
      name: token.name.toUpperCase(),
    }
  },
}

/**
 * Custom Renderer: YAML output format
 *
 * Renderers convert resolved tokens into the desired output format.
 * This renderer generates YAML with two structure options: flat or nested.
 */
const yamlRenderer: Renderer = {
  format: (context: RenderContext) => {
    const structure =
      typeof context.output.options?.['structure'] === 'string'
        ? context.output.options['structure']
        : 'flat'

    const files: Record<string, string> = {}
    for (const { tokens, modifierInputs } of context.permutations) {
      console.log(`\n📝 Formatting ${Object.keys(tokens).length} tokens as YAML...`)
      console.log(`   Structure: ${structure}`)

      const content = structure === 'flat' ? formatFlatYaml(tokens) : formatNestedYaml(tokens)

      const fileName = resolveOutputFile(context.output.file, modifierInputs, 'tokens.yaml')
      files[fileName] = content
    }

    return outputTree(files)
  },
}

type Rgba = {
  r: number
  g: number
  b: number
  a: number
}

type SwiftEntry = {
  name: string
  type: 'Color' | 'CGFloat' | 'Double' | 'TimeInterval' | 'String'
  value: string
}

type SwiftRendererOptions = {
  moduleName: string
  enums: {
    colors: string
    dimensions: string
    numbers: string
    durations: string
    fontFamilies: string
    fontWeights: string
  }
}

const defaultSwiftOptions: SwiftRendererOptions = {
  moduleName: 'DesignTokens',
  enums: {
    colors: 'Colors',
    dimensions: 'Dimensions',
    numbers: 'Numbers',
    durations: 'Durations',
    fontFamilies: 'FontFamilies',
    fontWeights: 'FontWeights',
  },
}

const swiftUiRenderer = (options?: Partial<SwiftRendererOptions>): Renderer => {
  const resolvedOptions = {
    ...defaultSwiftOptions,
    ...options,
    enums: {
      ...defaultSwiftOptions.enums,
      ...options?.enums,
    },
  }

  return {
    format: (context: RenderContext) => {
      const files: Record<string, string> = {}
      const defaults = context.meta.defaults

      for (const { tokens, modifierInputs } of context.permutations) {
        const content = buildSwiftFile(tokens, resolvedOptions)
        const fileName = resolveOutputFile(
          context.output.file,
          modifierInputs,
          buildSwiftFallback(modifierInputs),
        )
        files[fileName] = content

        console.log(
          `   ✓ SwiftUI output (${formatPermutationLabel(modifierInputs, defaults)}): ${fileName}`,
        )
      }

      return outputTree(files)
    },
  }
}

const androidXmlRenderer = (): Renderer => {
  return {
    format: (context: RenderContext) => {
      const files: Record<string, string> = {}
      const defaults = context.meta.defaults

      for (const { tokens, modifierInputs } of context.permutations) {
        const themeValue = getThemeContext(modifierInputs, defaults)
        const resourceBase = themeValue === 'dark' ? 'values-night' : 'values'
        const baseDir = resolveOutputFile(context.output.file, modifierInputs, 'android')
        const colorContent = buildAndroidColors(tokens)
        const dimenContent = buildAndroidDimens(tokens)

        if (colorContent) {
          files[path.posix.join(baseDir, resourceBase, 'colors.xml')] = colorContent
        }

        if (dimenContent) {
          files[path.posix.join(baseDir, resourceBase, 'dimens.xml')] = dimenContent
        }

        if (colorContent || dimenContent) {
          console.log(
            `   ✓ Android XML (${formatPermutationLabel(modifierInputs, defaults)}): ${resourceBase}`,
          )
        }
      }

      return outputTree(files)
    },
  }
}

const formatPermutationLabel = (
  modifierInputs: ModifierInputs,
  defaults: Record<string, string>,
): string => {
  const entries = Object.entries(modifierInputs)
  if (entries.length === 0) {
    return 'base'
  }

  const parts = entries.map(([key, value]) => {
    const isDefault = defaults[key] === value
    return isDefault ? `${key}:${value}` : `${key}:${value}*`
  })
  return parts.join(', ')
}

const getThemeContext = (
  modifierInputs: ModifierInputs,
  defaults: Record<string, string>,
): string => {
  if (modifierInputs.theme) {
    return modifierInputs.theme
  }

  return defaults.theme ?? 'light'
}

const buildSwiftFile = (tokens: ResolvedTokens, options: SwiftRendererOptions): string => {
  const groups = buildSwiftEntries(tokens, options.enums)
  const sections = Object.entries(groups).filter(([, entries]) => entries.length > 0)
  const lines: string[] = ['import SwiftUI', '', `enum ${options.moduleName} {`]

  for (const [enumName, entries] of sections) {
    lines.push(`  enum ${enumName} {`)
    lines.push(...renderSwiftEntries(entries, '    '))
    lines.push('  }', '')
  }

  lines.push('}')
  return lines.join('\n')
}

const buildSwiftEntries = (
  tokens: ResolvedTokens,
  enums: SwiftRendererOptions['enums'],
): Record<string, SwiftEntry[]> => {
  return {
    [enums.colors]: buildSwiftColorEntries(tokens),
    [enums.dimensions]: buildSwiftDimensionEntries(tokens),
    [enums.numbers]: buildSwiftNumberEntries(tokens),
    [enums.durations]: buildSwiftDurationEntries(tokens),
    [enums.fontFamilies]: buildSwiftFontFamilyEntries(tokens),
    [enums.fontWeights]: buildSwiftFontWeightEntries(tokens),
  }
}

const renderSwiftEntries = (entries: SwiftEntry[], indent: string): string[] => {
  return entries.map((entry) => {
    const type = entry.type === 'Color' ? '' : `: ${entry.type}`
    return `${indent}static let ${entry.name}${type} = ${entry.value}`
  })
}

const buildSwiftColorEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'color') {
      continue
    }

    const colorValue = toSwiftColorValue(token.$value)
    if (!colorValue) {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'Color',
      value: colorValue,
    })
  }

  return entries
}

const buildSwiftDimensionEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'dimension') {
      continue
    }

    const value = extractDimensionValue(token.$value)
    if (value == null) {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'CGFloat',
      value: formatSwiftNumber(value),
    })
  }

  return entries
}

const buildSwiftNumberEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'number') {
      continue
    }

    if (typeof token.$value !== 'number') {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'Double',
      value: formatSwiftNumber(token.$value),
    })
  }

  return entries
}

const buildSwiftDurationEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'duration') {
      continue
    }

    const duration = parseDurationSeconds(token.$value)
    if (duration == null) {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'TimeInterval',
      value: formatSwiftNumber(duration),
    })
  }

  return entries
}

const buildSwiftFontFamilyEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'fontFamily') {
      continue
    }

    const value = extractFontFamilyValue(token.$value)
    if (!value) {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'String',
      value: JSON.stringify(value),
    })
  }

  return entries
}

const buildSwiftFontWeightEntries = (tokens: ResolvedTokens): SwiftEntry[] => {
  const entries: SwiftEntry[] = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'fontWeight') {
      continue
    }

    const weightValue = toNumericValue(token.$value)
    if (weightValue == null) {
      continue
    }

    entries.push({
      name: toSwiftIdentifier(token.name),
      type: 'Double',
      value: formatSwiftNumber(weightValue),
    })
  }

  return entries
}

const toSwiftColorValue = (value: unknown): string | null => {
  const rgba = parseRgba(value)
  if (!rgba) {
    return null
  }

  const { r, g, b, a } = rgba
  return `Color(.sRGB, red: ${formatSwiftNumber(r)}, green: ${formatSwiftNumber(g)}, blue: ${formatSwiftNumber(b)}, opacity: ${formatSwiftNumber(a)})`
}

const parseRgba = (value: unknown): Rgba | null => {
  if (typeof value === 'string') {
    return parseHexColor(value)
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  return parseDtcgColorObject(value as Record<string, unknown>)
}

const parseDtcgColorObject = (value: Record<string, unknown>): Rgba | null => {
  if (value.colorSpace !== 'srgb') {
    return null
  }

  const components = value.components
  if (!Array.isArray(components) || components.length < 3) {
    return null
  }

  const [r, g, b] = components
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') {
    return null
  }

  const alpha = typeof value.alpha === 'number' ? value.alpha : 1
  return {
    r: clamp01(r),
    g: clamp01(g),
    b: clamp01(b),
    a: clamp01(alpha),
  }
}

const parseHexColor = (value: string): Rgba | null => {
  const trimmed = value.trim()
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  if (hex.length !== 6 && hex.length !== 8) {
    return null
  }

  const number = Number.parseInt(hex, 16)
  if (Number.isNaN(number)) {
    return null
  }

  const hasAlpha = hex.length === 8
  const r = (number >> (hasAlpha ? 24 : 16)) & 0xff
  const g = (number >> (hasAlpha ? 16 : 8)) & 0xff
  const b = (number >> (hasAlpha ? 8 : 0)) & 0xff
  const a = hasAlpha ? number & 0xff : 0xff

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a: a / 255,
  }
}

const clamp01 = (value: number): number => {
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

const extractDimensionValue = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const dimension = value as { value?: unknown }
  if (typeof dimension.value !== 'number') {
    return null
  }

  return dimension.value
}

const extractFontFamilyValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string')
    return typeof first === 'string' ? first : null
  }

  return null
}

const parseDurationSeconds = (value: unknown): number | null => {
  if (typeof value !== 'string') {
    return null
  }

  const match = value.trim().match(/^(\d+(\.\d+)?)(ms|s)$/)
  if (!match) {
    return null
  }

  const numberValue = Number.parseFloat(match[1] ?? '')
  if (Number.isNaN(numberValue)) {
    return null
  }

  const unit = match[3]
  return unit === 'ms' ? numberValue / 1000 : numberValue
}

const toNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

const formatSwiftNumber = (value: number): string => {
  const rounded = Math.round(value * 10000) / 10000
  return rounded.toString()
}

const toSwiftIdentifier = (name: string): string => {
  const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  const [first, ...rest] = parts
  const head = first ? first.toLowerCase() : 'token'
  const tail = rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  const combined = [head, ...tail].join('')

  return /^\d/.test(combined) ? `token${combined}` : combined
}

const buildAndroidColors = (tokens: ResolvedTokens): string | null => {
  const entries = buildAndroidColorEntries(tokens)
  if (entries.length === 0) {
    return null
  }

  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    ...entries.map((entry) => `  <color name="${entry.name}">${entry.value}</color>`),
    '</resources>',
  ]

  return lines.join('\n')
}

const buildAndroidDimens = (tokens: ResolvedTokens): string | null => {
  const entries = buildAndroidDimenEntries(tokens)
  if (entries.length === 0) {
    return null
  }

  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<resources>',
    ...entries.map((entry) => `  <dimen name="${entry.name}">${entry.value}</dimen>`),
    '</resources>',
  ]

  return lines.join('\n')
}

const buildAndroidColorEntries = (
  tokens: ResolvedTokens,
): Array<{ name: string; value: string }> => {
  const entries: Array<{ name: string; value: string }> = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'color') {
      continue
    }

    const rgba = parseRgba(token.$value)
    if (!rgba) {
      continue
    }

    entries.push({
      name: toAndroidResourceName(token.name),
      value: rgbaToHex(rgba),
    })
  }

  return entries
}

const buildAndroidDimenEntries = (
  tokens: ResolvedTokens,
): Array<{ name: string; value: string }> => {
  const entries: Array<{ name: string; value: string }> = []

  for (const token of Object.values(tokens) as ResolvedToken[]) {
    if (token.$type !== 'dimension') {
      continue
    }

    const dimension = token.$value as { value?: number; unit?: string }
    if (typeof dimension?.value !== 'number') {
      continue
    }

    const unit = resolveAndroidUnit(dimension, token)
    entries.push({
      name: toAndroidResourceName(token.name),
      value: `${formatSwiftNumber(dimension.value)}${unit}`,
    })
  }

  return entries
}

const resolveAndroidUnit = (
  dimension: { value?: number; unit?: string; $extensions?: unknown },
  token: ResolvedToken,
): string => {
  const extensionUnit = extractAndroidExtensionUnit(token.$extensions)
  if (extensionUnit) {
    return extensionUnit
  }

  const unitMap: Record<string, string> = {
    px: 'dp',
    rem: 'sp',
    em: 'sp',
    pt: 'sp',
  }

  return unitMap[dimension.unit ?? ''] ?? 'dp'
}

const extractAndroidExtensionUnit = (extensions: unknown): string | null => {
  if (!extensions || typeof extensions !== 'object') {
    return null
  }

  const android = (extensions as { android?: unknown }).android
  if (!android || typeof android !== 'object') {
    return null
  }

  const unit = (android as { unit?: unknown }).unit
  return typeof unit === 'string' ? unit : null
}

const toAndroidResourceName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()
  return cleaned.startsWith('_') ? cleaned.slice(1) : cleaned
}

const rgbaToHex = (rgba: Rgba): string => {
  const toHex = (value: number): string => {
    const rounded = Math.round(clamp01(value) * 255)
    return rounded.toString(16).padStart(2, '0')
  }

  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}${toHex(rgba.a)}`
}

const formatFlatYaml = (tokens: ResolvedTokens): string => {
  const flatTokens: Record<string, unknown> = {}

  for (const [name, token] of Object.entries(tokens) as [string, ResolvedToken][]) {
    flatTokens[name] = {
      value: token.$value,
      type: token.$type,
    }
  }

  return yaml.stringify(flatTokens, {
    indent: 2,
    lineWidth: 0,
  })
}

const formatNestedYaml = (tokens: ResolvedTokens): string => {
  const nestedTokens: Record<string, unknown> = {}

  for (const [_name, token] of Object.entries(tokens) as [string, ResolvedToken][]) {
    const parts = token.path
    let current = nestedTokens

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!part) {
        continue
      }

      const next = current[part]
      if (!next || typeof next !== 'object') {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }

    const lastPart = parts[parts.length - 1]
    if (!lastPart) {
      continue
    }
    current[lastPart] = {
      value: token.$value,
      type: token.$type,
    }
  }

  return yaml.stringify(nestedTokens, {
    indent: 2,
    lineWidth: 0,
  })
}

const buildSwiftFallback = (modifierInputs: ModifierInputs): string => {
  const suffix = Object.entries(modifierInputs)
    .map(([key, value]) => `${key}-${value}`)
    .join('-')
  return `swift/tokens${suffix ? `-${suffix}` : ''}.swift`
}

const resolveOutputFile = (
  outputFile: string | ((modifierInputs: ModifierInputs) => string) | undefined,
  modifierInputs: ModifierInputs,
  fallbackFile: string,
): string => {
  if (typeof outputFile === 'function') {
    return outputFile(modifierInputs)
  }

  const fileName = outputFile ?? fallbackFile
  return interpolateFileName(fileName, modifierInputs)
}

const interpolateFileName = (pattern: string, modifierInputs: ModifierInputs): string => {
  if (!/\{.+?\}/.test(pattern)) {
    return pattern
  }

  let result = pattern
  for (const [key, value] of Object.entries(modifierInputs) as [string, string][]) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}

// ============================================================================
// BUILD FUNCTION
// ============================================================================

async function build() {
  console.log('🔨 Dispersa - Custom Plugins Example\n')
  console.log('This example demonstrates:')
  console.log('  • Custom Filter (color tokens only)')
  console.log('  • Custom Renderer (YAML output)')
  console.log('  • Custom Transform (uppercase names)\n')

  // Clear output directory
  await fs.emptyDir(outputDir)

  try {
    // Initialize Dispersa
    const dispersa = new Dispersa({
      resolver: path.join(__dirname, 'tokens.resolver.json'),
      buildPath: outputDir,
    })

    // Build with custom plugins
    console.log('🔌 Applying custom plugins...')

    const result = await dispersa.build({
      outputs: [
        {
          name: 'yaml-colors',
          // Use our custom YAML renderer
          renderer: yamlRenderer,
          file: 'tokens.yaml',
          options: { structure: 'flat' },
          // Use our custom filter (color tokens only)
          filters: [colorOnlyFilter],
          // Use our custom transform (uppercase names)
          transforms: [uppercaseNamesTransform],
        },
        {
          name: 'swiftui',
          renderer: swiftUiRenderer({
            moduleName: 'DesignTokens',
          }),
          file: (inputs: ModifierInputs) => {
            const suffix = Object.entries(inputs)
              .map(([key, value]) => `${key}-${value}`)
              .join('-')
            return `swift/tokens${suffix ? `-${suffix}` : ''}.swift`
          },
        },
        {
          name: 'android-xml',
          renderer: androidXmlRenderer(),
          file: 'android',
        },
      ],
    })

    if (!result.success) {
      console.error('\n❌ Build failed with errors:')
      for (const error of result.errors || []) {
        console.error(`   ${error.message}`)
        if (error.path) {
          console.error(`   at ${error.path}`)
        }
      }
      process.exit(1)
    }

    console.log(`\n✅ Build completed successfully!`)
    console.log(`   Generated ${result.outputs.length} file(s)\n`)

    // Print summary
    console.log('📄 Generated files:')
    for (const output of result.outputs) {
      console.log(`   - ${output.path}`)
    }

    console.log('\n💡 Usage:')
    console.log('   View the generated YAML file:')
    console.log('   cat output/tokens.yaml\n')
    console.log('   Modify the plugins in build.ts to customize behavior!')
    console.log('   • Change structure: "flat" or "nested"')
    console.log('   • Modify the filter to include different token types')
    console.log('   • Change the transform to use different naming conventions\n')
  } catch (error) {
    console.error('\n❌ Build failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run the build
build()
