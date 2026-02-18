import { describe, expect, it } from 'vitest'

import type { OutputConfig } from '../../../src/config'
import type { ResolverDocument } from '../../../src/resolution/types'
import { isOutputTree } from '../../../src/renderers'
import { TailwindRenderer } from '../../../src/renderers/tailwind'
import type { TailwindRendererOptions } from '../../../src/renderers/tailwind'
import type {
  MediaQueryFunction,
  RenderContext,
  SelectorFunction,
} from '../../../src/renderers/types'
import type {
  InternalResolvedToken,
  ResolvedToken,
  ResolvedTokens,
} from '../../../src/tokens/types'

const makeToken = (name: string, value: unknown, type?: string): ResolvedToken => ({
  $value: value,
  $type: type,
  path: name.split('.'),
  name,
  originalValue: value as string,
})

const makeInternalToken = (
  name: string,
  value: unknown,
  type: string,
  sourceModifier?: string,
): InternalResolvedToken => ({
  $value: value,
  $type: type,
  path: name.split('.'),
  name,
  originalValue: value as string,
  ...(sourceModifier ? { _sourceModifier: sourceModifier } : {}),
})

const mockResolver: ResolverDocument = {
  resolutionOrder: [],
}

const buildContext = (
  tokens: ResolvedTokens,
  options: TailwindRendererOptions,
  renderer: TailwindRenderer,
): RenderContext => {
  const output: OutputConfig = {
    name: 'tailwind',
    renderer,
    file: 'theme.css',
    options,
  }

  return {
    permutations: [{ tokens, modifierInputs: {} }],
    output,
    resolver: mockResolver,
    meta: { dimensions: [], defaults: {}, basePermutation: {} },
  }
}

describe('Tailwind CSS v4 Renderer', () => {
  const renderer = new TailwindRenderer()

  describe('color tokens', () => {
    it('should generate @theme with color variables', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: true }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('@theme')
      expect(result).toContain('--color-primary')
      expect(result).toContain('#ff0000')
    })

    it('should handle colors with alpha', async () => {
      const tokens: ResolvedTokens = {
        overlay: makeToken(
          'overlay',
          { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 },
          'color',
        ),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--color-overlay')
      // Should contain a hex8 value
      expect(typeof result).toBe('string')
    })
  })

  describe('dimension tokens', () => {
    it('should generate spacing variables', async () => {
      const tokens: ResolvedTokens = {
        sm: makeToken('sm', { value: 8, unit: 'px' }, 'dimension'),
        md: makeToken('md', { value: 1, unit: 'rem' }, 'dimension'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--spacing-sm')
      expect(result).toContain('8px')
      expect(result).toContain('--spacing-md')
      expect(result).toContain('1rem')
    })
  })

  describe('font tokens', () => {
    it('should generate font family variables', async () => {
      const tokens: ResolvedTokens = {
        sans: makeToken('sans', ['Inter', 'sans-serif'], 'fontFamily'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--font-sans')
      expect(result).toContain('Inter')
    })
  })

  describe('shadow tokens', () => {
    it('should generate shadow variables', async () => {
      const tokens: ResolvedTokens = {
        md: makeToken(
          'md',
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

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--shadow-md')
      expect(result).toContain('0px 4px 8px')
    })
  })

  describe('duration tokens', () => {
    it('should generate duration variables', async () => {
      const tokens: ResolvedTokens = {
        fast: makeToken('fast', { value: 200, unit: 'ms' }, 'duration'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--duration-fast')
      expect(result).toContain('200ms')
    })
  })

  describe('cubicBezier tokens', () => {
    it('should generate easing variables', async () => {
      const tokens: ResolvedTokens = {
        easeOut: makeToken('easeOut', [0.0, 0.0, 0.58, 1.0], 'cubicBezier'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--ease-easeOut')
      expect(result).toContain('cubic-bezier(0, 0, 0.58, 1)')
    })
  })

  describe('options', () => {
    it('should include @import when includeImport is true', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: true }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('@import "tailwindcss"')
    })

    it('should omit @import when includeImport is false', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).not.toContain('@import')
    })

    it('should support namespace option', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const context = buildContext(
        tokens,
        { preset: 'bundle', includeImport: false, namespace: 'ds' },
        renderer,
      )
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('@theme namespace(ds)')
    })

    it('should generate minified output', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const context = buildContext(
        tokens,
        { preset: 'bundle', includeImport: false, minify: true },
        renderer,
      )
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).not.toContain('\n  ')
      expect(result).toContain('@theme{')
    })
  })

  describe('presets', () => {
    it('should generate standalone output as OutputTree', async () => {
      const tokens: ResolvedTokens = {
        primary: makeToken('primary', { colorSpace: 'srgb', components: [1, 0, 0] }, 'color'),
      }

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme-{theme}.css',
        options: { preset: 'standalone' },
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
        context.output.options as TailwindRendererOptions,
      )

      expect(isOutputTree(result)).toBe(true)
      if (isOutputTree(result)) {
        expect(Object.keys(result.files)).toHaveLength(2)
        expect(result.files['theme-light.css']).toContain('@theme')
        expect(result.files['theme-dark.css']).toContain('@theme')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty tokens', async () => {
      const tokens: ResolvedTokens = {}

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('@theme')
      expect(result).toContain('}')
    })

    it('should handle tokens without a type', async () => {
      const tokens: ResolvedTokens = {
        custom: makeToken('custom', 'some-value'),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(result).toContain('--custom')
      expect(result).toContain('some-value')
    })

    it('should not double-prefix when name already matches type', async () => {
      const tokens: ResolvedTokens = {
        'color-primary': makeToken(
          'color-primary',
          { colorSpace: 'srgb', components: [1, 0, 0] },
          'color',
        ),
      }

      const context = buildContext(tokens, { preset: 'bundle', includeImport: false }, renderer)
      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      // Should NOT contain --color-color-primary
      expect(result).not.toContain('--color-color-primary')
      expect(result).toContain('--color-primary')
    })
  })

  describe('bundle mode with modifier overrides', () => {
    const modifierResolver: ResolverDocument = {
      resolutionOrder: [{ $ref: '#/sets/core' }, { $ref: '#/modifiers/theme' }],
      modifiers: {
        theme: {
          contexts: { light: [], dark: [] },
          default: 'light',
        },
      },
    }

    const lightTokens: Record<string, InternalResolvedToken> = {
      primary: makeInternalToken('primary', '#3b63fb', 'color', 'theme-light'),
      bg: makeInternalToken('bg', '#ffffff', 'color', 'theme-light'),
    }

    const darkTokens: Record<string, InternalResolvedToken> = {
      primary: makeInternalToken('primary', '#729efd', 'color', 'theme-dark'),
      bg: makeInternalToken('bg', '#1a1a1a', 'color', 'theme-dark'),
    }

    it('should output @theme block followed by modifier override block', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )

      expect(typeof result).toBe('string')
      const css = result as string

      // Should contain @theme block with base (light) values
      expect(css).toContain('@theme')
      expect(css).toContain('#3b63fb')
      expect(css).toContain('#ffffff')

      // Should contain modifier override block with dark values
      expect(css).toContain('/* Modifier: theme=dark */')
      expect(css).toContain('#729efd')
      expect(css).toContain('#1a1a1a')
    })

    it('should use default data-attribute selector for overrides', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      // Default selector for non-base: [data-theme="dark"]
      expect(result).toContain('[data-theme="dark"]')
    })

    it('should support custom string selector for overrides', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: {
          preset: 'bundle',
          includeImport: false,
          selector: '.dark-mode',
        },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('.dark-mode')
    })

    it('should support function-based selector for overrides', async () => {
      const selectorFn: SelectorFunction = (modifier, ctx, isBase) => {
        if (isBase) return ':root'
        return `[data-${modifier}="${ctx}"]`
      }

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: {
          preset: 'bundle',
          includeImport: false,
          selector: selectorFn,
        },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('[data-theme="dark"]')
    })

    it('should support mediaQuery for overrides', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: {
          preset: 'bundle',
          includeImport: false,
          mediaQuery: '(prefers-color-scheme: dark)',
          selector: ':root',
        },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@media (prefers-color-scheme: dark)')
      expect(result).toContain(':root')
    })

    it('should only include changed tokens in override block', async () => {
      // Light tokens: shared base + light-specific
      const lightPerms: Record<string, InternalResolvedToken> = {
        primary: makeInternalToken('primary', '#3b63fb', 'color', 'theme-light'),
        spacing: makeInternalToken('spacing', '8px', 'dimension'),
      }

      // Dark tokens: only primary changes, spacing has no _sourceModifier for dark
      const darkPerms: Record<string, InternalResolvedToken> = {
        primary: makeInternalToken('primary', '#729efd', 'color', 'theme-dark'),
        spacing: makeInternalToken('spacing', '8px', 'dimension'),
      }

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightPerms as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkPerms as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      // The @theme block should have both tokens
      expect(result).toContain('@theme')

      // The override block should only have the dark primary, not spacing
      const overrideSection = result.split('/* Modifier:')[1] ?? ''
      expect(overrideSection).toContain('#729efd')
      expect(overrideSection).not.toContain('8px')
    })

    it('should output only @theme when there is a single permutation', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@theme')
      expect(result).not.toContain('/* Modifier:')
    })
  })

  describe('@custom-variant auto-derivation', () => {
    const modifierResolver: ResolverDocument = {
      resolutionOrder: [{ $ref: '#/sets/core' }, { $ref: '#/modifiers/theme' }],
      modifiers: {
        theme: {
          contexts: { light: [], dark: [] },
          default: 'light',
        },
      },
    }

    const lightTokens: Record<string, InternalResolvedToken> = {
      primary: makeInternalToken('primary', '#3b63fb', 'color', 'theme-light'),
    }

    const darkTokens: Record<string, InternalResolvedToken> = {
      primary: makeInternalToken('primary', '#729efd', 'color', 'theme-dark'),
    }

    it('should auto-emit @custom-variant for non-base modifier with default selector', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain(
        '@custom-variant theme-dark (&:where([data-theme="dark"], [data-theme="dark"] *));',
      )
    })

    it('should use selector from custom selector function', async () => {
      const selectorFn: SelectorFunction = (_modifier, ctx, isBase) => {
        if (isBase) return ':root'
        return `.${ctx}-mode`
      }

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false, selector: selectorFn },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@custom-variant theme-dark (&:where(.dark-mode, .dark-mode *));')
    })

    it('should use media query syntax when mediaQuery is configured', async () => {
      const mediaQueryFn: MediaQueryFunction = (_modifier, _ctx) => '(prefers-color-scheme: dark)'

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: {
          preset: 'bundle',
          includeImport: false,
          mediaQuery: mediaQueryFn,
          selector: ':root',
        },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@custom-variant theme-dark (@media (prefers-color-scheme: dark));')
    })

    it('should not emit @custom-variant for single-permutation builds', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).not.toContain('@custom-variant')
    })

    it('should produce multiple @custom-variant lines for multiple modifier dimensions', async () => {
      const multiResolver: ResolverDocument = {
        resolutionOrder: [],
        modifiers: {
          theme: { contexts: { light: [], dark: [] }, default: 'light' },
          contrast: { contexts: { normal: [], high: [] }, default: 'normal' },
        },
      }

      const baseTokens: Record<string, InternalResolvedToken> = {
        primary: makeInternalToken('primary', '#3b63fb', 'color', 'theme-light'),
      }

      const darkVariant: Record<string, InternalResolvedToken> = {
        primary: makeInternalToken('primary', '#729efd', 'color', 'theme-dark'),
      }

      const highContrastVariant: Record<string, InternalResolvedToken> = {
        primary: makeInternalToken('primary', '#0000ff', 'color', 'contrast-high'),
      }

      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false },
      }

      const context: RenderContext = {
        permutations: [
          {
            tokens: baseTokens as unknown as ResolvedTokens,
            modifierInputs: { theme: 'light', contrast: 'normal' },
          },
          {
            tokens: darkVariant as unknown as ResolvedTokens,
            modifierInputs: { theme: 'dark', contrast: 'normal' },
          },
          {
            tokens: highContrastVariant as unknown as ResolvedTokens,
            modifierInputs: { theme: 'light', contrast: 'high' },
          },
        ],
        output,
        resolver: multiResolver,
        meta: {
          dimensions: ['theme', 'contrast'],
          defaults: { theme: 'light', contrast: 'normal' },
          basePermutation: { theme: 'light', contrast: 'normal' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@custom-variant theme-dark')
      expect(result).toContain('@custom-variant contrast-high')
    })

    it('should emit @custom-variant with minify: true', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: false, minify: true },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      expect(result).toContain('@custom-variant theme-dark')
      expect(result).toContain('@theme{')
    })

    it('should place @custom-variant after @import and before @theme', async () => {
      const output: OutputConfig = {
        name: 'tailwind',
        renderer,
        file: 'theme.css',
        options: { preset: 'bundle', includeImport: true },
      }

      const context: RenderContext = {
        permutations: [
          { tokens: lightTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'light' } },
          { tokens: darkTokens as unknown as ResolvedTokens, modifierInputs: { theme: 'dark' } },
        ],
        output,
        resolver: modifierResolver,
        meta: {
          dimensions: ['theme'],
          defaults: { theme: 'light' },
          basePermutation: { theme: 'light' },
        },
      }

      const result = (await renderer.format(
        context,
        context.output.options as TailwindRendererOptions,
      )) as string

      const importIndex = result.indexOf('@import "tailwindcss"')
      const variantIndex = result.indexOf('@custom-variant theme-dark')
      const themeIndex = result.indexOf('@theme')

      expect(importIndex).toBeLessThan(variantIndex)
      expect(variantIndex).toBeLessThan(themeIndex)
    })
  })
})
