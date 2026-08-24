/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview Build orchestration types
 *
 * Contains types for build configuration, permutation handling, and
 * build-time options. These types define how to drive the build process.
 */

import type { TypeGeneratorOptions } from '@codegen/type-generator'
import type { LintBuildConfig } from '@lint/types'
import type { Filter } from '@processing/filters/types'
import type { Preprocessor } from '@processing/preprocessors/types'
import type { Transform } from '@processing/transforms/types'
import type { LifecycleHooks, OutputConfig } from '@outputs/types'
import type { ModifierInputs, ResolverDocument } from '@resolution/types'
import type { ValidationOptions } from '@shared/types/validation'
import type { BuildConfigBase, DispersaOptionsBase } from '@validation/config-schemas'

/**
 * Complete build configuration for Dispersa
 *
 * Defines all aspects of the token build process including input sources,
 * output targets, transforms, and permutation handling.
 *
 * **Complete Token Processing Pipeline:**
 *
 * 1. **Preprocessors** (BuildConfig.preprocessors)
 *    - Operate on raw JSON before parsing
 *    - Transform raw data structures
 *    - Example: strip custom metadata, inject env vars
 *
 * 2. **Parse & Resolve**
 *    - Parse token files according to DTCG spec
 *    - Resolve references between tokens
 *    - Apply modifiers (themes, modes, etc.)
 *    - Output: ResolvedTokens
 *
 * 3. **Global Filters** (BuildConfig.filters)
 *    - Applied to all tokens for all outputs
 *    - Example: exclude deprecated tokens globally
 *
 * 4. **Global Transforms** (BuildConfig.transforms)
 *    - Applied to all tokens for all outputs
 *    - Example: global naming conventions
 *
 * 5. **Per-Output Processing** (for each OutputConfig):
 *    a. **Output Filters** - Select which tokens to include (AND logic)
 *    b. **Output Transforms** - Modify selected tokens only
 *    c. **Renderer** - Generate output format and bundle output
 *
 * All transforms and filters are applied in array order.
 *
 * @example Basic usage with global filters and transforms
 * ```typescript
 * import { build, css, json } from 'dispersa'
 * import { byType } from 'dispersa/filters'
 * import { colorToHex, nameKebabCase } from 'dispersa/transforms'
 *
 * await build({
 *   outputs: [
 *     css({ name: 'css', preset: 'bundle', selector: ':root' }),
 *     json({ name: 'json', preset: 'standalone', structure: 'flat' }),
 *   ],
 *   filters: [byType('color')], // Global filter - only include color tokens for all outputs
 *   transforms: [nameKebabCase(), colorToHex()], // Global transforms for all outputs
 * })
 * ```
 *
 * @example Combining global and output-specific filters
 * ```typescript
 * import { css, json } from 'dispersa'
 * import { byType } from 'dispersa/filters'
 * import { nameKebabCase } from 'dispersa/transforms'
 *
 * await build({
 *   outputs: [
 *     css({
 *       name: 'css',
 *       preset: 'bundle',
 *       selector: ':root',
 *     }),
 *     json({
 *       name: 'json',
 *       preset: 'standalone',
 *       structure: 'flat',
 *     }),
 *   ],
 *   filters: [byType('color')],
 *   transforms: [nameKebabCase()],
 * })
 * ```
 */
export type BuildConfig = Omit<
  BuildConfigBase,
  'outputs' | 'filters' | 'transforms' | 'preprocessors' | 'permutations' | 'types'
> & {
  /** Resolver configuration - file path or inline ResolverDocument */
  resolver?: string | ResolverDocument

  /** Output directory for generated files */
  buildPath?: string

  /** Validation mode for token resolution */
  validation?: ValidationOptions

  /** Array of output configurations defining target formats */
  outputs: OutputConfig[]

  /** Global filters to apply to all outputs before output-specific filters */
  filters?: Filter[]

  /** Global transforms to apply to all tokens before output-specific transforms */
  transforms?: Transform[]

  /** Global preprocessors to apply to raw token data before parsing */
  preprocessors?: Preprocessor[]

  /** Explicit permutations to build (modifier inputs) */
  permutations?: ModifierInputs[]

  /** TypeScript definition generation for resolved tokens */
  types?: TypesOutputConfig

  /** Linting configuration */
  lint?: LintBuildConfig

  /** Global lifecycle hooks for the build process */
  hooks?: LifecycleHooks
}

/**
 * Generation of a TypeScript definition file from resolved tokens
 *
 * Emitted through its own transform-free resolution (mirroring
 * `resolveTokens()`), so global `transforms`/`filters` never leak into the
 * generated value shapes.
 *
 * @example
 * ```typescript
 * await build({
 *   resolver: './tokens.resolver.json',
 *   buildPath: './dist',
 *   outputs: [css({ name: 'css', file: 'tokens.css' })],
 *   types: {
 *     file: 'tokens.d.ts',
 *     exportType: 'interface',
 *     includeValues: true,
 *     moduleName: 'DesignTokens',
 *   },
 * })
 * ```
 */
export type TypesOutputConfig = TypeGeneratorOptions & {
  /** Output file path for the generated `.d.ts` (relative to `buildPath` when given) */
  file: string

  /**
   * Modifier inputs selecting the permutation to emit types for.
   * Defaults to the base permutation (all modifiers at their defaults).
   */
  modifierInputs?: ModifierInputs
}

export { LifecycleHooks } from '@outputs/types'

/**
 * Dispersa options with runtime-only validation helpers
 *
 * Schema validation supports "validation.mode" but cannot validate functions.
 */
export type DispersaOptions = Omit<DispersaOptionsBase, 'validation'> & {
  /** Resolver configuration - file path or inline ResolverDocument */
  resolver?: string | ResolverDocument

  /** Default output directory for generated files */
  buildPath?: string

  validation?: ValidationOptions
}
