/**
 * @fileoverview Unit tests for enhanced Dispersa error classes
 *
 * Tests that error classes correctly format messages with suggestions
 * and available values for better developer experience.
 */

import { describe, expect, it } from 'vitest'

import {
  BasePermutationError,
  CircularReferenceError,
  ColorParseError,
  ConfigurationError,
  DimensionFormatError,
  DispersaError,
  FileOperationError,
  ModifierError,
  TokenReferenceError,
  ValidationError,
} from '../../../../src/shared/errors/index'

describe('DispersaError', () => {
  it('should set name and message', () => {
    const error = new DispersaError('test message')
    expect(error.name).toBe('DispersaError')
    expect(error.message).toBe('test message')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('TokenReferenceError', () => {
  it('should include reference name in message', () => {
    const error = new TokenReferenceError('color.primary')
    expect(error.name).toBe('TokenReferenceError')
    expect(error.referenceName).toBe('color.primary')
    expect(error.message).toContain('color.primary')
    expect(error.message).toContain('Token does not exist')
  })

  it('should default to empty suggestions', () => {
    const error = new TokenReferenceError('color.primary')
    expect(error.suggestions).toEqual([])
  })

  it('should include "Did you mean?" for a single suggestion', () => {
    const error = new TokenReferenceError('color.primery', ['color.primary'])
    expect(error.message).toContain('Did you mean "color.primary"?')
    expect(error.suggestions).toEqual(['color.primary'])
  })

  it('should include "Did you mean?" for multiple suggestions', () => {
    const error = new TokenReferenceError('color.prim', ['color.primary', 'color.primary.dark'])
    expect(error.message).toContain('Did you mean "color.primary" or "color.primary.dark"?')
  })

  it('should not add hint when suggestions are empty', () => {
    const error = new TokenReferenceError('totally.unknown', [])
    expect(error.message).not.toContain('Did you mean')
  })

  it('should allow custom message override', () => {
    const error = new TokenReferenceError('x', ['y'], 'Custom message')
    expect(error.message).toBe('Custom message')
  })

  it('should extend DispersaError', () => {
    const error = new TokenReferenceError('x')
    expect(error).toBeInstanceOf(DispersaError)
  })
})

describe('ModifierError', () => {
  it('should format invalid context message', () => {
    const error = new ModifierError('theme', 'neon')
    expect(error.name).toBe('ModifierError')
    expect(error.modifierName).toBe('theme')
    expect(error.contextValue).toBe('neon')
    expect(error.message).toContain("Invalid context 'neon'")
  })

  it('should format undefined modifier message', () => {
    const error = new ModifierError('thme')
    expect(error.message).toContain('Modifier not defined in resolver')
  })

  it('should include available contexts when provided', () => {
    const error = new ModifierError('theme', 'neon', ['light', 'dark', 'high-contrast'])
    expect(error.availableValues).toEqual(['light', 'dark', 'high-contrast'])
    expect(error.message).toContain('Available: light, dark, high-contrast.')
  })

  it('should include available modifier names when modifier is unknown', () => {
    const error = new ModifierError('thme', undefined, ['theme', 'platform'])
    expect(error.message).toContain('Available: theme, platform.')
    expect(error.message).toContain('Modifier not defined in resolver')
  })

  it('should handle empty available values', () => {
    const error = new ModifierError('theme', 'neon', [])
    expect(error.message).not.toContain('Available:')
  })

  it('should default to empty available values', () => {
    const error = new ModifierError('theme', 'neon')
    expect(error.availableValues).toEqual([])
  })

  it('should extend DispersaError', () => {
    const error = new ModifierError('theme')
    expect(error).toBeInstanceOf(DispersaError)
  })
})

describe('CircularReferenceError', () => {
  it('should include token name and reference path', () => {
    const error = new CircularReferenceError('color.bg', ['color.bg', 'color.surface', 'color.bg'])
    expect(error.tokenName).toBe('color.bg')
    expect(error.referencePath).toEqual(['color.bg', 'color.surface', 'color.bg'])
    expect(error.message).toContain('color.bg -> color.surface -> color.bg')
  })
})

describe('ValidationError', () => {
  it('should include error details', () => {
    const errors = [{ message: 'missing field', path: '/outputs' }, { message: 'invalid type' }]
    const error = new ValidationError('Config invalid', errors)
    expect(error.errors).toBe(errors)
    expect(error.message).toBe('Config invalid')
  })
})

describe('ColorParseError', () => {
  it('should include color value in message', () => {
    const error = new ColorParseError('not-a-color')
    expect(error.colorValue).toBe('not-a-color')
    expect(error.message).toContain('not-a-color')
  })
})

describe('DimensionFormatError', () => {
  it('should include dimension value in message', () => {
    const error = new DimensionFormatError('bad-dim')
    expect(error.dimensionValue).toBe('bad-dim')
    expect(error.message).toContain('bad-dim')
  })
})

describe('FileOperationError', () => {
  it('should include operation and file path', () => {
    const original = new Error('ENOENT')
    const error = new FileOperationError('read', '/path/to/file.json', original)
    expect(error.operation).toBe('read')
    expect(error.filePath).toBe('/path/to/file.json')
    expect(error.originalError).toBe(original)
    expect(error.message).toContain('read')
    expect(error.message).toContain('/path/to/file.json')
  })
})

describe('ConfigurationError', () => {
  it('should use provided message', () => {
    const error = new ConfigurationError('Bad config')
    expect(error.message).toBe('Bad config')
  })
})

describe('BasePermutationError', () => {
  it('should use default message', () => {
    const error = new BasePermutationError()
    expect(error.message).toContain('Base permutation determination failed')
  })

  it('should accept custom message', () => {
    const error = new BasePermutationError('Custom message')
    expect(error.message).toBe('Custom message')
  })
})
