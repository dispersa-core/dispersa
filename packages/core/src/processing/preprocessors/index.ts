/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * @fileoverview Preprocessors - Subpath export for dispersa/preprocessors
 *
 * This is the public entry point when importing from 'dispersa/preprocessors'.
 *
 * @example
 * ```typescript
 * import { type Preprocessor } from 'dispersa/preprocessors'
 *
 * const myPreprocessor: Preprocessor = {
 *   name: 'myPreprocessor',
 *   preprocess: async (tokens) => { ... },
 * }
 * ```
 */

// ============================================================================
// PREPROCESSOR TYPE
// ============================================================================

export type { Preprocessor } from './types'

// ============================================================================
// BUILT-IN PREPROCESSORS
// ============================================================================

// No built-in preprocessors currently - users can create custom ones inline.
// Runtime marker to prevent an empty chunk warning during build.
export const preprocessors = [] as const
