/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

import type { Filter } from '../types'

export function byPath(pattern: RegExp | string): Filter {
  if (typeof pattern === 'string') {
    return {
      filter: (token) => token.path.join('.').startsWith(pattern),
    }
  }

  return {
    filter: (token) => pattern.test(token.path.join('.')),
  }
}
