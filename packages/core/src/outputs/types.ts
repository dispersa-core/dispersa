/**
 * @fileoverview Renderer system types for token output generation
 *
 * Note: outputs/types has types for both renderers (Renderer, RenderContext)
 * and output configuration (OutputConfig, LifecycleHooks). This works because
 * they're all related to the output phase of token processing.
 */

import type { LintResult } from '@lint/types'
import type { Filter } from '@processing/filters/types'
import type { ModifierInputs, ResolverDocument } from '@resolution/types'
import type { ResolvedTokens } from '@shared/token-types'
import type { Transform } from '@processing/transforms/types'

/**
 * Generic options object for renderers
 *
 * Each renderer can define its own specific options that extend this base type.
 */
export type FormatOptions = Record<string, unknown>

/**
 * Data for a single permutation (combination of modifier values)
 */
export type PermutationData = {
  tokens: ResolvedTokens
  modifierInputs: ModifierInputs
}

/**
 * Metadata for renderers to reason about modifier dimensions.
 */
export type RenderMeta = {
  dimensions: string[]
  defaults: Record<string, string>
  basePermutation: ModifierInputs
}

/**
 * Context provided to renderer formatters.
 */
export type RenderContext<TOptions extends FormatOptions = FormatOptions> = {
  permutations: PermutationData[]
  output: OutputConfig<TOptions>
  resolver: ResolverDocument
  meta: RenderMeta
  buildPath?: string
}

/**
 * Multi-file output representation for renderers.
 */
export type OutputTree = {
  kind: 'outputTree'
  files: Record<string, string>
}

export type RenderOutput = string | OutputTree

/**
 * Output from a build operation
 */
export type BuildOutput = {
  name: string
  /** File path where output was written (undefined for in-memory mode) */
  path?: string
  content: string
}

/**
 * Renderer definition for converting tokens to output format
 *
 * Renderers implement a single `format()` method that can return either
 * a single string or an OutputTree for multi-file outputs.
 *
 * @example Simple renderer with format()
 * ```typescript
 * const scssRenderer: Renderer = {
 *   format: (context) => {
 *     const tokens = context.permutations[0]?.tokens ?? {}
 *     return Object.entries(tokens)
 *       .map(([name, token]) => `$${name}: ${token.$value};`)
 *       .join('\n')
 *   },
 * }
 * ```
 */
export type Renderer<TOptions extends FormatOptions = FormatOptions> = {
  /**
   * Preset identifier (e.g., 'bundle', 'standalone', 'modifier')
   * Indicates which variant of the renderer this is
   */
  preset?: string

  /**
   * Convert tokens to output content.
   *
   * Renderers receive all resolved permutations and modifier metadata via context.
   * They can return either a single string (single output file) or an OutputTree
   * for multi-file outputs.
   */
  format: (
    context: RenderContext<TOptions>,
    options?: TOptions,
  ) => RenderOutput | Promise<RenderOutput>
}

/**
 * Helper for defining custom renderers with full type inference.
 *
 * Works like Vue's `defineComponent()` or Vite's `defineConfig()` --
 * an identity function that enables TypeScript to infer the options type
 * from the generic parameter, giving you autocomplete and type-checking
 * on both `context` and `options` inside `format()`.
 *
 * @example
 * ```typescript
 * import { defineRenderer } from 'dispersa/outputs'
 *
 * type MyOptions = { prefix: string; minify?: boolean }
 *
 * const myRenderer = defineRenderer<MyOptions>({
 *   format(context, options) {
 *     // options is typed as MyOptions | undefined
 *     // context.output.options is typed as MyOptions | undefined
 *     const prefix = options?.prefix ?? 'token'
 *     return Object.entries(context.permutations[0]?.tokens ?? {})
 *       .map(([name, token]) => `${prefix}-${name}: ${token.$value}`)
 *       .join('\n')
 *   },
 * })
 * ```
 */
export function defineRenderer<T extends FormatOptions>(renderer: Renderer<T>): Renderer<T> {
  return renderer
}

/**
 * Function type for dynamically generating CSS selectors based on modifier context
 *
 * @param modifierName - Name of the modifier (e.g., 'theme', 'breakpoint')
 * @param context - Context value of the modifier (e.g., 'dark', 'mobile')
 * @param isBase - Whether this is the base permutation
 * @param allModifierInputs - All modifier inputs for this permutation
 * @returns CSS selector string (e.g., '[data-theme="dark"]')
 */
export type SelectorFunction = (
  modifierName: string,
  context: string,
  isBase: boolean,
  allModifierInputs: Record<string, string>,
) => string

/**
 * Function type for dynamically generating media queries based on modifier context
 *
 * @param modifierName - Name of the modifier (e.g., 'theme', 'breakpoint')
 * @param context - Context value of the modifier (e.g., 'dark', 'mobile')
 * @param isBase - Whether this is the base permutation
 * @param allModifierInputs - All modifier inputs for this permutation
 * @returns Media query string (e.g., '(max-width: 768px)') or empty string for no media query
 */
export type MediaQueryFunction = (
  modifierName: string,
  context: string,
  isBase: boolean,
  allModifierInputs: Record<string, string>,
) => string

/**
 * Options for CSS custom properties renderer
 *
 * Controls how tokens are converted to CSS custom properties (CSS variables).
 *
 * **Note:** Token naming is controlled through transforms, not renderer options.
 * Use `nameKebabCase()` and `namePrefix()` for naming control.
 *
 * @example String-based selectors
 * ```typescript
 * css({
 *   name: 'tokens',
 *   file: 'tokens.css',
 *   transforms: [nameKebabCase(), namePrefix('ds-')],
 *   preset: 'bundle',
 *   selector: ':root',
 * })
 * ```
 *
 * @example Function-based selectors
 * ```typescript
 * outputs: [{
 *   renderer: cssRenderer(),
 *   options: {
 *     preset: 'bundle',
 *     selector: (modifier, context, isBase, allInputs) => {
 *       if (isBase) return ':root'
 *       return `[data-${modifier}="${context}"]`
 *     },
 *     mediaQuery: (modifier, context) => {
 *       if (modifier === 'breakpoint' && context === 'mobile') {
 *         return '(max-width: 768px)'
 *       }
 *       return ''
 *     }
 *   }
 * }]
 * ```
 */
export type CssRendererOptions = {
  preset?: 'bundle' | 'standalone' | 'modifier'
  selector?: string | SelectorFunction
  mediaQuery?: string | MediaQueryFunction
  minify?: boolean
  preserveReferences?: boolean
}

/**
 * Options for JSON renderer
 *
 * Controls the structure and formatting of JSON token output.
 *
 * @example
 * ```typescript
 * {
 *   structure: 'flat',
 *   minify: true,
 *   includeMetadata: true
 * }
 * ```
 */
export type { JsonRendererOptions } from '@validation/config-schemas'

/**
 * Options for JavaScript module renderer
 *
 * Generates JavaScript modules for direct import in applications.
 * Aligned with JSON renderer options for consistency.
 *
 * @example
 * ```typescript
 * {
 *   structure: 'nested',
 *   minify: false,
 *   moduleName: 'designTokens'
 * }
 * ```
 */
export type { JsModuleRendererOptions } from '@validation/config-schemas'

/**
 * Options for Tailwind CSS v4 renderer
 *
 * Generates CSS with @theme blocks for Tailwind v4+ design token integration.
 */
export type { TailwindRendererOptions } from './tailwind/renderer'

/**
 * Options for iOS/SwiftUI renderer
 *
 * Generates Swift code targeting SwiftUI (iOS 17+, Swift 6).
 */
export type { IosRendererOptions } from './ios/renderer'

/**
 * Options for Android/Jetpack Compose renderer
 *
 * Generates Kotlin code targeting Jetpack Compose with Material 3.
 *
 * @experimental This type is experimental. Properties and behavior may change.
 */
export type { AndroidRendererOptions } from './android/renderer'

/**
 * Result of a token build operation
 *
 * Contains success status, generated output files, and any errors encountered.
 *
 * @example
 * ```typescript
 * const result = await build(config)
 * if (result.success) {
 *   result.outputs.forEach(output => {
 *     console.log(`Generated ${output.name}: ${output.path}`)
 *   })
 * } else {
 *   console.error('Build errors:', result.errors)
 * }
 * ```
 */
/**
 * Error code identifying the type of build error
 */
export type ErrorCode =
  | 'TOKEN_REFERENCE'
  | 'CIRCULAR_REFERENCE'
  | 'VALIDATION'
  | 'FILE_OPERATION'
  | 'CONFIGURATION'
  | 'BASE_PERMUTATION'
  | 'MODIFIER'
  | 'LINT'
  | 'UNKNOWN'

/**
 * Structured error from a build operation
 *
 * Preserves typed context from the error hierarchy so consumers
 * can programmatically react to specific failure modes.
 */
export type BuildError = {
  /** Human-readable error message */
  message: string

  /** Machine-readable error code identifying the failure type */
  code: ErrorCode

  /** File path where the error occurred (for file operation errors) */
  path?: string

  /** Token path where the error occurred (e.g. 'color.primary') */
  tokenPath?: string

  /** Error severity */
  severity: 'error' | 'warning'

  /** Suggested alternatives (e.g. similar token names for TOKEN_REFERENCE errors) */
  suggestions?: string[]

  /** Detailed lint issues for LINT errors */
  lintIssues?: Array<{
    ruleId: string
    severity: 'error' | 'warn'
    message: string
    tokenName: string
    tokenPath: string[]
  }>
}

export type BuildResult = {
  /** Whether the build completed successfully */
  success: boolean

  /** Array of generated output files */
  outputs: BuildOutput[]

  /** Array of errors encountered during build (only present if success is false) */
  errors?: BuildError[]

  /** Lint results, present whenever `config.lint.enabled` is true */
  lintResult?: LintResult
}

// ============================================================================
// OUTPUT CONFIG TYPES
// ============================================================================

/**
 * Lifecycle hooks for the build process.
 *
 * The same hook type is used on both global build config (BuildConfig.hooks) and
 * per-output config (OutputConfig.hooks). All hooks are optional and support
 * both sync and async functions.
 *
 * **Execution order:**
 * 1. Global `onBuildStart`
 * 2. For each output: per-output `onBuildStart` → process → per-output `onBuildEnd`
 * 3. Global `onBuildEnd`
 */
export type LifecycleHooks = {
  /** Called before permutation resolution and output processing begins */
  onBuildStart?: (context: {
    config: unknown
    resolver: string | ResolverDocument
  }) => void | Promise<void>

  /** Called after all outputs have been processed (success or failure) */
  onBuildEnd?: (result: BuildResult) => void | Promise<void>
}

/**
 * Function that generates an output file path based on modifier inputs.
 *
 * Used as the `file` property on OutputConfig and builder configs when
 * the file name needs to vary per permutation.
 */
export type FileFunction = (modifierInputs: ModifierInputs) => string

/**
 * Output configuration for a single build target
 *
 * Defines how tokens should be formatted and output for a specific target
 * format (CSS, JSON, JavaScript, etc.).
 *
 * **Processing Order:**
 * - Global filters (from BuildConfig) are applied first to all outputs
 * - Then output-specific filters are applied (AND logic with global filters)
 * - Global transforms are applied next
 * - Finally output-specific transforms are applied
 *
 * **Output File Names:**
 * The `file` field supports subdirectories and dynamic naming patterns.
 * Parent directories are created automatically.
 *
 * @example Using builder helpers (recommended)
 * ```typescript
 * import { css, json } from 'dispersa'
 * import { colorToHex, dimensionToPx } from 'dispersa/transforms'
 *
 * // CSS output with transforms
 * css({
 *   name: 'css',
 *   file: 'css/tokens.css',
 *   preset: 'bundle',
 *   selector: ':root',
 *   transforms: [colorToHex(), dimensionToPx()],
 * })
 *
 * // JSON output with static filename
 * json({
 *   name: 'json',
 *   file: 'json/tokens.json',
 *   preset: 'standalone',
 *   structure: 'flat',
 * })
 * ```
 *
 * @example Pattern-based and function-based filenames
 * ```typescript
 * import { css } from 'dispersa'
 *
 * // Standalone mode with pattern-based filename
 * css({
 *   name: 'css-standalone',
 *   file: 'tokens-{theme}-{platform}.css', // → tokens-light-web.css, tokens-dark-mobile.css
 *   preset: 'standalone',
 *   selector: ':root',
 * })
 *
 * // Function-based filename
 * css({
 *   name: 'css-custom',
 *   preset: 'standalone',
 *   selector: ':root',
 *   file: (modifierInputs) => {
 *     const parts = Object.entries(modifierInputs).map(([k, v]) => `${k}-${v}`)
 *     return `tokens-${parts.join('-')}.css`
 *   },
 * })
 * ```
 *
 * @see CssRendererOptions
 * @see JsonRendererOptions
 * @see JsModuleRendererOptions
 */
export type OutputConfig<TOptions extends FormatOptions = FormatOptions> = {
  /** Unique identifier for this output */
  name: string

  /** Renderer instance (created via renderer factory function) */
  renderer: Renderer<TOptions>

  /**
   * Array of filter objects to apply
   * Filters are applied before transforms (to select which tokens to process)
   */
  filters?: Filter[]

  /** Array of transform objects to apply */
  transforms?: Transform[]

  /**
   * Output file path, can be static or dynamic
   *
   * Supports subdirectories (e.g., "css/tokens.css").
   * In standalone preset (one file per permutation), supports:
   * - Pattern strings with placeholders: `tokens-{theme}-{platform}.css`
   * - Function that receives modifierInputs: `(modifierInputs) => \`tokens-${...}.css\``
   * - Plain string (applies default pattern with all modifiers)
   *
   * @example
   * ```typescript
   * // Static filename (bundle preset or single permutation)
   * file: 'tokens.css'
   *
   * // With subdirectory
   * file: 'css/tokens.css'
   *
   * // Pattern with placeholders (standalone preset)
   * file: 'tokens-{theme}-{platform}.css'
   *
   * // Function for complex logic (standalone preset)
   * file: (modifierInputs) => {
   *   const parts = Object.entries(modifierInputs).map(([k, v]) => `${k}-${v}`)
   *   return `output/${parts.join('-')}/tokens.css`
   * }
   * ```
   */
  file?: string | FileFunction

  /**
   * Renderer-specific options passed to the formatter.
   */
  options?: TOptions

  /**
   * Lifecycle hooks for this output.
   *
   * Per-output hooks fire in addition to global hooks on BuildConfig.
   * `onBuildStart` fires before this output is processed,
   * `onBuildEnd` fires after this output finishes (success or failure).
   */
  hooks?: LifecycleHooks
}
