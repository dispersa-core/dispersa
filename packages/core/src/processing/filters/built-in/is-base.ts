/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

import { AliasResolver } from '@resolution/alias-resolver'

import type { Filter } from '../types'

export function isBase(): Filter {
  return {
    filter: (token) => !AliasResolver.hasAliases(token.originalValue),
  }
}
