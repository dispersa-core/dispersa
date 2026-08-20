/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest'

import {
  buildCompositeName,
  buildCompositeWholeValue,
  buildGradientWholeValue,
  collectCompositeLeaves,
  formatGradientPosition,
  formatGradientValue,
  formatLeafValue,
  getShadowLayers,
  isCompositeToken,
} from '@outputs/composite-value'
import type { ResolvedToken } from '@shared/token-types'

function makeToken(name: string, value: unknown, tokenType: string): ResolvedToken {
  return {
    $value: value,
    $type: tokenType as ResolvedToken['$type'],
    name,
    path: name.split('.'),
    originalValue: value,
  }
}

describe('getShadowLayers', () => {
  it('should pass arrays through (including empty arrays)', () => {
    const layers = [{ color: 'red' }, { color: 'blue' }]
    expect(getShadowLayers(layers)).toBe(layers)
    expect(getShadowLayers([])).toEqual([])
  })

  it('should wrap a single object in an array', () => {
    const shadow = { color: 'red' }
    expect(getShadowLayers(shadow)).toEqual([shadow])
  })

  it('should return an empty array for non-object values', () => {
    expect(getShadowLayers(null)).toEqual([])
    expect(getShadowLayers('shadow')).toEqual([])
    expect(getShadowLayers(42)).toEqual([])
    expect(getShadowLayers(undefined)).toEqual([])
  })
})

describe('isCompositeToken', () => {
  const compositeTypes = [
    'shadow',
    'typography',
    'border',
    'strokeStyle',
    'transition',
    'gradient',
  ] as const

  it('should return true for object-valued composite tokens', () => {
    for (const tokenType of compositeTypes) {
      const token = makeToken(`tokens.${tokenType}`, { color: 'red' }, tokenType)
      expect(isCompositeToken(token)).toBe(true)
    }
  })

  it('should return true for array-valued shadows (multi-layer)', () => {
    expect(isCompositeToken(makeToken('tokens.shadow', [{ color: 'red' }], 'shadow'))).toBe(true)
  })

  it('should return false for non-composite types', () => {
    expect(
      isCompositeToken(
        makeToken('tokens.color', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      ),
    ).toBe(false)
    expect(
      isCompositeToken(makeToken('tokens.dimension', { value: 4, unit: 'px' }, 'dimension')),
    ).toBe(false)
  })

  it('should return false for composite-typed tokens with primitive values (e.g. unresolved alias)', () => {
    expect(isCompositeToken(makeToken('tokens.shadow', '{shadow.other}', 'shadow'))).toBe(false)
    expect(isCompositeToken(makeToken('tokens.border', '{border.other}', 'border'))).toBe(false)
  })
})

describe('collectCompositeLeaves', () => {
  it('should collect leaf paths for a shadow object', () => {
    const leaves = collectCompositeLeaves({
      color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      offsetX: { value: 1, unit: 'px' },
      offsetY: { value: 2, unit: 'px' },
      blur: { value: 3, unit: 'px' },
      spread: { value: 0, unit: 'px' },
    })

    expect(leaves.map((l) => l.path)).toEqual([
      ['color'],
      ['offsetX'],
      ['offsetY'],
      ['blur'],
      ['spread'],
    ])
  })

  it('should collect leaf paths for a multi-layer shadow array', () => {
    const leaves = collectCompositeLeaves([
      { color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 } },
      { color: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 } },
    ])

    expect(leaves.map((l) => l.path)).toEqual([
      ['0', 'color'],
      ['1', 'color'],
    ])
  })

  it('should expand nested arrays like fallback font families', () => {
    const leaves = collectCompositeLeaves({
      fontFamily: ['Inter', 'Helvetica Neue'],
      fontSize: { value: 16, unit: 'px' },
      fontWeight: 400,
      lineHeight: 1.5,
    })

    expect(leaves.map((l) => l.path)).toEqual([
      ['fontFamily', '0'],
      ['fontFamily', '1'],
      ['fontSize'],
      ['fontWeight'],
      ['lineHeight'],
    ])
    expect(leaves[0]!.value).toBe('Inter')
    expect(leaves[2]!.value).toEqual({ value: 16, unit: 'px' })
  })

  it('should handle empty object and empty array values', () => {
    expect(collectCompositeLeaves({})).toEqual([{ path: [], value: {} }])
    expect(collectCompositeLeaves([])).toEqual([{ path: [], value: [] }])
  })

  it('should normalize whitespace in path segments', () => {
    const leaves = collectCompositeLeaves({ 'font family': ['Inter'] })

    expect(leaves.map((l) => l.path)).toEqual([['font-family', '0']])
  })
})

describe('buildCompositeName', () => {
  it('should return the base name for an empty path', () => {
    expect(buildCompositeName('shadow.elevation.sm', [])).toBe('shadow.elevation.sm')
  })

  it('should join base and multi-segment paths with dashes', () => {
    expect(buildCompositeName('shadow.elevation.sm', ['color'])).toBe('shadow.elevation.sm-color')
    expect(buildCompositeName('shadow.elevation.xl', ['0', 'color'])).toBe(
      'shadow.elevation.xl-0-color',
    )
  })
})

describe('formatLeafValue', () => {
  it('should format color objects as hex', () => {
    expect(formatLeafValue({ colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 })).toBe('#ff0000')
  })

  it('should format dimension objects', () => {
    expect(formatLeafValue({ value: 16, unit: 'px' })).toBe('16px')
    expect(formatLeafValue({ value: 1, unit: 'rem' })).toBe('1rem')
  })

  it('should format duration objects', () => {
    expect(formatLeafValue({ value: 250, unit: 'ms' })).toBe('250ms')
    expect(formatLeafValue({ value: 1, unit: 's' })).toBe('1s')
  })

  it('should pass strings through', () => {
    expect(formatLeafValue('solid')).toBe('solid')
  })

  it('should stringify numbers and booleans', () => {
    expect(formatLeafValue(1.5)).toBe('1.5')
    expect(formatLeafValue(true)).toBe('true')
  })

  it('should JSON-stringify arrays and plain objects', () => {
    expect(formatLeafValue([1, 2, 3])).toBe('[1,2,3]')
    expect(formatLeafValue({ a: 1 })).toBe('{"a":1}')
  })

  it('should fall back to String() for null and undefined', () => {
    expect(formatLeafValue(null)).toBe('null')
    expect(formatLeafValue(undefined)).toBe('undefined')
  })
})

describe('buildCompositeWholeValue', () => {
  const shadowToken = makeToken(
    'shadow.elevation.sm',
    {
      color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      offsetX: { value: 1, unit: 'px' },
      offsetY: { value: 2, unit: 'px' },
      blur: { value: 3, unit: 'px' },
    },
    'shadow',
  )

  const borderToken = makeToken(
    'border.default',
    {
      color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 },
      width: { value: 1, unit: 'px' },
      style: 'solid',
    },
    'border',
  )

  const complexBorderToken = makeToken(
    'border.complex',
    {
      color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 },
      width: { value: 1, unit: 'px' },
      style: { dashArray: [{ value: 2, unit: 'px' }], lineCap: 'round' },
    },
    'border',
  )

  const transitionToken = makeToken(
    'transition.default',
    {
      duration: { value: 150, unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: [0.25, 0.1, 0.25, 1],
    },
    'transition',
  )

  it('should build shadow whole values with var() references when preserving references', () => {
    const format = vi.fn()
    const result = buildCompositeWholeValue(shadowToken, true, format)
    expect(result).toBe(
      'var(--shadow.elevation.sm-offsetX) var(--shadow.elevation.sm-offsetY) ' +
        'var(--shadow.elevation.sm-blur) var(--shadow.elevation.sm-color)',
    )
    expect(format).not.toHaveBeenCalled()
  })

  it('should use formatResolvedValue for shadows when references are not preserved', () => {
    const format = vi.fn().mockReturnValue('1px 2px 3px #ff0000')
    const result = buildCompositeWholeValue(shadowToken, false, format)
    expect(result).toBe('1px 2px 3px #ff0000')
    expect(format).toHaveBeenCalledTimes(1)
  })

  it('should build multi-layer shadow whole values with indexed var() references', () => {
    const multiLayerToken = makeToken(
      'shadow.elevation.xl',
      [
        {
          color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
          offsetX: { value: 1, unit: 'px' },
          offsetY: { value: 2, unit: 'px' },
          blur: { value: 3, unit: 'px' },
        },
        {
          color: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 },
          offsetX: { value: 4, unit: 'px' },
          offsetY: { value: 5, unit: 'px' },
          blur: { value: 6, unit: 'px' },
        },
      ],
      'shadow',
    )

    const format = vi.fn()
    const result = buildCompositeWholeValue(multiLayerToken, true, format)
    expect(result).toBe(
      'var(--shadow.elevation.xl-0-offsetX) var(--shadow.elevation.xl-0-offsetY) ' +
        'var(--shadow.elevation.xl-0-blur) var(--shadow.elevation.xl-0-color), ' +
        'var(--shadow.elevation.xl-1-offsetX) var(--shadow.elevation.xl-1-offsetY) ' +
        'var(--shadow.elevation.xl-1-blur) var(--shadow.elevation.xl-1-color)',
    )
    expect(format).not.toHaveBeenCalled()
  })

  it('should include inset and spread in shadow whole-value refs', () => {
    const insetToken = makeToken(
      'shadow.inset.sm',
      {
        color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 1 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: 2, unit: 'px' },
        inset: true,
      },
      'shadow',
    )

    const result = buildCompositeWholeValue(insetToken, true, vi.fn())
    expect(result).toBe(
      'inset var(--shadow.inset.sm-offsetX) var(--shadow.inset.sm-offsetY) ' +
        'var(--shadow.inset.sm-blur) var(--shadow.inset.sm-spread) var(--shadow.inset.sm-color)',
    )
  })

  it('should build border whole-value refs when style shorthand is representable', () => {
    expect(buildCompositeWholeValue(borderToken, true, vi.fn())).toBe(
      'var(--border.default-width) var(--border.default-style) var(--border.default-color)',
    )
  })

  it('should use formatResolvedValue for border when references are not preserved', () => {
    const format = vi.fn().mockReturnValue('1px solid #000000')
    expect(buildCompositeWholeValue(borderToken, false, format)).toBe('1px solid #000000')
    expect(format).toHaveBeenCalledTimes(1)
  })

  it('should return undefined for border tokens without shorthand style', () => {
    expect(buildCompositeWholeValue(complexBorderToken, true, vi.fn())).toBeUndefined()
    const format = vi.fn()
    expect(buildCompositeWholeValue(complexBorderToken, false, format)).toBeUndefined()
    expect(format).not.toHaveBeenCalled()
  })

  it('should build transition whole-value refs with cubic-ezier timing', () => {
    const format = vi.fn()
    const result = buildCompositeWholeValue(transitionToken, true, format)
    expect(result).toBe(
      'var(--transition.default-duration) ' +
        'cubic-bezier(var(--transition.default-timingFunction-0), var(--transition.default-timingFunction-1), ' +
        'var(--transition.default-timingFunction-2), var(--transition.default-timingFunction-3)) ' +
        'var(--transition.default-delay)',
    )
    expect(format).not.toHaveBeenCalled()
  })

  it('should use formatResolvedValue for transitions when references are not preserved', () => {
    const format = vi.fn().mockReturnValue('150ms cubic-bezier(0.25, 0.1, 0.25, 1) 0ms')
    expect(buildCompositeWholeValue(transitionToken, false, format)).toBe(
      '150ms cubic-bezier(0.25, 0.1, 0.25, 1) 0ms',
    )
    expect(format).toHaveBeenCalledTimes(1)
  })

  it('should return undefined for composite types without a whole-value form', () => {
    for (const tokenType of ['typography', 'strokeStyle']) {
      const token = makeToken(`tokens.${tokenType}`, { value: 1 }, tokenType)

      const preservedFormat = vi.fn()
      expect(buildCompositeWholeValue(token, true, preservedFormat)).toBeUndefined()
      expect(preservedFormat).not.toHaveBeenCalled()

      const resolvedFormat = vi.fn()
      expect(buildCompositeWholeValue(token, false, resolvedFormat)).toBeUndefined()
      expect(resolvedFormat).not.toHaveBeenCalled()
    }
  })
})

describe('gradient compositing', () => {
  const gradientToken = makeToken(
    'gradient.brand',
    [
      { color: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 }, position: 0 },
      { color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 }, position: 1 / 3 },
    ],
    'gradient',
  )

  describe('buildGradientWholeValue', () => {
    it('should build var()-reference whole value for each stop', () => {
      expect(buildGradientWholeValue(gradientToken)).toBe(
        'linear-gradient(var(--gradient.brand-0-color) var(--gradient.brand-0-position), ' +
          'var(--gradient.brand-1-color) var(--gradient.brand-1-position))',
      )
    })

    it('should return undefined for non-array or empty-array values', () => {
      expect(
        buildGradientWholeValue(makeToken('gradient.obj', { a: 1 }, 'gradient')),
      ).toBeUndefined()
      expect(buildGradientWholeValue(makeToken('gradient.empty', [], 'gradient'))).toBeUndefined()
    })
  })

  describe('buildCompositeWholeValue', () => {
    it('should use buildGradientWholeValue when preserving references', () => {
      const format = vi.fn()
      expect(buildCompositeWholeValue(gradientToken, true, format)).toBe(
        'linear-gradient(var(--gradient.brand-0-color) var(--gradient.brand-0-position), ' +
          'var(--gradient.brand-1-color) var(--gradient.brand-1-position))',
      )
      expect(format).not.toHaveBeenCalled()
    })

    it('should use formatResolvedValue when references are not preserved', () => {
      const format = vi.fn().mockReturnValue('linear-gradient(#0000ff 0%, #ff0000 33.33%)')
      expect(buildCompositeWholeValue(gradientToken, false, format)).toBe(
        'linear-gradient(#0000ff 0%, #ff0000 33.33%)',
      )
      expect(format).toHaveBeenCalledTimes(1)
    })

    it('should return undefined for non-array gradient values', () => {
      const token = makeToken('tokens.gradient', { value: 1 }, 'gradient')
      expect(buildCompositeWholeValue(token, true, vi.fn())).toBeUndefined()
      expect(buildCompositeWholeValue(token, false, vi.fn())).toBeUndefined()
    })
  })

  describe('formatGradientPosition', () => {
    it('should convert DTCG 0-1 fractions to percentages', () => {
      expect(formatGradientPosition(0)).toBe('0%')
      expect(formatGradientPosition(0.5)).toBe('50%')
      expect(formatGradientPosition(1)).toBe('100%')
    })

    it('should round to two decimal places', () => {
      expect(formatGradientPosition(1 / 3)).toBe('33.33%')
      expect(formatGradientPosition(2 / 3)).toBe('66.67%')
    })

    it('should clamp out-of-range values to [0, 1]', () => {
      expect(formatGradientPosition(-0.5)).toBe('0%')
      expect(formatGradientPosition(1.5)).toBe('100%')
    })
  })

  describe('formatGradientValue', () => {
    it('should format stops as hex + percentage positions', () => {
      expect(formatGradientValue(gradientToken.$value)).toBe(
        'linear-gradient(#0000ff 0%, #ff0000 33.33%)',
      )
    })

    it('should fall back to String for non-array or empty-array values', () => {
      expect(formatGradientValue({ a: 1 })).toBe('[object Object]')
      expect(formatGradientValue([])).toBe('')
    })
  })
})
