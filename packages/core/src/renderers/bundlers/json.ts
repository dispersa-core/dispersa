/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @fileoverview JSON bundler for multi-theme output
 */

import type { ResolverDocument } from '@resolution/types'
import { ConfigurationError } from '@shared/errors/index'
import type { ResolvedTokens } from '@tokens/types'

import type { BundleDataItem } from './types'
import {
  buildMetadata,
  buildStablePermutationKey,
  normalizeModifierInputs,
  stripInternalMetadata,
} from './utils'

/**
 * Bundle tokens as JSON object with metadata for runtime lookup
 *
 * JSON-specific strategy: All combinations for dynamic theming
 * - Includes metadata with dimensions and defaults
 * - All permutations included (no filtering)
 * - Predictable keys for O(1) lookup
 */
export async function bundleAsJson(
  bundleData: BundleDataItem[],
  resolver: ResolverDocument,
  formatTokens?: (tokens: ResolvedTokens) => Promise<string>,
): Promise<string> {
  if (!formatTokens) {
    throw new ConfigurationError('JSON formatter was not provided')
  }

  const metadata = buildMetadata(resolver)
  const tokens: Record<string, unknown> = {}

  for (const { tokens: tokenSet, modifierInputs } of bundleData) {
    const cleanTokens = stripInternalMetadata(tokenSet)
    const normalizedInputs = normalizeModifierInputs(modifierInputs)
    const key = buildStablePermutationKey(normalizedInputs, metadata.dimensions)
    const themeJson = await formatTokens(cleanTokens)
    tokens[key] = JSON.parse(themeJson) as unknown
  }

  const bundle = { _meta: metadata, tokens }
  return JSON.stringify(bundle, null, 2)
}
