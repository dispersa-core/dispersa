import { rm } from 'node:fs/promises'

import { afterEach, describe, expect, it } from 'vitest'

import { build, json, resolveTokens, type BuildConfig } from '../../../src/index'
import { colorToHex } from '@processing/transforms'
import { getFixturePath } from '../../utils/test-helpers'

describe('Build Types Configuration', () => {
  const resolverPath = getFixturePath('tokens.resolver.json')
  const testBuildPath = '/tmp/test-build-types-' + Date.now()

  afterEach(async () => {
    await rm(testBuildPath, { recursive: true, force: true })
  })

  it('writes a .d.ts file when types is configured', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      permutations: [{ theme: 'light', scale: 'tablet' }],
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
      types: {
        file: 'tokens.d.ts',
        includeValues: true,
      },
    }

    const result = await build(config)

    expect(result.success).toBe(true)
    const typesOutput = result.outputs.find((output) => output.name === 'types')
    expect(typesOutput).toBeDefined()
    expect(typesOutput!.path).toMatch(/tokens\.d\.ts$/)
    expect(typesOutput!.content).toContain('export type TokenName =')
    expect(typesOutput!.content).toContain('export type TokensValues = {')
  })

  it('emits nothing when types is omitted', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      permutations: [{ theme: 'light', scale: 'tablet' }],
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
    }

    const result = await build(config)

    expect(result.success).toBe(true)
    expect(result.outputs.find((output) => output.name === 'types')).toBeUndefined()
  })

  it('reflects DTCG object shapes even with global transforms configured', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      permutations: [{ theme: 'light', scale: 'tablet' }],
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
      transforms: [colorToHex()],
      types: {
        file: 'tokens.d.ts',
        includeValues: true,
      },
    }

    const result = await build(config)

    expect(result.success).toBe(true)
    const typesOutput = result.outputs.find((output) => output.name === 'types')
    expect(typesOutput).toBeDefined()
    expect(typesOutput!.content).toContain('"color.primitive.red": ColorValueObject')
    expect(typesOutput!.content).not.toContain('"color.primitive.red": string')
  })

  it('resolves the permutation given by types.modifierInputs', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
      types: {
        file: 'tokens.d.ts',
        modifierInputs: { theme: 'dark', scale: 'tablet' },
      },
    }

    const result = await build(config)

    expect(result.success).toBe(true)
    const typesOutput = result.outputs.find((output) => output.name === 'types')
    expect(typesOutput).toBeDefined()

    // The generated .d.ts must describe exactly the token set that an explicit
    // resolveTokens call for the same modifier inputs produces.
    const darkTokens = await resolveTokens(resolverPath, { theme: 'dark', scale: 'tablet' })
    for (const name of Object.keys(darkTokens)) {
      expect(typesOutput!.content).toContain(`"${name}"`)
    }
  })

  it('threads modifierInputs into the types resolution (invalid input fails the build)', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
      types: {
        file: 'tokens.d.ts',
        modifierInputs: { theme: 'nonexistent-theme' },
      },
    }

    const result = await build(config)

    expect(result.success).toBe(false)
    expect(result.outputs.find((output) => output.name === 'types')).toBeUndefined()
    const typesError = (result.errors ?? []).find((error) =>
      error.message.includes("Failed to build output 'types'"),
    )
    expect(typesError).toBeDefined()
  })

  it('honors TypeGeneratorOptions from the types config', async () => {
    const config: BuildConfig = {
      resolver: resolverPath,
      buildPath: testBuildPath,
      outputs: [
        json({ name: 'json', preset: 'standalone', structure: 'flat', file: 'tokens.json' }),
      ],
      types: {
        file: 'tokens.d.ts',
        exportType: 'interface',
        includeValues: true,
        moduleName: 'DesignTokens',
      },
    }

    const result = await build(config)

    expect(result.success).toBe(true)
    const typesOutput = result.outputs.find((output) => output.name === 'types')
    expect(typesOutput).toBeDefined()
    expect(typesOutput!.content).toContain('export interface DesignTokens {')
    expect(typesOutput!.content).toContain('export type DesignTokensValues = {')
  })
})
