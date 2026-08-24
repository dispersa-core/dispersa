/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @fileoverview Shared lint issue type
 *
 * Foundational type shared between the lint module and the error hierarchy
 * so the shape is defined once instead of being duplicated inline.
 */

/**
 * A single lint issue
 */
export type LintIssue = {
  /** Fully qualified rule ID (e.g., 'dispersa/require-description') */
  ruleId: string

  /** Issue severity */
  severity: 'error' | 'warn'

  /** Human-readable message */
  message: string

  /** Token name (e.g., 'color.brand.primary') */
  tokenName: string

  /** Token path segments (e.g., ['color', 'brand', 'primary']) */
  tokenPath: string[]
}
