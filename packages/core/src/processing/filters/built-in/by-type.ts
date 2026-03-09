/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

import type { TokenType } from '@shared/token-types'

import type { Filter } from '../types'

export function byType(type: TokenType): Filter {
  return {
    filter: (token) => token.$type === type,
  }
}
