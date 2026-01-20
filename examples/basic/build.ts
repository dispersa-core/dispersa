#!/usr/bin/env tsx

/**
 * Basic Example - Dispersa
 *
 * Demonstrates a simple token structure with:
 * - Base tokens (foundational values)
 * - Alias tokens (semantic references)
 * - Theme modifiers (light/dark)
 */

import { Dispersa, css } from 'dispersa'
import { colorToHex, nameKebabCase } from 'dispersa/transforms'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a Dispersa instance
const dispersa = new Dispersa({
  resolver: path.join(__dirname, 'tokens.resolver.json'),
  buildPath: path.join(__dirname, 'output'),
})

const result = await dispersa.build({
  outputs: [
    css({
      name: 'css',
      file: 'tokens.css',
      preset: 'bundle',
      preserveReferences: true,
      transforms: [nameKebabCase(), colorToHex()],
    }),
    css({
      name: 'css',
      file: 'tokens-mod.css',
      preset: 'standalone',
      selector: () => '[data-theme="bla"]',
      preserveReferences: true,
      transforms: [nameKebabCase(), colorToHex()],
    }),
  ],
})

if (result.success) {
  console.log('✅ Build successful!')
  console.log(`Generated ${result.outputs.length} file(s)`)
  console.log('\nOutput:')
  result.outputs.forEach((output) => {
    console.log(`  - ${output.path}`)
  })
} else {
  console.error('❌ Build failed')
  if (result.errors) {
    result.errors.forEach((error) => {
      console.error('  -', error.message)
    })
  }
  process.exit(1)
}
