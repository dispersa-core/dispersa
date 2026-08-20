/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview Token types - shared data model for design tokens
 *
 * Base token types are defined manually to match DTCG 2025.10.
 * This keeps TypeScript types stable while runtime validation relies on
 * the vendored DTCG JSON Schemas.
 *
 * These types are used across all modules (engine, resolution, processing, outputs)
 * as the universal data model for design tokens.
 *
 * For token parsing and group extension resolution, import from:
 * - `TokenParser` from `@engine/token-parser`
 * - `GroupExtensionResolver` from `@engine/group-extension-resolver`
 */

export type {
  BorderToken,
  BorderValue,
  ColorComponent,
  ColorSpace,
  ColorToken,
  ColorValue,
  ColorValueObject,
  CubicBezierValue,
  DesignTokenValue,
  DimensionToken,
  DimensionValue,
  DurationToken,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  GradientStop,
  GradientToken,
  GradientValue,
  InternalResolvedToken,
  InternalResolvedTokens,
  InternalToken,
  InternalTokenDocument,
  InternalTokenNode,
  JsonPointerReferenceObject,
  ResolvedToken,
  ResolvedTokens,
  ShadowToken,
  ShadowValue,
  ShadowValueObject,
  StrokeStyleToken,
  StrokeStyleValue,
  StrokeStyleValueObject,
  Token,
  TokenCollection,
  TokenGroup,
  TokenNode,
  TokenType,
  TokenValue,
  TokenValueReference,
  TransitionToken,
  TransitionValue,
  TypographyToken,
  TypographyValue,
  UnresolvedBorderToken,
  UnresolvedGradientToken,
  UnresolvedStrokeStyleToken,
  UnresolvedTransitionToken,
  UnresolvedTypographyToken,
} from './types'

export {
  isBorderToken,
  isColorToken,
  isDimensionToken,
  isDurationToken,
  isGradientToken,
  isShadowToken,
  isStrokeStyleToken,
  isTransitionToken,
  isTypographyToken,
} from './types'
