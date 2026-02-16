import { describe, expect, it } from 'vitest'

import type { OutputConfig } from '../../../src/config'
import type { ResolverDocument } from '../../../src/resolution/resolution.types'
import { isOutputTree } from '../../../src/renderers'
import { AndroidRenderer } from '../../../src/renderers/android'
import type { AndroidRendererOptions } from '../../../src/renderers/android'
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

const defaultOptions: AndroidRendererOptions = {
  packageName: 'com.example.tokens',
  objectName: 'DesignTokens',
  colorFormat: 'argb_hex',
}

const buildContext = (
  tokens: ResolvedTokens,
  options: AndroidRendererOptions,
  renderer: AndroidRenderer,
): RenderContext => {
  const output: OutputConfig = {
    name: 'android',
    renderer,
    file: 'DesignTokens.kt',
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
  renderer: AndroidRenderer,
  tokens: ResolvedTokens,
  options: AndroidRendererOptions = defaultOptions,
): Promise<string> => {
  const context = buildContext(tokens, options, renderer)
  const result = await renderer.format(context, context.output.options as AndroidRendererOptions)
  if (!isOutputTree(result)) return ''
  return Object.values(result.files)[0] ?? ''
}

describe('Android/Compose Renderer', () => {
  const renderer = new AndroidRenderer()

  // =========================================================================
  // Nested object structure (path-based hierarchy)
  // =========================================================================

  describe('nested object structure', () => {
    it('should generate nested objects mirroring token path hierarchy', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('package com.example.tokens')
      expect(content).toContain('object DesignTokens')
      expect(content).toContain('object Color')
      expect(content).toMatch(/val primary: Color =/)
      expect(content).toContain('object Spacing')
      expect(content).toMatch(/val sm: Dp =/)
    })

    it('should produce unique identifiers for tokens with shared leaf names', async () => {
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
        'spacing.100': makeToken('spacing.100', { value: 8, unit: 'px' }, 'dimension'),
        'layout.corner-radius.100': makeToken(
          'layout.corner-radius.100',
          { value: 4, unit: 'px' },
          'dimension',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('object Blue')
      expect(content).toContain('object Gray')
      expect(content).toContain('object Layout')
      expect(content).toContain('object CornerRadius')

      const blue400Matches = content.match(/val _400: Color/g)
      expect(blue400Matches).toHaveLength(2)
    })

    it('should convert path segments to PascalCase for object names', async () => {
      const tokens: ResolvedTokens = {
        'layout.corner-radius.sm': makeToken(
          'layout.corner-radius.sm',
          { value: 4, unit: 'px' },
          'dimension',
        ),
        'typography.font-family.sans': makeToken(
          'typography.font-family.sans',
          ['sans-serif'],
          'fontFamily',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('object Layout')
      expect(content).toContain('object CornerRadius')
      expect(content).toContain('object Typography')
      expect(content).toContain('object FontFamily')
    })
  })

  // =========================================================================
  // Flat structure (type-based grouping)
  // =========================================================================

  describe('flat structure', () => {
    it('should group tokens by $type into semantic sub-objects', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
        'animation.fast': makeToken('animation.fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        structure: 'flat',
      })

      expect(content).toContain('object Colors')
      expect(content).toContain('object Spacing')
      expect(content).toContain('object Durations')
      expect(content).not.toContain('object Color {')
    })

    it('should flatten token names by stripping the type prefix', async () => {
      const tokens: ResolvedTokens = {
        'color.alias.accent.background.default': makeToken(
          'color.alias.accent.background.default',
          { colorSpace: 'srgb', components: [0.2, 0.4, 1] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        structure: 'flat',
      })

      expect(content).toContain('object Colors')
      expect(content).toMatch(/val aliasAccentBackgroundDefault: Color =/)
      expect(content).not.toContain('object Alias')
    })

    it('should handle tokens with no type prefix to strip', async () => {
      const tokens: ResolvedTokens = {
        red: makeToken('red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        structure: 'flat',
      })

      expect(content).toContain('object Colors')
      expect(content).toMatch(/val red: Color =/)
    })

    it('should apply visibility in flat mode', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        structure: 'flat',
        visibility: 'public',
      })

      expect(content).toContain('public object DesignTokens')
      expect(content).toContain('public object Colors')
      expect(content).toContain('public val primary')
    })
  })

  // =========================================================================
  // File header and annotations
  // =========================================================================

  describe('file header and annotations', () => {
    it('should place @Suppress on the root object instead of file-level', async () => {
      const content = await getContent(renderer, {})

      expect(content).not.toContain('@file:Suppress')
      expect(content).toContain('@Suppress("unused")')
      // @Suppress should appear directly before the object declaration
      const suppressIdx = content.indexOf('@Suppress("unused")')
      const objectIdx = content.indexOf('object DesignTokens')
      expect(suppressIdx).toBeLessThan(objectIdx)
      expect(objectIdx - suppressIdx).toBeLessThan(50)
    })

    it('should include generated-by comment', async () => {
      const content = await getContent(renderer, {})

      expect(content).toContain('// Generated by Dispersa - do not edit manually')
    })
  })

  // =========================================================================
  // KDoc comments
  // =========================================================================

  describe('KDoc comments', () => {
    it('should emit KDoc from token $description', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
          'Primary brand color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('/** Primary brand color */')
      const kdocIndex = content.indexOf('/** Primary brand color */')
      const valIndex = content.indexOf('val primary')
      expect(kdocIndex).toBeLessThan(valIndex)
    })

    it('should not emit KDoc when $description is absent', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).not.toContain('/**')
    })
  })

  // =========================================================================
  // Type annotations
  // =========================================================================

  describe('type annotations', () => {
    it('should annotate color tokens with Color type', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val red: Color = Color\(/)
    })

    it('should annotate dimension tokens with Dp type', async () => {
      const tokens: ResolvedTokens = {
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val sm: Dp = 8\.dp/)
    })

    it('should annotate shadow tokens with ShadowToken type', async () => {
      const tokens: ResolvedTokens = {
        'shadow.md': makeToken(
          'shadow.md',
          {
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.25 },
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 4, unit: 'px' },
            blur: { value: 8, unit: 'px' },
          },
          'shadow',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val md: ShadowToken = ShadowToken\(/)
    })

    it('should annotate border tokens with BorderStroke type', async () => {
      const tokens: ResolvedTokens = {
        'border.thin': makeToken(
          'border.thin',
          {
            width: { value: 1, unit: 'px' },
            color: { colorSpace: 'srgb', components: [0.8, 0.8, 0.8] },
            style: 'solid',
          },
          'border',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val thin: BorderStroke = BorderStroke\(/)
    })

    it('should annotate duration tokens with Duration type', async () => {
      const tokens: ResolvedTokens = {
        'animation.fast': makeToken('animation.fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val fast: Duration = 200\.milliseconds/)
    })

    it('should annotate fontWeight tokens with FontWeight type', async () => {
      const tokens: ResolvedTokens = {
        'weight.bold': makeToken('weight.bold', 700, 'fontWeight'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val bold: FontWeight = FontWeight\.Bold/)
    })

    it('should annotate typography tokens with TextStyle type', async () => {
      const tokens: ResolvedTokens = {
        'typography.heading': makeToken(
          'typography.heading',
          { fontSize: { value: 32, unit: 'px' }, fontWeight: 700 },
          'typography',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val heading: TextStyle = TextStyle\(/)
    })

    it('should annotate cubicBezier tokens with CubicBezierEasing type', async () => {
      const tokens: ResolvedTokens = {
        'easing.easeOut': makeToken('easing.easeOut', [0.0, 0.0, 0.58, 1.0], 'cubicBezier'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val easeOut: CubicBezierEasing = CubicBezierEasing\(/)
    })

    it('should annotate number tokens with Double type', async () => {
      const tokens: ResolvedTokens = {
        'misc.ratio': makeToken('misc.ratio', 1.5, 'number'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val ratio: Double = 1\.5/)
    })
  })

  // =========================================================================
  // Color tokens
  // =========================================================================

  describe('color tokens', () => {
    it('should generate Color with argb_hex format', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorFormat: 'argb_hex',
      })

      expect(content).toContain('import androidx.compose.ui.graphics.Color')
      expect(content).toContain('Color(0xFF')
    })

    it('should generate Color with argb_float format', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorFormat: 'argb_float',
      })

      expect(content).toContain('Color(1f, 0f, 0f, 1f)')
    })

    it('should accept legacy argb8 alias', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorFormat: 'argb8',
      })

      expect(content).toContain('Color(0xFF')
    })

    it('should accept legacy argb_floats alias', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorFormat: 'argb_floats',
      })

      expect(content).toContain('Color(1f, 0f, 0f, 1f)')
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
        ...defaultOptions,
        colorFormat: 'argb_hex',
      })

      expect(content).toContain('Color(0x')
      expect(content).not.toContain('Color(0xFF000000)')
    })
  })

  // =========================================================================
  // Color space
  // =========================================================================

  describe('colorSpace', () => {
    it('should use sRGB by default', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).not.toContain('ColorSpaces')
    })

    it('should generate Display P3 colors with colorSpace option', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorSpace: 'displayP3',
      })

      expect(content).toContain('import androidx.compose.ui.graphics.colorspace.ColorSpaces')
      expect(content).toContain('ColorSpaces.DisplayP3)')
    })

    it('should use float format for displayP3 regardless of colorFormat', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        colorFormat: 'argb_hex',
        colorSpace: 'displayP3',
      })

      // P3 requires float format even when argb_hex is set
      expect(content).toMatch(/Color\([0-9.]+f,/)
      expect(content).toContain('ColorSpaces.DisplayP3')
    })
  })

  // =========================================================================
  // Dimension tokens
  // =========================================================================

  describe('dimension tokens', () => {
    it('should generate Dp values', async () => {
      const tokens: ResolvedTokens = {
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.unit.dp')
      expect(content).toContain('import androidx.compose.ui.unit.Dp')
      expect(content).toContain('8.dp')
    })

    it('should convert rem to dp (1rem = 16dp)', async () => {
      const tokens: ResolvedTokens = {
        'spacing.md': makeToken('spacing.md', { value: 1, unit: 'rem' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('16.dp')
    })
  })

  // =========================================================================
  // Font tokens
  // =========================================================================

  describe('font tokens', () => {
    it('should generate FontFamily values for built-in families', async () => {
      const tokens: ResolvedTokens = {
        'font.sans': makeToken('font.sans', ['sans-serif'], 'fontFamily'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.text.font.FontFamily')
      expect(content).toContain('FontFamily.SansSerif')
    })

    it('should map built-in font families', async () => {
      const tokens: ResolvedTokens = {
        'font.mono': makeToken('font.mono', ['monospace'], 'fontFamily'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('FontFamily.Monospace')
    })

    it('should generate TODO comment for custom font families', async () => {
      const tokens: ResolvedTokens = {
        'font.custom': makeToken('font.custom', ['Inter'], 'fontFamily'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('FontFamily.Default')
      expect(content).toContain('// TODO: load "Inter" via Font(R.font.inter)')
    })

    it('should convert custom font name to resource name format', async () => {
      const tokens: ResolvedTokens = {
        'font.display': makeToken('font.display', ['Open Sans'], 'fontFamily'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('Font(R.font.open_sans)')
    })
  })

  // =========================================================================
  // Font weight tokens
  // =========================================================================

  describe('font weight tokens', () => {
    it('should map numeric weights to FontWeight', async () => {
      const tokens: ResolvedTokens = {
        'weight.bold': makeToken('weight.bold', 700, 'fontWeight'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.text.font.FontWeight')
      expect(content).toContain('FontWeight.Bold')
    })

    it('should map named weights to FontWeight', async () => {
      const tokens: ResolvedTokens = {
        'weight.light': makeToken('weight.light', 'light', 'fontWeight'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('FontWeight.Light')
    })
  })

  // =========================================================================
  // Duration tokens
  // =========================================================================

  describe('duration tokens', () => {
    it('should generate Kotlin Duration values', async () => {
      const tokens: ResolvedTokens = {
        'animation.fast': makeToken('animation.fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import kotlin.time.Duration')
      expect(content).toContain('import kotlin.time.Duration.Companion.milliseconds')
      expect(content).toContain('200.milliseconds')
    })

    it('should handle seconds unit', async () => {
      const tokens: ResolvedTokens = {
        'animation.slow': makeToken('animation.slow', { value: 1, unit: 's' }, 'duration'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('1.seconds')
    })
  })

  // =========================================================================
  // Shadow tokens
  // =========================================================================

  describe('shadow tokens', () => {
    it('should generate ShadowToken with all fields', async () => {
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

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/val md: ShadowToken = ShadowToken\(/)
      expect(content).toContain('elevation = 8.dp')
      expect(content).toContain('offsetX = 0.dp')
      expect(content).toContain('offsetY = 4.dp')
      expect(content).toContain('color = Color(')
    })

    it('should emit @Immutable data class for ShadowToken', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken('shadow.sm', { blur: { value: 4, unit: 'px' } }, 'shadow'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('@Immutable')
      expect(content).toContain('data class ShadowToken(')
      expect(content).toContain('val color: Color,')
      expect(content).toContain('val elevation: Dp,')
      expect(content).toContain('val offsetX: Dp,')
      expect(content).toContain('val offsetY: Dp,')
    })

    it('should import Immutable annotation for shadow tokens', async () => {
      const tokens: ResolvedTokens = {
        'shadow.sm': makeToken('shadow.sm', { blur: { value: 4, unit: 'px' } }, 'shadow'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.runtime.Immutable')
    })

    it('should not emit ShadowToken class when no shadow tokens', async () => {
      const tokens: ResolvedTokens = {
        'color.red': makeToken('color.red', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).not.toContain('ShadowToken')
      expect(content).not.toContain('@Immutable')
    })
  })

  // =========================================================================
  // Border tokens
  // =========================================================================

  describe('border tokens', () => {
    it('should generate BorderStroke values', async () => {
      const tokens: ResolvedTokens = {
        'border.thin': makeToken(
          'border.thin',
          {
            width: { value: 1, unit: 'px' },
            color: { colorSpace: 'srgb', components: [0.8, 0.8, 0.8] },
            style: 'solid',
          },
          'border',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.foundation.BorderStroke')
      expect(content).toMatch(/val thin: BorderStroke = BorderStroke\(1\.dp, Color\(/)
    })

    it('should handle border with no valid width/color', async () => {
      const tokens: ResolvedTokens = {
        'border.none': makeToken('border.none', {}, 'border'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('BorderStroke(0.dp, Color.Unspecified)')
    })
  })

  // =========================================================================
  // Typography tokens
  // =========================================================================

  describe('typography tokens', () => {
    it('should generate TextStyle values', async () => {
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

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.text.TextStyle')
      expect(content).toContain('TextStyle(')
      expect(content).toContain('fontSize = 32.sp')
      expect(content).toContain('fontWeight = FontWeight.Bold')
    })

    it('should respect indent option for TextStyle formatting', async () => {
      const tokens: ResolvedTokens = {
        'typography.heading': makeToken(
          'typography.heading',
          { fontSize: { value: 32, unit: 'px' }, fontWeight: 700 },
          'typography',
        ),
      }

      const content2 = await getContent(renderer, tokens, { ...defaultOptions, indent: 2 })
      const content4 = await getContent(renderer, tokens, { ...defaultOptions, indent: 4 })

      expect(content2).toMatch(/^ {6}fontSize/m)
      expect(content4).toMatch(/^ {12}fontSize/m)
    })
  })

  // =========================================================================
  // CubicBezier tokens
  // =========================================================================

  describe('cubicBezier tokens', () => {
    it('should generate CubicBezierEasing values', async () => {
      const tokens: ResolvedTokens = {
        'easing.easeOut': makeToken('easing.easeOut', [0.0, 0.0, 0.58, 1.0], 'cubicBezier'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.animation.core.CubicBezierEasing')
      expect(content).toContain('CubicBezierEasing(0f, 0f, 0.58f, 1f)')
    })
  })

  // =========================================================================
  // Options
  // =========================================================================

  describe('options', () => {
    it('should require packageName', async () => {
      const tokens: ResolvedTokens = {}

      const context = buildContext(
        tokens,
        { packageName: undefined } as unknown as AndroidRendererOptions,
        renderer,
      )
      await expect(
        renderer.format(context, { packageName: undefined } as unknown as AndroidRendererOptions),
      ).rejects.toThrow('packageName is required')
    })

    it('should use custom objectName', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        objectName: 'AppTheme',
      })

      expect(content).toContain('object AppTheme')
      expect(content).not.toContain('DesignTokens')
    })
  })

  // =========================================================================
  // Standalone preset
  // =========================================================================

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
        name: 'android',
        renderer,
        file: 'Tokens-{theme}.kt',
        options: { ...defaultOptions, preset: 'standalone' },
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

      const result = await renderer.format(
        context,
        context.output.options as AndroidRendererOptions,
      )

      expect(isOutputTree(result)).toBe(true)
      if (isOutputTree(result)) {
        expect(Object.keys(result.files)).toHaveLength(2)
        expect(result.files['Tokens-light.kt']).toBeDefined()
        expect(result.files['Tokens-dark.kt']).toBeDefined()
      }
    })
  })

  // =========================================================================
  // Bundle preset
  // =========================================================================

  describe('bundle preset', () => {
    it('should combine permutations into a single file', async () => {
      const lightTokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [0, 0.4, 1] },
          'color',
        ),
      }

      const darkTokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [0.4, 0.7, 1] },
          'color',
        ),
      }

      const output: OutputConfig = {
        name: 'android',
        renderer,
        file: 'Tokens.kt',
        options: { ...defaultOptions, preset: 'bundle' },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: mockResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = await renderer.format(
        context,
        context.output.options as AndroidRendererOptions,
      )

      expect(isOutputTree(result)).toBe(true)
      if (isOutputTree(result)) {
        expect(Object.keys(result.files)).toHaveLength(1)
        const content = Object.values(result.files)[0]!
        expect(content).toContain('object DesignTokens')
        expect(content).toContain('object Light')
        expect(content).toContain('object Dark')
      }
    })

    it('should use flat structure in bundle mode when configured', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const output: OutputConfig = {
        name: 'android',
        renderer,
        file: 'Tokens.kt',
        options: { ...defaultOptions, preset: 'bundle', structure: 'flat' },
      }

      const context: RenderContext = {
        permutations: [{ tokens, modifierInputs: { theme: 'light' } }],
        output,
        resolver: mockResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = await renderer.format(
        context,
        context.output.options as AndroidRendererOptions,
      )

      if (isOutputTree(result)) {
        const content = Object.values(result.files)[0]!
        expect(content).toContain('object Light')
        expect(content).toContain('object Colors')
      }
    })
  })

  // =========================================================================
  // Visibility
  // =========================================================================

  describe('visibility', () => {
    it('should add public modifier when visibility is public', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        visibility: 'public',
      })

      expect(content).toContain('public object DesignTokens')
      expect(content).toContain('public object Color')
      expect(content).toContain('public val primary')
    })

    it('should add internal modifier when visibility is internal', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        visibility: 'internal',
      })

      expect(content).toContain('internal object DesignTokens')
      expect(content).toContain('internal object Color')
      expect(content).toContain('internal val primary')
    })

    it('should omit visibility modifier by default (public in Kotlin)', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/^@Suppress/m)
      expect(content).toMatch(/^object DesignTokens/m)
      expect(content).not.toContain('public object')
      expect(content).not.toContain('internal object')
    })

    it('should apply visibility at all nesting depths', async () => {
      const tokens: ResolvedTokens = {
        'color.blue.400': makeToken(
          'color.blue.400',
          { colorSpace: 'srgb', components: [0.5, 0.7, 1] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, {
        ...defaultOptions,
        visibility: 'public',
      })

      expect(content).toContain('public object DesignTokens')
      expect(content).toContain('public object Color')
      expect(content).toContain('public object Blue')
      expect(content).toContain('public val _400')
    })
  })

  // =========================================================================
  // Imports
  // =========================================================================

  describe('imports', () => {
    it('should always use androidx.compose imports', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.graphics.Color')
    })

    it('should only import types that are actually used', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.graphics.Color')
      expect(content).not.toContain('import androidx.compose.ui.unit.dp')
      expect(content).not.toContain('import androidx.compose.ui.text.TextStyle')
      expect(content).not.toContain('import kotlin.time')
    })

    it('should import Dp type for dimension tokens', async () => {
      const tokens: ResolvedTokens = {
        'spacing.sm': makeToken('spacing.sm', { value: 8, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.ui.unit.Dp')
      expect(content).toContain('import androidx.compose.ui.unit.dp')
    })

    it('should import Duration base type for duration tokens', async () => {
      const tokens: ResolvedTokens = {
        'animation.fast': makeToken('animation.fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import kotlin.time.Duration')
      expect(content).toContain('import kotlin.time.Duration.Companion.milliseconds')
    })

    it('should import BorderStroke for border tokens', async () => {
      const tokens: ResolvedTokens = {
        'border.thin': makeToken(
          'border.thin',
          { width: { value: 1, unit: 'px' }, color: { colorSpace: 'srgb', components: [0, 0, 0] } },
          'border',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('import androidx.compose.foundation.BorderStroke')
    })
  })

  // =========================================================================
  // Indentation
  // =========================================================================

  describe('indent', () => {
    it('should use 2-space indentation', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens, { ...defaultOptions, indent: 2 })

      expect(content).toMatch(/^ {2}object Color/m)
      expect(content).toMatch(/^ {4}val primary/m)
    })

    it('should default to 4-space indentation', async () => {
      const tokens: ResolvedTokens = {
        'color.primary': makeToken(
          'color.primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toMatch(/^ {4}object Color/m)
      expect(content).toMatch(/^ {8}val primary/m)
    })
  })

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle empty tokens', async () => {
      const content = await getContent(renderer, {})

      expect(content).toContain('object DesignTokens')
      expect(content).toContain('package com.example.tokens')
    })

    it('should escape Kotlin keywords in identifiers', async () => {
      const tokens: ResolvedTokens = {
        'number.val': makeToken('number.val', 42, 'number'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('`val`')
    })

    it('should handle tokens starting with digits', async () => {
      const tokens: ResolvedTokens = {
        'spacing.4': makeToken('spacing.4', { value: 16, unit: 'px' }, 'dimension'),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('_4')
    })

    it('should generate valid Kotlin identifiers from kebab-case names', async () => {
      const tokens: ResolvedTokens = {
        'color.brand-primary': makeToken(
          'color.brand-primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('brandPrimary')
      expect(content).not.toContain('brand-primary')
    })

    it('should handle deeply nested token paths', async () => {
      const tokens: ResolvedTokens = {
        'color.alias.accent.background.default': makeToken(
          'color.alias.accent.background.default',
          { colorSpace: 'srgb', components: [0.2, 0.4, 1] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('object Color')
      expect(content).toContain('object Alias')
      expect(content).toContain('object Accent')
      expect(content).toContain('object Background')
      expect(content).toMatch(/val default: Color =/)
    })

    it('should not produce duplicate val names within the same object scope', async () => {
      const tokens: ResolvedTokens = {
        'color.red.500': makeToken(
          'color.red.500',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
        'color.blue.500': makeToken(
          'color.blue.500',
          { colorSpace: 'srgb', components: [0, 0, 1] },
          'color',
        ),
      }

      const content = await getContent(renderer, tokens)

      expect(content).toContain('object Red')
      expect(content).toContain('object Blue')

      const lines = content.split('\n')
      const scopeStack: string[] = []
      const valsByScope = new Map<string, Set<string>>()

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.includes('object ') && trimmed.endsWith('{')) {
          const objName = trimmed.replace(/.*object\s+/, '').replace(/\s*\{/, '')
          scopeStack.push(objName)
        } else if (trimmed === '}') {
          scopeStack.pop()
        } else if (trimmed.includes('val ')) {
          const scopeKey = scopeStack.join('.')
          const valName = trimmed.replace(/.*val\s+/, '').replace(/[:\s].*/, '')
          const scopeVals = valsByScope.get(scopeKey) ?? new Set()
          expect(scopeVals.has(valName)).toBe(false)
          scopeVals.add(valName)
          valsByScope.set(scopeKey, scopeVals)
        }
      }
    })
  })
})
