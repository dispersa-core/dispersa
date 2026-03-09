/**
 * @fileoverview Types for JS module bundler
 */

import type { ResolvedTokens } from '@shared/token-types'

export type BundleDataItem = {
  tokens: ResolvedTokens
  modifierInputs: Record<string, string>
  isBase: boolean
}

export type BundleMetadata = {
  dimensions: string[]
  defaults: Record<string, string>
}
