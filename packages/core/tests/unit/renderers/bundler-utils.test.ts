import { describe, expect, it } from 'vitest'

import {
  buildMetadata,
  buildStablePermutationKey,
  generatePermutationKey,
  normalizeModifierInputs,
  resolveBaseFileName,
  resolveMediaQuery,
  resolveSelector,
} from '../../../src/renderers/bundlers/utils'

describe('Bundler Utils - Selector and Media Query Resolution', () => {
  const mockModifierInputs = {
    theme: 'dark',
    platform: 'mobile',
  }

  describe('resolveSelector', () => {
    it('should return string selector as-is', () => {
      const result = resolveSelector('[data-custom]', 'theme', 'dark', false, mockModifierInputs)
      expect(result).toBe('[data-custom]')
    })

    it('should call function selector with correct parameters', () => {
      const selectorFn = (
        modifierName: string,
        context: string,
        isBase: boolean,
        allInputs: Record<string, string>,
      ) => {
        expect(modifierName).toBe('theme')
        expect(context).toBe('dark')
        expect(isBase).toBe(false)
        expect(allInputs).toEqual(mockModifierInputs)
        return `[data-${modifierName}="${context}"]`
      }

      const result = resolveSelector(selectorFn, 'theme', 'dark', false, mockModifierInputs)
      expect(result).toBe('[data-theme="dark"]')
    })

    it('should use default selector for base permutation', () => {
      const result = resolveSelector(undefined, 'theme', 'light', true, { theme: 'light' })
      expect(result).toBe(':root')
    })

    it('should use default selector for non-base permutation', () => {
      const result = resolveSelector(undefined, 'theme', 'dark', false, mockModifierInputs)
      expect(result).toBe('[data-theme="dark"]')
    })

    it('should support complex function-based selectors', () => {
      const selectorFn = (
        modifierName: string,
        context: string,
        isBase: boolean,
        allInputs: Record<string, string>,
      ) => {
        if (isBase) return ':root'
        // Create multi-attribute selector
        return Object.entries(allInputs)
          .map(([key, value]) => `[data-${key}="${value}"]`)
          .join('')
      }

      const result = resolveSelector(selectorFn, 'theme', 'dark', false, mockModifierInputs)
      expect(result).toBe('[data-theme="dark"][data-platform="mobile"]')
    })
  })

  describe('resolveMediaQuery', () => {
    it('should return string media query as-is', () => {
      const result = resolveMediaQuery(
        '(max-width: 768px)',
        'breakpoint',
        'mobile',
        false,
        mockModifierInputs,
      )
      expect(result).toBe('(max-width: 768px)')
    })

    it('should call function media query with correct parameters', () => {
      const mediaQueryFn = (
        modifierName: string,
        context: string,
        isBase: boolean,
        allInputs: Record<string, string>,
      ) => {
        expect(modifierName).toBe('breakpoint')
        expect(context).toBe('mobile')
        expect(isBase).toBe(false)
        expect(allInputs).toEqual(mockModifierInputs)
        return '(max-width: 768px)'
      }

      const result = resolveMediaQuery(
        mediaQueryFn,
        'breakpoint',
        'mobile',
        false,
        mockModifierInputs,
      )
      expect(result).toBe('(max-width: 768px)')
    })

    it('should return empty string for undefined media query', () => {
      const result = resolveMediaQuery(undefined, 'theme', 'dark', false, mockModifierInputs)
      expect(result).toBe('')
    })

    it('should support conditional media queries based on modifier', () => {
      const mediaQueryFn = (modifierName: string, context: string) => {
        if (modifierName === 'breakpoint') {
          if (context === 'mobile') return '(max-width: 768px)'
          if (context === 'tablet') return '(min-width: 769px) and (max-width: 1024px)'
          if (context === 'desktop') return '(min-width: 1025px)'
        }
        return ''
      }

      expect(
        resolveMediaQuery(mediaQueryFn, 'breakpoint', 'mobile', false, mockModifierInputs),
      ).toBe('(max-width: 768px)')
      expect(
        resolveMediaQuery(mediaQueryFn, 'breakpoint', 'tablet', false, mockModifierInputs),
      ).toBe('(min-width: 769px) and (max-width: 1024px)')
      expect(
        resolveMediaQuery(mediaQueryFn, 'breakpoint', 'desktop', false, mockModifierInputs),
      ).toBe('(min-width: 1025px)')
      expect(resolveMediaQuery(mediaQueryFn, 'theme', 'dark', false, mockModifierInputs)).toBe('')
    })

    it('should support complex function-based media queries', () => {
      const mediaQueryFn = (
        modifierName: string,
        context: string,
        isBase: boolean,
        allInputs: Record<string, string>,
      ) => {
        if (isBase) return ''

        // Combine multiple modifiers into media query
        const queries: string[] = []
        if (allInputs.breakpoint === 'mobile') {
          queries.push('(max-width: 768px)')
        }
        if (allInputs.theme === 'dark') {
          queries.push('(prefers-color-scheme: dark)')
        }
        return queries.join(' and ')
      }

      const result = resolveMediaQuery(mediaQueryFn, 'theme', 'dark', false, {
        theme: 'dark',
        breakpoint: 'mobile',
      })
      expect(result).toBe('(max-width: 768px) and (prefers-color-scheme: dark)')
    })
  })

  describe('resolveBaseFileName', () => {
    it('should replace single-modifier pattern with base', () => {
      const result = resolveBaseFileName('{theme}/tokens.css', { theme: 'light' })
      expect(result).toBe('base/tokens.css')
    })

    it('should collapse multi-modifier pattern to single base', () => {
      const result = resolveBaseFileName('{theme}-{platform}/tokens.css', {
        theme: 'light',
        platform: 'desktop',
      })
      expect(result).toBe('base/tokens.css')
    })

    it('should collapse three modifier patterns', () => {
      const result = resolveBaseFileName('{theme}-{platform}-{density}/tokens.css', {
        theme: 'light',
        platform: 'desktop',
        density: 'comfortable',
      })
      expect(result).toBe('base/tokens.css')
    })

    it('should collapse inline multi-modifier pattern', () => {
      const result = resolveBaseFileName('tokens-{theme}-{platform}.css', {
        theme: 'light',
        platform: 'desktop',
      })
      expect(result).toBe('tokens-base.css')
    })

    it('should collapse slash-separated multi-modifier pattern', () => {
      const result = resolveBaseFileName('{theme}/{platform}/tokens.css', {
        theme: 'light',
        platform: 'desktop',
      })
      expect(result).toBe('base/tokens.css')
    })

    it('should append -base to plain string filename', () => {
      const result = resolveBaseFileName('tokens-mod.css', { theme: 'light' })
      expect(result).toBe('tokens-mod-base.css')
    })

    it('should append -base to plain string without extension', () => {
      const result = resolveBaseFileName('tokens', { theme: 'light' })
      expect(result).toBe('tokens-base')
    })

    it('should call function with defaults and _base flag', () => {
      const fn = (inputs: Record<string, string>) => {
        if (inputs._base === 'true') return 'base/tokens.css'
        return `${inputs.theme}/tokens.css`
      }
      const result = resolveBaseFileName(fn, { theme: 'light' })
      expect(result).toBe('base/tokens.css')
    })

    it('should pass actual defaults to function (not synthetic values)', () => {
      const fn = (inputs: Record<string, string>) => {
        expect(inputs.theme).toBe('light')
        expect(inputs.platform).toBe('desktop')
        return `${inputs._base === 'true' ? 'base' : inputs.theme}/tokens.css`
      }
      const result = resolveBaseFileName(fn, { theme: 'light', platform: 'desktop' })
      expect(result).toBe('base/tokens.css')
    })
  })

  describe('Permutation Keys', () => {
    it('should build stable keys using dimension order', () => {
      const key = buildStablePermutationKey({ theme: 'dark', scale: 'mobile' }, ['theme', 'scale'])
      expect(key).toBe('theme=dark|scale=mobile')
    })

    it('should normalize inputs when generating keys', () => {
      const resolver = {
        version: '2025.10',
        modifiers: {
          Theme: {
            contexts: { Light: [], Dark: [] },
            default: 'Light',
          },
          Scale: {
            contexts: { Mobile: [], Desktop: [] },
            default: 'Mobile',
          },
        },
        resolutionOrder: [{ $ref: '#/modifiers/Theme' }],
      }

      const key = generatePermutationKey(
        { Theme: 'Dark', Scale: 'Desktop' },
        resolver as any,
        false,
      )
      expect(key).toBe('theme=dark|scale=desktop')
    })

    it('should avoid collisions when dimensions share the same values', () => {
      const metadata = buildMetadata({
        version: '2025.10',
        modifiers: {
          brand: { contexts: { dark: [], light: [] }, default: 'light' },
          theme: { contexts: { dark: [], light: [] }, default: 'light' },
        },
        resolutionOrder: [{ $ref: '#/modifiers/brand' }],
      } as any)
      const normalized = normalizeModifierInputs({ brand: 'dark', theme: 'dark' })
      const key = buildStablePermutationKey(normalized, metadata.dimensions)
      expect(key).toBe('brand=dark|theme=dark')
    })
  })
})
