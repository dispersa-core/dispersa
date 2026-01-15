import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/config.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  target: 'node18',
  clean: true,
})
