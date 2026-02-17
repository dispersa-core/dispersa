import { readFileSync } from 'node:fs'

import { defineConfig } from 'tsup'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
})
