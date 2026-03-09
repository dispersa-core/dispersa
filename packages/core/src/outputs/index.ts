/**
 * @fileoverview Outputs - Subpath export for dispersa/outputs
 *
 * This is the public entry point when importing from 'dispersa/outputs'.
 *
 * Provides renderer types for implementing custom renderers,
 * plus the outputTree helper for multi-file output.
 */

export { cssRenderer } from './css'
export { jsRenderer } from './js'
export { jsonRenderer } from './json'
export { tailwindRenderer } from './tailwind'
export { iosRenderer } from './ios'
export { androidRenderer } from './android'
export { outputTree, isOutputTree } from './output-tree'
export { defineRenderer } from './types'

export { css, json, js, tailwind, ios, android } from './builders'

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
} from './types'

export type {
  CssBuilderConfig,
  JsonBuilderConfig,
  JsBuilderConfig,
  TailwindBuilderConfig,
  IosBuilderConfig,
  AndroidBuilderConfig,
} from './builders'
