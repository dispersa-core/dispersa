import { describe, expect, it } from 'vitest'

import type { ResolvedToken } from '@shared/token-types'
import {
  buildBlockComment,
  buildKotlinDeprecationAnnotation,
  buildModifierComment,
  buildSwiftDeprecationAttribute,
  buildTokenDeprecationComment,
  buildTokenDescriptionComment,
} from '@outputs/metadata'

describe('metadata utilities', () => {
  describe('buildTokenDescriptionComment', () => {
    it('returns undefined when token has no description', () => {
      const token = { $value: 'red', name: 'color.primary' } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'css')).toBeUndefined()
      expect(buildTokenDescriptionComment(token, 'js')).toBeUndefined()
      expect(buildTokenDescriptionComment(token, 'swift')).toBeUndefined()
      expect(buildTokenDescriptionComment(token, 'kotlin')).toBeUndefined()
    })

    it('returns CSS comment format', () => {
      const token = {
        $value: 'red',
        $description: 'Primary color',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'css')).toBe('/* Primary color */')
      expect(buildTokenDescriptionComment(token, 'tailwind')).toBe('/* Primary color */')
    })

    it('returns JS comment format', () => {
      const token = {
        $value: 'red',
        $description: 'Primary color',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'js')).toBe('// Primary color')
    })

    it('returns Swift doc comment format', () => {
      const token = {
        $value: 'red',
        $description: 'Primary color',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'swift')).toBe('/// Primary color')
    })

    it('returns Kotlin KDoc comment format', () => {
      const token = {
        $value: 'red',
        $description: 'Primary color',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'kotlin')).toBe('/** Primary color */')
    })

    it('sanitizes multi-line descriptions', () => {
      const token = {
        $value: 'red',
        $description: 'Primary\ncolor',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'js')).toBe('// Primary color')
    })

    it('escapes CSS comment terminators', () => {
      const token = {
        $value: 'red',
        $description: 'Test */ end',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDescriptionComment(token, 'css')).toBe('/* Test *\\/ end */')
    })
  })

  describe('buildTokenDeprecationComment', () => {
    it('returns undefined when token is not deprecated', () => {
      const token = { $value: 'red', name: 'color.primary' } as unknown as ResolvedToken
      expect(buildTokenDeprecationComment(token, 'css')).toBeUndefined()
      expect(buildTokenDeprecationComment(token, 'js')).toBeUndefined()
    })

    it('returns DEPRECATED for boolean deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: true,
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDeprecationComment(token, 'css')).toBe('/* DEPRECATED */')
      expect(buildTokenDeprecationComment(token, 'js')).toBe('// DEPRECATED')
      expect(buildTokenDeprecationComment(token, 'tailwind')).toBe('/* DEPRECATED */')
    })

    it('returns DEPRECATED: message for string deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: 'Use color.primary instead',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDeprecationComment(token, 'css')).toBe(
        '/* DEPRECATED: Use color.primary instead */',
      )
      expect(buildTokenDeprecationComment(token, 'js')).toBe(
        '// DEPRECATED: Use color.primary instead',
      )
      expect(buildTokenDeprecationComment(token, 'tailwind')).toBe(
        '/* DEPRECATED: Use color.primary instead */',
      )
      expect(buildTokenDeprecationComment(token, 'swift')).toBe(
        '/// DEPRECATED: Use color.primary instead',
      )
      expect(buildTokenDeprecationComment(token, 'kotlin')).toBe(
        '/** DEPRECATED: Use color.primary instead */',
      )
    })

    it('handles false deprecation as not deprecated', () => {
      const token = {
        $value: 'red',
        $deprecated: false,
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildTokenDeprecationComment(token, 'css')).toBeUndefined()
    })
  })

  describe('buildBlockComment', () => {
    it('returns key only when no description', () => {
      expect(buildBlockComment('Set: colors')).toBe('/* Set: colors */')
    })

    it('includes description when provided', () => {
      expect(buildBlockComment('Set: colors', 'Color palette')).toBe(
        '/* Set: colors */\n/* Color palette */',
      )
    })

    it('escapes */ in the description so the comment cannot be closed early', () => {
      expect(buildBlockComment('Set: colors', 'Glob: src/**/*.tokens.json')).toBe(
        '/* Set: colors */\n/* Glob: src/**\\/*.tokens.json */',
      )
    })
  })

  describe('buildModifierComment', () => {
    it('returns modifier context format', () => {
      expect(buildModifierComment('theme', 'dark')).toBe('/* Modifier: theme=dark */')
    })
  })

  describe('buildSwiftDeprecationAttribute', () => {
    it('returns undefined when not deprecated', () => {
      const token = { $value: 'red', name: 'color.primary' } as unknown as ResolvedToken
      expect(buildSwiftDeprecationAttribute(token)).toBeUndefined()
    })

    it('returns @available for boolean deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: true,
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildSwiftDeprecationAttribute(token)).toBe('@available(*, deprecated)')
    })

    it('returns @available with message for string deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: 'Use color.primary instead',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildSwiftDeprecationAttribute(token)).toBe(
        '@available(*, deprecated, message: "Use color.primary instead")',
      )
    })
  })

  describe('buildKotlinDeprecationAnnotation', () => {
    it('returns undefined when not deprecated', () => {
      const token = { $value: 'red', name: 'color.primary' } as unknown as ResolvedToken
      expect(buildKotlinDeprecationAnnotation(token)).toBeUndefined()
    })

    it('returns @Deprecated for boolean deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: true,
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildKotlinDeprecationAnnotation(token)).toBe('@Deprecated')
    })

    it('returns @Deprecated with message for string deprecation', () => {
      const token = {
        $value: 'red',
        $deprecated: 'Use color.primary instead',
        name: 'color.primary',
      } as unknown as ResolvedToken
      expect(buildKotlinDeprecationAnnotation(token)).toBe(
        '@Deprecated(message = "Use color.primary instead")',
      )
    })
  })
})
