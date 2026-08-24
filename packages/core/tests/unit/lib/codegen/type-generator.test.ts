import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import type {
  BorderValue,
  ColorValueObject,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  GradientValue,
  ResolvedTokens,
  ShadowValue,
  StrokeStyleValue,
  TokenType,
  TransitionValue,
  TypographyValue,
} from '../../../../src'
import { TypeGenerator } from '../../../../src/codegen/type-generator'
import { ResolverParser } from '../../../../src/adapters/filesystem/resolver-parser'
import { ReferenceResolver, ResolutionEngine } from '../../../../src/resolution'
import { AliasResolver } from '../../../../src/resolution/alias-resolver'
import { TokenParser } from '../../../../src/engine/token-parser'
import { getFixturePath } from '../../../utils/test-helpers'

function makeToken(
  name: string,
  $type: TokenType,
  $value: unknown,
  $description?: string,
): ResolvedTokens[string] {
  return {
    $type,
    $value,
    $description,
    path: name.split('.'),
    name,
    originalValue: $value,
  } as ResolvedTokens[string]
}

/**
 * Hand-crafted token set covering every DTCG token type with realistic
 * resolved value shapes.
 */
function makeDtcTokenSet(): ResolvedTokens {
  return {
    'color.brand': makeToken(
      'color.brand',
      'color',
      { colorSpace: 'srgb', components: [1, 0, 0] },
      'Brand color',
    ),
    'color.gradient': makeToken('color.gradient', 'gradient', [
      { color: { colorSpace: 'srgb', components: [1, 0, 0] }, position: 0 },
      { color: { colorSpace: 'srgb', components: [0, 0, 1] }, position: 1 },
    ]),
    'dimension.space': makeToken('dimension.space', 'dimension', { value: 8, unit: 'px' }),
    'duration.fast': makeToken('duration.fast', 'duration', { value: 150, unit: 'ms' }),
    'easing.curve': makeToken('easing.curve', 'cubicBezier', [0.4, 0, 0.6, 1]),
    'font.family': makeToken('font.family', 'fontFamily', ['Helvetica', 'Arial', 'sans-serif']),
    'font.weight': makeToken('font.weight', 'fontWeight', 400),
    'motion.transition': makeToken('motion.transition', 'transition', {
      duration: { value: 200, unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: [0.4, 0, 0.6, 1],
    }),
    'opacity.full': makeToken('opacity.full', 'number', 1),
    'shadow.box': makeToken('shadow.box', 'shadow', [
      {
        color: { colorSpace: 'srgb', components: [0, 0, 0] },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 2, unit: 'px' },
        blur: { value: 4, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
    ]),
    'shape.border': makeToken('shape.border', 'border', {
      color: { colorSpace: 'srgb', components: [0, 0, 0] },
      width: { value: 1, unit: 'px' },
      style: 'solid',
    }),
    'shape.stroke': makeToken('shape.stroke', 'strokeStyle', {
      dashArray: [{ value: 2, unit: 'px' }],
      lineCap: 'round',
    }),
    'shape.typography': makeToken('shape.typography', 'typography', {
      fontFamily: ['Helvetica', 'Arial'],
      fontSize: { value: 16, unit: 'px' },
      fontWeight: 400,
      letterSpacing: { value: 0, unit: 'px' },
      lineHeight: 1.5,
    }),
    'zebra.tail': makeToken('zebra.tail', 'number', 0),
  }
}

describe('Type Generation Integration Tests', () => {
  let tokens: ResolvedTokens
  let generator: TypeGenerator

  beforeEach(async () => {
    const parser = new ResolverParser()
    const tokenParser = new TokenParser()
    const aliasResolver = new AliasResolver()
    const resolverPath = getFixturePath('tokens.resolver.json')
    const fixturesDir = path.dirname(resolverPath)
    const refResolver = new ReferenceResolver(fixturesDir)
    const resolver = await parser.parseFile(resolverPath)
    const engine = new ResolutionEngine(resolver, refResolver)

    const rawTokens = await engine.resolve({ theme: 'light', scale: 'tablet' })
    const flatTokens = tokenParser.flatten(rawTokens)
    tokens = aliasResolver.resolve(flatTokens)
    generator = new TypeGenerator()
  })

  describe('Token Name Type Generation', () => {
    it('should generate union type of all token names', () => {
      const lines = generator.generateTokenNamesType(tokens, 'TokenNames')
      const output = lines.join('\n')

      expect(output).toContain('export type TokenNames =')
      expect(output).toContain('"color.primitive.red"')
      expect(output).toContain('"dimension.base.4"')
      expect(output).toContain('"font.family.sans"')
    })

    it('should format as multiline union', () => {
      const lines = generator.generateTokenNamesType(tokens, 'TokenNames')
      const output = lines.join('\n')

      expect(output).toMatch(/\|\s+"/)
    })

    it('should include all token paths', () => {
      const lines = generator.generateTokenNamesType(tokens, 'TokenNames')
      const output = lines.join('\n')

      for (const name of Object.keys(tokens)) {
        expect(output).toContain(`"${name}"`)
      }
    })

    it('should sort token names deterministically', () => {
      const output = generator.generateTokenNamesType(makeDtcTokenSet(), 'TokenNames').join('\n')

      const names = [...output.matchAll(/^\s*\| "([^"]+)"/gm)].map((match) => match[1]!)
      expect(names).toEqual([...names].sort())
    })
  })

  describe('Token Value Type Generation', () => {
    it('should map every DTCG token type to its real resolved shape', () => {
      const output = generator.generateTokenValuesType(makeDtcTokenSet(), 'TokenValues').join('\n')

      expect(output).toContain('"color.brand": ColorValueObject')
      expect(output).toContain('"dimension.space": DimensionValue')
      expect(output).toContain('"duration.fast": DurationValue')
      expect(output).toContain('"easing.curve": [number, number, number, number]')
      expect(output).toContain('"font.family": FontFamilyValue')
      expect(output).toContain('"font.weight": FontWeightValue')
      expect(output).toContain('"motion.transition": TransitionValue')
      expect(output).toContain('"opacity.full": number')
      expect(output).toContain('"shadow.box": ShadowValue')
      expect(output).toContain('"shape.border": BorderValue')
      expect(output).toContain('"shape.stroke": StrokeStyleValue')
      expect(output).toContain('"shape.typography": TypographyValue')
      expect(output).toContain('"color.gradient": GradientValue')
    })

    it('should not emit a blanket string for any known DTCG type', () => {
      const output = generator.generateTokenValuesType(makeDtcTokenSet(), 'TokenValues').join('\n')

      for (const line of output.split('\n')) {
        expect(line).not.toMatch(/:\s*string\s*$/)
      }
    })

    it('should keep JSDoc descriptions from token metadata', () => {
      const output = generator.generateTokenValuesType(makeDtcTokenSet(), 'TokenValues').join('\n')

      expect(output).toContain('/** Brand color */')
    })

    it('should sort values deterministically by token name', () => {
      const output = generator.generateTokenValuesType(makeDtcTokenSet(), 'TokenValues').join('\n')

      const names = [...output.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]!)
      expect(names).toEqual([...names].sort())
    })
  })

  describe('generate() - import emission and structure', () => {
    it('should emit a single import type statement for referenced DTCG types', () => {
      const output = generator.generate(makeDtcTokenSet(), { includeValues: true })

      expect(output.startsWith('import type {')).toBe(true)
      expect(output).toContain("} from 'dispersa'")
      expect(output).toContain('ColorValueObject')
      expect(output).toContain('DimensionValue')
      expect(output).toContain('TypographyValue')
      expect(output).not.toContain('import type { string')
    })

    it('should only import types actually used', () => {
      const output = generator.generate(
        {
          'opacity.full': makeToken('opacity.full', 'number', 1),
        },
        { includeValues: true },
      )

      expect(output.startsWith('export type TokenName =')).toBe(true)
      expect(output).not.toContain("from 'dispersa'")
    })

    it('should honor exportType, includeValues, and moduleName options', () => {
      const output = generator.generate(makeDtcTokenSet(), {
        exportType: 'interface',
        includeValues: true,
        moduleName: 'X',
      })

      expect(output).toContain('export interface X {')
      expect(output).toContain('export type XValues = {')
      expect(output).toContain('export type TokenName =')
    })

    it('should quote structure keys that are not valid identifiers', () => {
      const nestedTokens: ResolvedTokens = {
        'z-index.something': makeToken('z-index.something', 'number', 1),
      }
      const output = generator.generate(nestedTokens)

      expect(output).toContain('"z-index": {')
    })

    it('should sort structure groups deterministically by key', () => {
      const output = generator.generate(makeDtcTokenSet(), { includeValues: false })

      const structure = output.slice(output.indexOf('export type Tokens ='))
      const keys = [...structure.matchAll(/^  [^ ].*:\s*{$/gm)].map((match) => match[0]!)
      expect(keys.length).toBeGreaterThan(0)
      expect(keys).toEqual([...keys].sort())
    })

    it('should keep JSDoc descriptions in the structure type', () => {
      const output = generator.generate(makeDtcTokenSet())

      expect(output).toContain('/** Brand color */')
    })

    it('should handle empty token collection', () => {
      const emptyTokens: ResolvedTokens = {}

      const namesOutput = generator.generateTokenNamesType(emptyTokens, 'TokenNames').join('\n')
      expect(namesOutput).toContain('export type TokenNames = never')

      const valuesOutput = generator.generateTokenValuesType(emptyTokens, 'TokenValues').join('\n')
      expect(valuesOutput).toContain('export type TokenValues = {')
    })

    it('should handle special characters in token names', () => {
      const specialTokens: ResolvedTokens = {
        'token-with-dash': makeToken('token-with-dash', 'color', {
          colorSpace: 'srgb',
          components: [0, 0.27, 0.55],
        }),
        token_with_underscore: makeToken('token_with_underscore', 'color', {
          colorSpace: 'srgb',
          components: [0, 1, 0],
        }),
      }

      const output = generator.generateTokenNamesType(specialTokens, 'TokenNames').join('\n')

      expect(output).toContain('"token-with-dash"')
      expect(output).toContain('"token_with_underscore"')
    })

    it('should handle tokens without a $type by inferring from the value', () => {
      const inferredTokens: ResolvedTokens = {
        'opacity.value': {
          $value: 1,
          path: ['opacity', 'value'],
          name: 'opacity.value',
          originalValue: 1,
        },
      }

      const output = generator.generateTokenValuesType(inferredTokens, 'TokenValues').join('\n')

      expect(output).toContain('"opacity.value": number')
    })
  })

  describe('Type Customization', () => {
    it('should accept custom type names', () => {
      const namesLines = generator.generateTokenNamesType(tokens, 'MyTokenNames')
      const names = namesLines.join('\n')
      expect(names).toContain('export type MyTokenNames =')

      const valuesLines = generator.generateTokenValuesType(tokens, 'MyTokenValues')
      const values = valuesLines.join('\n')
      expect(values).toContain('export type MyTokenValues = {')
    })
  })
})
