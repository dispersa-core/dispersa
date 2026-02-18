import { describe, expect, it } from 'vitest'

import type { OutputConfig } from '../../../src/config'
import type { ResolverDocument } from '../../../src/resolution/types'
import { isOutputTree } from '../../../src/renderers'
import { IosRenderer } from '../../../src/renderers/ios'
import type { IosRendererOptions } from '../../../src/renderers/ios'
import type { RenderContext } from '../../../src/renderers/types'
import type { ResolvedToken, ResolvedTokens } from '../../../src/tokens/types'

const makeToken = (
  name: string,
  value: unknown,
  type?: string,
  description?: string,
): ResolvedToken => ({
  $value: value,
  $type: type,
  $description: description,
  path: name.split('.'),
  name,
  originalValue: value as string,
})

const mockResolver: ResolverDocument = {
  resolutionOrder: [],
}

const buildContext = (
  tokens: ResolvedTokens,
  options: IosRendererOptions,
  renderer: IosRenderer,
): RenderContext => {
  const output: OutputConfig = {
    name: 'ios',
    renderer,
    file: 'DesignTokens.swift',
    options,
  }

  return {
    permutations: [{ tokens, modifierInputs: {} }],
    output,
    resolver: mockResolver,
    meta: { dimensions: [], defaults: {}, basePermutation: {} },
  }
}

const getContent = async (
  renderer: IosRenderer,
  tokens: ResolvedTokens,
  options: IosRendererOptions,
): Promise<string> => {
  const context = buildContext(tokens, options, renderer)
  const result = await renderer.format(context, context.output.options as IosRendererOptions)
  return isOutputTree(result) ? (Object.values(result.files)[0] ?? '') : ''
}

describe('iOS/SwiftUI Renderer', () => {
  const renderer = new IosRenderer()

  describe('enum structure', () => {
    it('should generate enum-based Swift code', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        accessLevel: 'public',
        enumName: 'DesignTokens',
      })

      expect(content).toContain('public enum DesignTokens')
      expect(content).toContain('public enum Colors')
      expect(content).toContain('public enum Spacing')
      expect(content).toContain('import SwiftUI')
    })
  })

  describe('grouped structure', () => {
    it('should generate extension-based Swift code with namespace enum', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'grouped',
        accessLevel: 'public',
      })

      // Should use a namespace enum instead of extending native types
      expect(content).toContain('public enum DesignTokens {}')
      expect(content).toContain('public extension DesignTokens')
      // Should NOT extend native types directly
      expect(content).not.toContain('extension Color')
      expect(content).not.toContain('extension CGFloat')
    })

    it('should respect extensionNamespace option', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'grouped',
        extensionNamespace: 'AppTokens',
      })

      expect(content).toContain('public enum AppTokens {}')
      expect(content).toContain('public extension AppTokens')
    })

    it('should include access level on property declarations', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'grouped',
        accessLevel: 'public',
      })

      // Properties inside nested enums must have explicit access
      expect(content).toMatch(/public static let primary/)
    })

    it('should omit redundant access on nested enum declarations', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'grouped',
        accessLevel: 'public',
      })

      // The nested enum inherits access from the extension, so no 'public' prefix
      expect(content).toMatch(/^\s+enum Colors \{/m)
      expect(content).not.toMatch(/^\s+public enum Colors/m)
    })
  })

  describe('color tokens', () => {
    it('should generate sRGB Color values', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        colorSpace: 'sRGB',
      })

      expect(content).toContain('Color(red: 1')
      expect(content).toContain('green: 0')
      expect(content).toContain('blue: 0')
    })

    it('should generate Display P3 Color values', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        colorSpace: 'displayP3',
      })

      expect(content).toContain('.displayP3')
    })

    it('should handle color with alpha', async () => {
      const tokens: ResolvedTokens = {
        'color.overlay': makeToken(
          'color.overlay',
          { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        colorSpace: 'sRGB',
      })

      expect(content).toContain('opacity: 0.5')
    })

    it('should use 4-decimal precision for color components', async () => {
      const tokens: ResolvedTokens = {
        'color.brand': makeToken(
          'color.brand',
          { colorSpace: 'srgb', components: [0.12345, 0.6789, 0.3] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      // Should round to 4 decimal places
      expect(content).toContain('red: 0.1235')
      expect(content).toContain('green: 0.6789')
      expect(content).toContain('blue: 0.3')
    })
  })

  describe('dimension tokens', () => {
    it('should generate CGFloat values in points', async () => {
      const tokens: ResolvedTokens = {
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain(': CGFloat = 8')
    })

    it('should convert rem to points (1rem = 16pt)', async () => {
      const tokens: ResolvedTokens = {
        'spacing.md': makeToken('spacing.md', { value: 1, unit: 'rem' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain(': CGFloat = 16')
    })
  })

  describe('font tokens', () => {
    it('should generate font family as a String value', async () => {
      const tokens: ResolvedTokens = {
        'font.sans': makeToken('font.sans', ['Inter', 'sans-serif'], 'fontFamily'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      // Should output font family name as a String, not Font.custom with hardcoded size
      expect(content).toContain(': String = "Inter"')
      expect(content).not.toContain('Font.custom')
      expect(content).not.toContain('size: 16')
    })

    it('should generate String type annotation for font family', async () => {
      const tokens: ResolvedTokens = {
        'font.mono': makeToken('font.mono', 'SF Mono', 'fontFamily'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain(': String = "SF Mono"')
    })
  })

  describe('font weight tokens', () => {
    it('should map numeric weights to fully-qualified Font.Weight', async () => {
      const tokens: ResolvedTokens = {
        'weight.bold': makeToken('weight.bold', 700, 'fontWeight'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('Font.Weight.bold')
      expect(content).toContain(': Font.Weight')
    })

    it('should map named weights to fully-qualified Font.Weight', async () => {
      const tokens: ResolvedTokens = {
        'weight.light': makeToken('weight.light', 'light', 'fontWeight'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('Font.Weight.light')
    })

    it('should include Font.Weight type annotation', async () => {
      const tokens: ResolvedTokens = {
        'weight.medium': makeToken('weight.medium', 500, 'fontWeight'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain(': Font.Weight = Font.Weight.medium')
    })
  })

  describe('duration tokens', () => {
    it('should generate TimeInterval values in seconds', async () => {
      const tokens: ResolvedTokens = {
        'animation.fast': makeToken('animation.fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('import Foundation')
      expect(content).toContain(': TimeInterval = 0.2')
    })
  })

  describe('shadow tokens', () => {
    it('should generate ShadowStyle values', async () => {
      const tokens: ResolvedTokens = {
        'shadow.md': makeToken(
          'shadow.md',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.25 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 4, unit: 'px' },
            blur: { value: 8, unit: 'px' },
            spread: { value: 0, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('ShadowStyle(color:')
      expect(content).toContain('radius: 8.0')
      expect(content).toContain('x: 0.0')
      expect(content).toContain('y: 4.0')
      expect(content).toContain('spread: 0.0')
    })

    it('should emit ShadowStyle struct definition with spread when shadow tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken(
          'shadow.sm',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 4, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('public struct ShadowStyle')
      expect(content).toContain('public let color: Color')
      expect(content).toContain('public let radius: CGFloat')
      expect(content).toContain('public let spread: CGFloat')
    })

    it('should not emit ShadowStyle struct when no shadow tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).not.toContain('ShadowStyle')
    })
  })

  describe('typography tokens', () => {
    it('should generate TypographyStyle values with font, tracking, and lineSpacing', async () => {
      const tokens: ResolvedTokens = {
        'typography.heading': makeToken(
          'typography.heading',
          {
            fontFamily: ['Inter'],
            fontSize: { value: 32, unit: 'px' },
            fontWeight: 700,
            letterSpacing: { value: 0, unit: 'px' },
            lineHeight: 1.2,
          },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('TypographyStyle(font:')
      expect(content).toContain('Font.custom("Inter"')
      expect(content).toContain('size: 32')
      expect(content).toContain('Font.Weight.bold')
    })

    it('should include letterSpacing and lineHeight as struct properties', async () => {
      const tokens: ResolvedTokens = {
        'typography.body': makeToken(
          'typography.body',
          {
            fontFamily: ['Inter'],
            fontSize: { value: 16, unit: 'px' },
            fontWeight: 400,
            letterSpacing: { value: 0.5, unit: 'px' },
            lineHeight: 1.5,
          },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('tracking: 0.5')
      expect(content).toContain('lineSpacing: 8')
      // Should be in the struct constructor, not in a comment
      expect(content).not.toMatch(/\/\*.*tracking/)
    })

    it('should emit TypographyStyle struct definition when typography tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'typography.heading': makeToken(
          'typography.heading',
          {
            fontFamily: ['Inter'],
            fontSize: { value: 32, unit: 'px' },
            fontWeight: 700,
            letterSpacing: { value: 0, unit: 'px' },
            lineHeight: 1.2,
          },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('public struct TypographyStyle')
      expect(content).toContain('public let font: Font')
      expect(content).toContain('public let tracking: CGFloat')
      expect(content).toContain('public let lineSpacing: CGFloat')
    })

    it('should emit typographyStyle View extension', async () => {
      const tokens: ResolvedTokens = {
        'typography.body': makeToken(
          'typography.body',
          {
            fontFamily: ['Inter'],
            fontSize: { value: 16, unit: 'px' },
            fontWeight: 400,
            letterSpacing: { value: 0.5, unit: 'px' },
            lineHeight: 1.5,
          },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('extension View')
      expect(content).toContain('func typographyStyle(_ style: TypographyStyle)')
    })
  })

  describe('cubicBezier tokens', () => {
    it('should use UnitCurve.bezier static method', async () => {
      const tokens: ResolvedTokens = {
        'easing.easeOut': makeToken('easing.easeOut', [0, 0, 0.58, 1], 'cubicBezier'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('UnitCurve.bezier(startControlPoint:')
      expect(content).not.toMatch(/UnitCurve\(startControlPoint:/)
    })
  })

  describe('access level', () => {
    it('should use internal access level', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        accessLevel: 'internal',
      })

      expect(content).toContain('internal enum DesignTokens')
      expect(content).toContain('internal enum Colors')
      expect(content).not.toContain('public')
    })
  })

  describe('standalone preset', () => {
    it('should generate separate files per permutation', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const output: OutputConfig = {
        name: 'ios',
        renderer,
        file: 'Tokens-{theme}.swift',
        options: { preset: 'standalone', structure: 'enum' },
      }

      const context: RenderContext = {
        permutations: [
          { tokens, modifierInputs: { theme: 'light' } },
          { tokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: mockResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = await renderer.format(context, context.output.options as IosRendererOptions)

      expect(isOutputTree(result)).toBe(true)
      if (isOutputTree(result)) {
        expect(Object.keys(result.files)).toHaveLength(2)
        expect(result.files['Tokens-light.swift']).toBeDefined()
        expect(result.files['Tokens-dark.swift']).toBeDefined()
      }
    })
  })

  describe('swiftVersion', () => {
    it('should omit nonisolated(unsafe) for Swift 5.9 (default)', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        swiftVersion: '5.9',
      })

      expect(content).toContain('public static let primary')
      expect(content).not.toContain('nonisolated')
    })

    it('should add nonisolated(unsafe) for Swift 6.0', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        swiftVersion: '6.0',
      })

      expect(content).toContain('public nonisolated(unsafe) static let primary')
    })

    it('should add nonisolated(unsafe) in grouped structure for Swift 6.0', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'grouped',
        swiftVersion: '6.0',
      })

      expect(content).toContain('nonisolated(unsafe) static let')
    })
  })

  describe('indent', () => {
    it('should use 2-space indentation', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum', indent: 2 })

      // 2-space indent: enum body at 2 spaces, properties at 4 spaces
      expect(content).toMatch(/^ {2}public enum Colors/m)
      expect(content).toMatch(/^ {4}public static let/m)
    })

    it('should default to 4-space indentation', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toMatch(/^ {4}public enum Colors/m)
      expect(content).toMatch(/^ {8}public static let/m)
    })
  })

  describe('doc comments', () => {
    it('should emit /// doc comments from $description', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
          'Primary brand color for interactive elements',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('/// Primary brand color for interactive elements')
    })

    it('should omit doc comments when $description is absent', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).not.toContain('///')
    })
  })

  describe('qualified names (duplicate prevention)', () => {
    it('should preserve parent path segments to avoid duplicates', async () => {
      const tokens: ResolvedTokens = {
        'color.blue.400': makeToken(
          'color.blue.400',
          { colorSpace: 'srgb', components: [0.5, 0.7, 1] },
          'color',
        ),
        'color.gray.400': makeToken(
          'color.gray.400',
          { colorSpace: 'srgb', components: [0.7, 0.7, 0.7] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      // Both should have unique names: blue400 and gray400
      expect(content).toContain('blue400')
      expect(content).toContain('gray400')
      // Should NOT have bare _400 identifiers
      expect(content).not.toMatch(/static let _400/)
    })

    it('should handle single-segment token names', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('static let primary')
    })
  })

  describe('Swift keyword escaping', () => {
    it('should backtick-escape Swift reserved words', async () => {
      const tokens: ResolvedTokens = {
        'color.default': makeToken(
          'color.default',
          { colorSpace: 'srgb', components: [0.5, 0.5, 0.5] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('static let `default`')
    })

    it('should not backtick-escape non-reserved identifiers', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('static let primary')
      expect(content).not.toContain('`primary`')
    })
  })

  describe('border tokens', () => {
    it('should generate BorderStyle values', async () => {
      const tokens: ResolvedTokens = {
        'border.default': makeToken(
          'border.default',
          {
            color: { colorSpace: 'srgb', components: [0.8, 0.8, 0.8] },
            width: { value: 1, unit: 'px' },
            style: 'solid',
          },
          'border',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('BorderStyle(color:')
      expect(content).toContain('Color(red: 0.8')
      expect(content).toContain('width: 1.0')
    })

    it('should emit BorderStyle struct definition when border tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'border.thin': makeToken(
          'border.thin',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0] },
            width: { value: 1, unit: 'px' },
            style: 'solid',
          },
          'border',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('public struct BorderStyle')
      expect(content).toContain('public let color: Color')
      expect(content).toContain('public let width: CGFloat')
    })

    it('should not emit BorderStyle struct when no border tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).not.toContain('BorderStyle')
    })
  })

  describe('gradient tokens', () => {
    it('should generate Gradient values with stops', async () => {
      const tokens: ResolvedTokens = {
        'gradient.brand': makeToken(
          'gradient.brand',
          [
            { color: { colorSpace: 'srgb', components: [1, 0, 0] }, position: 0 },
            { color: { colorSpace: 'srgb', components: [0, 0, 1] }, position: 1 },
          ],
          'gradient',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('Gradient(stops:')
      expect(content).toContain('.init(color: Color(red: 1')
      expect(content).toContain('location: 0')
      expect(content).toContain('location: 1')
    })

    it('should group gradient tokens under Gradients enum', async () => {
      const tokens: ResolvedTokens = {
        'gradient.brand': makeToken(
          'gradient.brand',
          [
            { color: { colorSpace: 'srgb', components: [1, 0, 0] }, position: 0 },
            { color: { colorSpace: 'srgb', components: [0, 0, 1] }, position: 1 },
          ],
          'gradient',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('enum Gradients')
    })

    it('should handle empty gradient stops', async () => {
      const tokens: ResolvedTokens = {
        'gradient.empty': makeToken('gradient.empty', [], 'gradient'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('Gradient(stops: [])')
    })
  })

  describe('frozen option', () => {
    it('should add @frozen to enums when frozen is true', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        frozen: true,
      })

      expect(content).toContain('@frozen public enum DesignTokens')
      expect(content).toContain('@frozen public enum Colors')
    })

    it('should add @frozen to structs when frozen is true', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken(
          'shadow.sm',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 4, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        frozen: true,
      })

      expect(content).toContain('@frozen public struct ShadowStyle')
    })

    it('should omit @frozen by default', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).not.toContain('@frozen')
    })
  })

  describe('Swift 6 Sendable conformance', () => {
    it('should add Sendable to ShadowStyle struct when swiftVersion is 6.0', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken(
          'shadow.sm',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 4, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        swiftVersion: '6.0',
      })

      expect(content).toContain('struct ShadowStyle: Sendable')
    })

    it('should add Sendable to TypographyStyle struct when swiftVersion is 6.0', async () => {
      const tokens: ResolvedTokens = {
        'typography.heading': makeToken(
          'typography.heading',
          {
            fontFamily: ['Inter'],
            fontSize: { value: 32, unit: 'px' },
            fontWeight: 700,
            letterSpacing: { value: 0, unit: 'px' },
            lineHeight: 1.2,
          },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        swiftVersion: '6.0',
      })

      expect(content).toContain('struct TypographyStyle: Sendable')
    })

    it('should omit Sendable for Swift 5.9', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken(
          'shadow.sm',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 4, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        swiftVersion: '5.9',
      })

      expect(content).not.toContain('Sendable')
    })
  })

  describe('View extensions', () => {
    it('should emit shadowStyle View extension when shadow tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken(
          'shadow.sm',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 4, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('extension View')
      expect(content).toContain('func shadowStyle(_ style: ShadowStyle)')
      expect(content).toContain('self.shadow(color: style.color')
    })

    it('should not emit View extensions when no shadow or typography tokens exist', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).not.toContain('extension View')
    })
  })

  describe('edge cases', () => {
    it('should handle empty tokens', async () => {
      const tokens: ResolvedTokens = {}

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      expect(content).toContain('enum DesignTokens')
      expect(content).toContain('import SwiftUI')
    })

    it('should generate valid Swift identifiers from kebab-case names', async () => {
      const tokens: ResolvedTokens = {
        'color.brand-primary': makeToken(
          'color.brand-primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      // kebab-case should become camelCase
      expect(content).toContain('brandPrimary')
      expect(content).not.toContain('brand-primary')
    })

    it('should handle tokens starting with digits', async () => {
      const tokens: ResolvedTokens = {
        'spacing.4': makeToken('spacing.4', { value: 16, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens, { structure: 'enum' })

      // Should prefix with underscore
      expect(content).toContain('_4')
    })

    it('should handle custom enum name', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        structure: 'enum',
        enumName: 'AppTokens',
      })

      expect(content).toContain('enum AppTokens')
      expect(content).not.toContain('DesignTokens')
    })
  })
})
