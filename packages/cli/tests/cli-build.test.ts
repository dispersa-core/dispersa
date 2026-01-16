import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCli } from '../src/cli'

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
})
