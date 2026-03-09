/**
 * @fileoverview Types for bundlers/presets
 */

import type { ResolvedTokens } from '@shared/token-types'

export type BundleDataItem = {
  tokens: ResolvedTokens
  modifierInputs: Record<string, string>
  isBase: boolean
}
