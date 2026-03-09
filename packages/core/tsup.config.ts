import { defineConfig } from 'tsup'
import path from 'path'

const sharedExternal = [
  'ajv',
  'ajv-formats',
  'change-case',
  'culori',
  'fast-glob',
  'json-ptr',
  'prettier',
]

const pathAliases = {
  '@engine': path.resolve(__dirname, './src/engine'),
  '@outputs': path.resolve(__dirname, './src/outputs'),
  '@adapters': path.resolve(__dirname, './src/adapters'),
  '@shared': path.resolve(__dirname, './src/shared'),
  '@config': path.resolve(__dirname, './src/config'),
  '@tokens': path.resolve(__dirname, './src/tokens'),
  '@codegen': path.resolve(__dirname, './src/codegen'),
  '@processing': path.resolve(__dirname, './src/processing'),
  '@resolution': path.resolve(__dirname, './src/resolution'),
  '@validation': path.resolve(__dirname, './src/validation'),
  '@lint': path.resolve(__dirname, './src/lint'),
  '@cli': path.resolve(__dirname, './src/cli'),
}

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/processing/transforms/index.ts',
      'src/processing/filters/index.ts',
      'src/outputs/builders.ts',
      'src/outputs/index.ts',
      'src/processing/preprocessors/index.ts',
      'src/shared/errors/index.ts',
      'src/lint/index.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    external: sharedExternal,
    esbuildOptions(options) {
      options.alias = pathAliases
    },
  },
  {
    entry: ['src/cli/index.ts', 'src/cli/config.ts', 'src/cli/cli.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: false,
    external: [...sharedExternal, 'dispersa', 'jiti'],
    esbuildOptions(options) {
      options.alias = pathAliases
    },
  },
])
