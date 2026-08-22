/**
 * @license
 * Copyright (c) 2025 Dispersa Contributors
 * SPDX-License-Identifier: MIT
 */

import type { Filter } from '../types'

export function byPath(pattern: RegExp | string): Filter {
  if (typeof pattern === 'string') {
    const segments = pattern.split('.')
    return {
      filter: (token) =>
        segments.length <= token.path.length &&
        segments.every((segment, i) => token.path[i] === segment),
    }
  }

  return {
    filter: (token) => pattern.test(token.path.join('.')),
  }
}
