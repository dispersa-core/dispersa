/**
 * @fileoverview Types for bundlers
 */

import type { ResolvedTokens } from '@tokens/types'

export type BundleDataItem = {
  tokens: ResolvedTokens
  modifierInputs: Record<string, string>
  isBase: boolean
}
