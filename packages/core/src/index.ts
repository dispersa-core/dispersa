/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview Dispersa - DTCG Design Token Processor
 * Main public API exports
 */

// ============================================================================
// PRIMARY API
// ============================================================================

export {
  build,
  buildOrThrow,
  buildPermutation,
  resolveTokens,
  lint,
  resolveAllPermutations,
  generateTypes,
} from './dispersa'

export type { LintOptions } from './dispersa'

// ============================================================================
// PUBLIC TYPES
// ============================================================================

// Config types
export type { OutputConfig, FileFunction, LifecycleHooks } from '@outputs/types'
export type { BuildConfig, DispersaOptions } from '@engine/types'

// Validation types
export type { ValidationMode, ValidationOptions } from '@shared/types/validation'

// Token types
export type {
  ResolvedToken,
  ResolvedTokens,
  DesignTokenValue,
  TokenValue,
  TokenValueReference,
  TokenType,
  ColorToken,
  DimensionToken,
  ShadowToken,
  DurationToken,
  TypographyToken,
  BorderToken,
  TransitionToken,
  GradientToken,
  ColorValueObject,
  ColorValue,
  ColorSpace,
  ColorComponent,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  CubicBezierValue,
  ShadowValueObject,
  TypographyValue,
  BorderValue,
  StrokeStyleValue,
  StrokeStyleValueObject,
  TransitionValue,
  GradientValue,
  GradientStop,
} from '@shared/token-types'

// Token type guards
export {
  isColorToken,
  isDimensionToken,
  isShadowToken,
  isTypographyToken,
  isBorderToken,
  isDurationToken,
  isTransitionToken,
  isGradientToken,
} from '@shared/token-types'

// Transform types
export type { Transform } from '@processing/transforms/types'

// Filter types
export type { Filter } from '@processing/filters/types'

// Preprocessor types
export type { Preprocessor } from '@processing/preprocessors/types'

// Renderer types
export type {
  AndroidRendererOptions,
  BuildError,
  BuildOutput,
  BuildResult,
  CssRendererOptions,
  ErrorCode,
  FormatOptions,
  IosRendererOptions,
  JsModuleRendererOptions,
  JsonRendererOptions,
  MediaQueryFunction,
  OutputTree,
  PermutationData,
  Renderer,
  RenderContext,
  RenderMeta,
  RenderOutput,
  SelectorFunction,
  TailwindRendererOptions,
} from '@outputs/types'

// Resolver types
export type { ModifierInputs, ResolverDocument } from '@resolution/types'

// ============================================================================
// OUTPUT BUILDERS
// ============================================================================

export { css, json, js, tailwind, ios, android } from '@outputs'
export type {
  AndroidBuilderConfig,
  CssBuilderConfig,
  IosBuilderConfig,
  JsBuilderConfig,
  JsonBuilderConfig,
  TailwindBuilderConfig,
} from '@outputs'

// ============================================================================
// CUSTOM RENDERER HELPERS
// ============================================================================

export { defineRenderer, outputTree, isOutputTree } from '@outputs'

// ============================================================================
// ERROR CLASSES
// ============================================================================

export {
  DispersaError,
  TokenReferenceError,
  CircularReferenceError,
  ValidationError,
  FileOperationError,
  ConfigurationError,
  BasePermutationError,
  ModifierError,
  LintError,
} from '@shared/errors/index'
