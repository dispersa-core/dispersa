import { beforeEach, describe, expect, it } from 'vitest'

import { ResolverParser } from '../../../../src/adapters/filesystem/resolver-parser'
import { getFixturePath } from '../../../utils/test-helpers'

describe('ResolverParser', () => {
  let parser: ResolverParser

  beforeEach(() => {
    parser = new ResolverParser()
  })

  describe('parseFile()', () => {
    it('parses valid resolver document successfully', async () => {
      const resolverPath = getFixturePath('tokens.resolver.json')
      const resolver = await parser.parseFile(resolverPath)

      expect(resolver).toBeDefined()
      expect(resolver.version).toBe('2025.10')
      expect(resolver.name).toBe('Test Token Set')
    })

    it('validates resolver version from file', async () => {
      const resolverPath = getFixturePath('tokens.resolver.json')
      const resolver = await parser.parseFile(resolverPath)

      expect(resolver.version).toBe('2025.10')
    })

    it('parses sets structure correctly', async () => {
      const resolverPath = getFixturePath('tokens.resolver.json')
      const resolver = await parser.parseFile(resolverPath)

      expect(resolver.sets).toBeDefined()
      expect(resolver.sets?.base).toBeDefined()
      expect(resolver.sets?.semantic).toBeDefined()
      expect(resolver.sets?.base.sources).toHaveLength(6)
      expect(resolver.sets?.semantic.sources).toHaveLength(1)
    })

    it('parses modifiers with correct structure', async () => {
      const resolverPath = getFixturePath('tokens.resolver.json')
      const resolver = await parser.parseFile(resolverPath)

      expect(resolver.modifiers).toBeDefined()
      expect(resolver.modifiers?.theme).toBeDefined()
      expect(resolver.modifiers?.scale).toBeDefined()

      // Check theme modifier
      const themeModifier = resolver.modifiers?.theme
      expect(themeModifier?.default).toBe('light')
      expect(themeModifier?.contexts?.light).toBeDefined()
      expect(themeModifier?.contexts?.dark).toBeDefined()

      // Check scale modifier
      const scaleModifier = resolver.modifiers?.scale
      expect(scaleModifier?.default).toBe('tablet')
      expect(scaleModifier?.contexts?.mobile).toBeDefined()
      expect(scaleModifier?.contexts?.tablet).toBeDefined()
      expect(scaleModifier?.contexts?.desktop).toBeDefined()
    })

    it('parses resolution order array correctly', async () => {
      const resolverPath = getFixturePath('tokens.resolver.json')
      const resolver = await parser.parseFile(resolverPath)

      expect(resolver.resolutionOrder).toBeDefined()
      expect(resolver.resolutionOrder).toHaveLength(4)
    })
  })
})
