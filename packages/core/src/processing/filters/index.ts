/**
 * @fileoverview Token filters - Subpath export for dispersa/filters
 *
 * This is the public entry point when importing from 'dispersa/filters'.
 *
 * @example
 * ```typescript
 * import { byType, byPath, isAlias, isBase } from 'dispersa/filters'
 *
 * css({
 *   name: 'colors',
 *   filters: [byType('color')],
 * })
 * ```
 */

export type { Filter } from './types'
export { isAlias, isBase, byType, byPath } from './built-in'
