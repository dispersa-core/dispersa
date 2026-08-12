import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '../../../src/cli/cli'
import { getFixturePath } from '../../utils/test-helpers'

describe('Dispersa CLI', () => {
  it('builds from a TypeScript config', async () => {
    const tempDir = join(tmpdir(), `dispersa-cli-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })

    const tokensPath = join(tempDir, 'tokens.json')
    const resolverPath = join(tempDir, 'tokens.resolver.json')
    const configPath = join(tempDir, 'dispersa.config.ts')

    await writeFile(
      tokensPath,
      JSON.stringify(
        {
          color: {
            primary: {
              $type: 'color',
              $value: { colorSpace: 'srgb', components: [0, 0.5, 1] },
            },
          },
        },
        null,
        2,
      ),
      'utf8',
    )

    await writeFile(
      resolverPath,
      JSON.stringify(
        {
          version: '2025.10',
          sets: { base: { sources: [{ $ref: './tokens.json' }] } },
          resolutionOrder: [{ $ref: '#/sets/base' }],
        },
        null,
        2,
      ),
      'utf8',
    )

    await writeFile(
      configPath,
      [
        "import { json } from 'dispersa'",
        '',
        'export default {',
        "  resolver: './tokens.resolver.json',",
        "  buildPath: './dist',",
        '  outputs: [',
        "    json({ name: 'json', file: 'tokens.json', preset: 'standalone', structure: 'flat' }),",
        '  ],',
        '}',
        '',
      ].join('\n'),
      'utf8',
    )

    const stdout: string[] = []
    const stderr: string[] = []
    const code = await runCli(['build', '--config', configPath], {
      cwd: tempDir,
      io: {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      },
    })

    expect(code).toBe(0)
    expect(stdout.join('\n')).toContain('Build succeeded.')
    expect(stderr.length).toBe(0)

    await rm(tempDir, { recursive: true, force: true })
  })

  describe('lint reporting', () => {
    const resolverPath = getFixturePath('tokens.resolver.json')
    const resolverDir = dirname(resolverPath)

    afterEach(async () => {
      await rm(join(resolverDir, 'dist'), { recursive: true, force: true })
    })

    it('reports lint warnings via the captured io, not a raw console.warn', async () => {
      const stdout: string[] = []
      const stderr: string[] = []
      const code = await runCli(
        ['build', '--config', getFixturePath('build-lint-warning.config.ts')],
        {
          cwd: resolverDir,
          io: {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        },
      )

      expect(code).toBe(0)
      expect(stdout.join('\n')).toContain('Build succeeded.')
      expect(stdout.join('\n')).toMatch(/\d+ lint warning/)
      expect(stderr.length).toBe(0)
    })

    it('shows per-issue lint warning detail matching dispersa lint format with --verbose', async () => {
      const stdout: string[] = []
      const stderr: string[] = []
      const code = await runCli(
        ['build', '--config', getFixturePath('build-lint-warning.config.ts'), '--verbose'],
        {
          cwd: resolverDir,
          io: {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        },
      )

      expect(code).toBe(0)
      const output = stdout.join('\n')
      expect(output).toMatch(/⚠ warning: .* \[dispersa\/require-description\]/)
      expect(stderr.length).toBe(0)
    })

    it('shows per-issue lint error detail matching dispersa lint format with --verbose on failure', async () => {
      const stdout: string[] = []
      const stderr: string[] = []
      const code = await runCli(
        ['build', '--config', getFixturePath('build-lint-error.config.ts'), '--verbose'],
        {
          cwd: resolverDir,
          io: {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        },
      )

      expect(code).toBe(1)
      const output = stderr.join('\n')
      expect(output).toContain('Build failed.')
      expect(output).toContain('- [LINT]')
      expect(output).toMatch(/✖ error: .* \[dispersa\/require-description\]/)
    })
  })
})
