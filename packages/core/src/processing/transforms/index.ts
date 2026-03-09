/**
 * @fileoverview Transforms - Subpath export for dispersa/transforms
 *
 * This is the public entry point when importing from 'dispersa/transforms'.
 *
 * @example
 * ```typescript
 * import { colorToHex, dimensionToPx, nameKebabCase } from 'dispersa/transforms'
 *
 * css({
 *   name: 'tokens',
 *   transforms: [colorToHex(), dimensionToPx(), nameKebabCase()],
 * })
 * ```
 */

export type { Transform } from './types'

// Built-in transforms
export {
  colorToColorFunction,
  colorToHex,
  colorToHsl,
  colorToHwb,
  colorToLab,
  colorToLch,
  colorToOklab,
  colorToOklch,
  colorToRgb,
  dimensionToPx,
  dimensionToRem,
  dimensionToUnitless,
  durationToMs,
  durationToSeconds,
  fontWeightToNumber,
  nameCamelCase,
  nameConstantCase,
  nameKebabCase,
  namePascalCase,
  namePrefix,
  nameSnakeCase,
  nameSuffix,
} from './built-in/index'
