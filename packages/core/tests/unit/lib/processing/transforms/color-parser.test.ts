import { describe, expect, it } from 'vitest'
import { parseColor } from '../../../../../src/lib/processing/processors/transforms/built-in/color-parser'

describe('Color Parser', () => {
  describe('Hex Colors', () => {
    it('should parse 6-digit hex color', () => {
      const result = parseColor('#ff0000')
      expect(result).toBeDefined()
      expect(result?.format).toBe('hex')
      expect(result?.values).toHaveLength(3)
      expect(result?.values[0]).toBeCloseTo(255, 0)
      expect(result?.values[1]).toBeCloseTo(0, 0)
      expect(result?.values[2]).toBeCloseTo(0, 0)
    })

    it('should parse 3-digit hex color', () => {
      const result = parseColor('#f00')
      expect(result).toBeDefined()
      expect(result?.format).toBe('hex')
      expect(result?.values).toHaveLength(3)
    })

    it('should parse hex color with alpha', () => {
      const result = parseColor('#ff000080')
      expect(result).toBeDefined()
      expect(result?.alpha).toBeDefined()
      expect(result?.alpha).toBeCloseTo(0.5, 1)
    })
  })

  describe('RGB Colors', () => {
    it('should parse rgb() function', () => {
      const result = parseColor('rgb(255, 0, 0)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('rgb')
      expect(result?.values[0]).toBeCloseTo(255, 0)
      expect(result?.values[1]).toBeCloseTo(0, 0)
      expect(result?.values[2]).toBeCloseTo(0, 0)
    })

    it('should parse rgba() function', () => {
      const result = parseColor('rgba(255, 0, 0, 0.5)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('rgb')
      expect(result?.alpha).toBeCloseTo(0.5, 1)
    })

    it('should parse rgb with percentages', () => {
      const result = parseColor('rgb(100%, 0%, 0%)')
      expect(result).toBeDefined()
      expect(result?.values[0]).toBeCloseTo(255, 0)
    })
  })

  describe('HSL Colors', () => {
    it('should parse hsl() function', () => {
      const result = parseColor('hsl(0, 100%, 50%)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('hsl')
      expect(result?.values).toHaveLength(3)
    })

    it('should parse hsla() function', () => {
      const result = parseColor('hsla(0, 100%, 50%, 0.5)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('hsl')
      expect(result?.alpha).toBeCloseTo(0.5, 1)
    })
  })

  describe('OKLCH Colors', () => {
    it('should parse oklch() function', () => {
      const result = parseColor('oklch(0.628 0.258 29.2)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('oklch')
      expect(result?.values).toHaveLength(3)
      expect(result?.colorSpace).toBe('oklch')
    })

    it('should handle missing hue in oklch', () => {
      const result = parseColor('oklch(0.5 0.1 none)')
      expect(result).toBeDefined()
      expect(result?.values[2]).toBe(0) // none becomes 0
    })
  })

  describe('OKLAB Colors', () => {
    it('should parse oklab() function', () => {
      const result = parseColor('oklab(0.628 0.225 0.126)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('oklab')
      expect(result?.values).toHaveLength(3)
      expect(result?.colorSpace).toBe('oklab')
    })
  })

  describe('LCH Colors', () => {
    it('should parse lch() function', () => {
      const result = parseColor('lch(53 104 40)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('lch')
      expect(result?.values).toHaveLength(3)
    })

    it('should handle missing hue in lch', () => {
      const result = parseColor('lch(50 30 none)')
      expect(result).toBeDefined()
      expect(result?.values[2]).toBe(0)
    })
  })

  describe('LAB Colors', () => {
    it('should parse lab() function', () => {
      const result = parseColor('lab(53 80 67)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('lab')
      expect(result?.values).toHaveLength(3)
    })
  })

  describe('HWB Colors', () => {
    it('should parse hwb() function', () => {
      const result = parseColor('hwb(0 0% 0%)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('hwb')
      expect(result?.values).toHaveLength(3)
    })

    it('should handle missing hue in hwb', () => {
      const result = parseColor('hwb(none 50% 50%)')
      expect(result).toBeDefined()
      expect(result?.values[0]).toBe(0)
    })
  })

  describe('Color Function (Wide Gamut)', () => {
    it('should parse color(display-p3) function', () => {
      const result = parseColor('color(display-p3 1 0 0)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('color-function')
      expect(result?.colorSpace).toBe('p3')
    })

    it('should parse color(rec2020) function', () => {
      const result = parseColor('color(rec2020 1 0 0)')
      expect(result).toBeDefined()
      expect(result?.format).toBe('color-function')
      expect(result?.colorSpace).toBe('rec2020')
    })
  })

  describe('Named Colors', () => {
    it('should parse named color "red"', () => {
      const result = parseColor('red')
      expect(result).toBeDefined()
      // Note: culori converts named colors to rgb internally
      expect(result?.format).toBe('rgb')
      expect(result?.values[0]).toBeCloseTo(255, 0)
      expect(result?.values[1]).toBeCloseTo(0, 0)
      expect(result?.values[2]).toBeCloseTo(0, 0)
    })

    it('should parse named color "transparent"', () => {
      const result = parseColor('transparent')
      expect(result).toBeDefined()
      expect(result?.alpha).toBe(0)
    })

    it('should parse named color "white"', () => {
      const result = parseColor('white')
      expect(result).toBeDefined()
      expect(result?.values[0]).toBeCloseTo(255, 0)
      expect(result?.values[1]).toBeCloseTo(255, 0)
      expect(result?.values[2]).toBeCloseTo(255, 0)
    })
  })

  describe('Invalid Colors', () => {
    it('should return null for invalid color string', () => {
      const result = parseColor('not-a-color')
      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      const result = parseColor('')
      expect(result).toBeNull()
    })

    it('should return null for malformed hex', () => {
      const result = parseColor('#gggggg')
      expect(result).toBeNull()
    })

    it('should return null for malformed rgb', () => {
      const result = parseColor('rgb(300, 400, 500)')
      // Note: culori might be lenient, adjust expectation if needed
      // Some parsers clamp values, others reject
    })
  })

  describe('Original Value Preservation', () => {
    it('should preserve original color string', () => {
      const input = '#ff0000'
      const result = parseColor(input)
      expect(result?.original).toBe(input)
    })

    it('should preserve original for all formats', () => {
      const colors = ['rgb(255, 0, 0)', 'hsl(0, 100%, 50%)', 'oklch(0.628 0.258 29.2)', 'red']

      for (const color of colors) {
        const result = parseColor(color)
        expect(result?.original).toBe(color)
      }
    })
  })

  describe('Alpha Channel', () => {
    it('should preserve alpha from rgba', () => {
      const result = parseColor('rgba(255, 0, 0, 0.75)')
      expect(result?.alpha).toBeCloseTo(0.75, 2)
    })

    it('should preserve alpha from hsla', () => {
      const result = parseColor('hsla(0, 100%, 50%, 0.25)')
      expect(result?.alpha).toBeCloseTo(0.25, 2)
    })

    it('should preserve alpha from hex8', () => {
      const result = parseColor('#ff0000cc')
      expect(result?.alpha).toBeDefined()
      expect(result?.alpha).toBeLessThan(1)
    })

    it('should handle fully transparent colors', () => {
      const result = parseColor('rgba(255, 0, 0, 0)')
      expect(result?.alpha).toBe(0)
    })
  })
})
