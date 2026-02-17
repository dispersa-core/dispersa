/**
 * @fileoverview Built-in token filters
 *
 * Provides commonly used filters for token selection. These filters can be
 * used in output configurations to control which tokens are included in output.
 */

import { AliasResolver } from '@resolution/alias-resolver'
import type { TokenType } from '@tokens/types'

import type { Filter } from './types'

/**
 * Factory function to create a filter for a specific token type
 *
 * @param type - Token type to filter for
 * @returns Filter that includes only tokens of the specified type
 *
 * @example
 * ```typescript
 * import { byType } from 'dispersa/filters'
 *
 * css({
 *   name: 'shadows',
 *   file: 'shadows.css',
 *   preset: 'bundle',
 *   filters: [byType('shadow')],
 * })
 * ```
 */
export function byType(type: TokenType): Filter {
  return {
    filter: (token) => token.$type === type,
  }
}

/**
 * Factory function to create a filter based on path pattern
 *
 * @param pattern - Regular expression or string to match against token path
 * @returns Filter that includes only tokens matching the path pattern
 *
 * @example
 * ```typescript
 * import { byPath } from 'dispersa/filters'
 *
 * // Filter tokens in 'color.semantic' namespace
 * css({ filters: [byPath(/^color\.semantic/)] })
 *
 * // Filter tokens starting with 'spacing'
 * css({ filters: [byPath('spacing')] })
 * ```
 */
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

/**
 * Filter to include only alias tokens (tokens that reference other tokens)
 *
 * Useful for shipping only semantic/alias tokens to consumers while keeping
 * base/primitive tokens internal to the design system.
 *
 * @example
 * ```typescript
 * {
 *   name: 'web-semantic',
 *   renderer: cssRenderer(),
 *   options: { preset: 'bundle' },
 *   filters: [isAlias()], // Only tokens that were originally references
 *   transforms: [nameKebabCase()]
 * }
 * ```
 */
export function isAlias(): Filter {
  return {
    filter: (token) => AliasResolver.hasAliases(token.originalValue),
  }
}

/**
 * Filter to include only base tokens (tokens with direct values, not aliases)
 *
 * Useful for internal documentation or extracting only primitive/foundation tokens.
 *
 * @example
 * ```typescript
 * {
 *   name: 'design-primitives',
 *   renderer: jsonRenderer(),
 *   options: { preset: 'standalone' },
 *   filters: [isBase()], // Only tokens with direct values
 * }
 * ```
 */
export function isBase(): Filter {
  return {
    filter: (token) => !AliasResolver.hasAliases(token.originalValue),
  }
}
