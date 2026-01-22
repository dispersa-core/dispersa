#!/usr/bin/env tsx

/**
 * Advanced Example - Dispersa Build Script
 *
 * This script demonstrates a comprehensive Dispersa setup with:
 * 1. Layered architecture (base → alias → modifiers)
 * 2. Multi-platform delivery (desktop, mobile)
 * 3. Multiple themes (light, dark, high-contrast, forest)
 * 4. Density modifiers (comfortable, compact)
 * 5. Component tokens (button, card)
 * 6. Output in multiple formats (CSS, JSON, JavaScript, Figma Variables)
 * 7. TypeScript type definitions
 * 8. Custom renderers
 * 9. Advanced output modes (bundle vs standalone)
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { RenderContext, Renderer, Dispersa, css, figma, js, json } from 'dispersa'
import { isAlias } from 'dispersa/filters'
import {
  colorToColorFunction,
  dimensionToPx,
  nameCamelCase,
  nameKebabCase,
} from 'dispersa/transforms'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Output directory
const outputDir = path.join(__dirname, 'output')

// Initialize Dispersa with default paths
const dispersa = new Dispersa({
  resolver: path.join(__dirname, 'tokens.resolver.json'),
  buildPath: outputDir,
})

async function build() {
  console.log('🔨 Dispersa - Building design tokens...\n')

  //clear output directory
  await fs.emptyDir(outputDir)

  const myRenderer = {
    name: 'my-renderer',
    format: (context: RenderContext, _options: any) => {
      const tokens = context.permutations[0]?.tokens
      return JSON.stringify(
        Object.entries(tokens).map(([name, token]: [string, any]) => {
          return {
            name: `${token.name}`,
            originalName: token.name,
            value: token.$value,
            altName: `${token.name}-alt`,
          }
        }),
        null,
        2,
      )
    },
  } as Renderer

  try {
    // Ensure output directory exists
    await fs.ensureDir(outputDir)

    // Build all permutations (theme × platform × density combinations)
    console.log('📦 Building all theme, platform, and density permutations...')
    const modifierSelector = (modifierName: string, context: string, isBase: boolean): string => {
      if (isBase) return ':root'
      return `:root[data-${modifierName}="${context}"]`
    }

    const result = await dispersa.build({
      // resolver and buildPath are inherited from constructor
      outputs: [
        {
          name: 'my-renderer',
          renderer: myRenderer,
          file: 'tokens.{theme}-{platform}-{density}.my-renderer.json',
          transforms: [nameCamelCase()],
        },
        css({
          name: 'css',
          file: 'tokens.css',
          preset: 'bundle',
          selector: modifierSelector,
          preserveReferences: true,
          transforms: [nameKebabCase(), dimensionToPx(), colorToColorFunction()],
        }),
        css({
          name: 'css-standalone',
          file: 'tokens-mod.css',
          preset: 'modifier',
          // selector: (modifierName, context, isBase, allInputs) => {
          //   if (isBase) return ':root'
          //   return `[data-${modifierName}="${context}"]`
          // },
          selector: modifierSelector,
          filters: [isAlias()],
          preserveReferences: false,
          transforms: [nameKebabCase(), dimensionToPx(), colorToColorFunction()],
        }),
        json({
          name: 'json',
          file: 'tokens-{theme}-{platform}-{density}.json', // Pattern-based filename for standalone mode
          preset: 'standalone',
          structure: 'flat', // Separate JSON file per theme
        }),
        js({
          name: 'js',
          file: 'tokens.js',
          preset: 'bundle',
          moduleName: 'tokens',
          structure: 'flat', // All themes in one JS module
          transforms: [nameCamelCase()],
        }),
        figma({
          name: 'figma',
          file: 'tokens-figma.json',
          collectionName: 'Design Tokens',
          modeMapping: { default: 'Default' },
          preserveReferences: true,
          // Note: Shadow tokens are automatically excluded by the renderer (not supported as Figma variables)
        }),
      ],
    })

    if (!result.success) {
      console.error('❌ Build failed with errors:')
      for (const error of result.errors || []) {
        console.error(`   ${error.message}`)
        if (error.path) {
          console.error(`   at ${error.path}`)
        }
      }
      process.exit(1)
    }

    console.log(`   ✅ Built ${result.outputs.length} files`)
    console.log(`   ℹ️  CSS & JS: bundled (all themes in one file)`)
    console.log(`   ℹ️  JSON & Figma: standalone (separate file per theme)`)

    // Generate TypeScript types (using light theme + desktop platform as base)
    console.log('\n📝 Generating TypeScript types...')
    const tokens = await dispersa.resolveTokens(path.join(__dirname, 'tokens.resolver.json'), {
      theme: 'light',
      platform: 'desktop',
      density: 'comfortable',
    })
    await dispersa.generateTypes(tokens, path.join(outputDir, 'tokens.d.ts'), {
      moduleName: 'DesignTokens',
    })
    console.log('   ✅ tokens.d.ts')

    // Print summary
    console.log('\n✅ Build completed successfully!\n')
    console.log('📄 Generated files:')
    const files = await fs.readdir(outputDir)
    const cssFiles = files.filter((f) => f.endsWith('.css')).sort()
    const jsFiles = files.filter((f) => f.endsWith('.js')).sort()
    const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.includes('figma')).sort()
    const figmaFiles = files.filter((f) => f.includes('figma') && f.endsWith('.json')).sort()
    const tsFiles = files.filter((f) => f.endsWith('.d.ts')).sort()

    if (cssFiles.length > 0) {
      console.log('\n   CSS:')
      cssFiles.forEach((f) => console.log(`   - output/${f}`))
    }

    if (jsFiles.length > 0 || jsonFiles.length > 0) {
      console.log('\n   Tokens:')
      if (jsFiles.length > 0) {
        jsFiles.forEach((f) => console.log(`   - output/${f}`))
      }
      if (jsonFiles.length > 0) {
        jsonFiles.forEach((f) => console.log(`   - output/${f}`))
      }
    }

    if (figmaFiles.length > 0) {
      console.log('\n   Figma Variables:')
      figmaFiles.forEach((f) => console.log(`   - output/${f}`))
    }

    if (tsFiles.length > 0) {
      console.log('\n   Types:')
      tsFiles.forEach((f) => console.log(`   - output/${f}`))
    }

    console.log('\n💡 Usage:')
    console.log('   CSS (bundled):')
    console.log('   <link rel="stylesheet" href="output/tokens.css">')
    console.log('   Switch themes with: <html data-theme="dark">')
    console.log('   Switch platform with: <html data-platform="mobile">')
    console.log('   Switch density with: <html data-density="compact">')
    console.log('')
    console.log('   JavaScript (bundled):')
    console.log('   import tokens from "./output/tokens.js"')
    console.log('   const darkTokens = tokens.Dark')
    console.log('')
    console.log('   JSON (standalone):')
    console.log(
      '   import lightTokens from "./output/tokens-theme-light-platform-desktop-density-comfortable.json"',
    )
    console.log(
      '   import compactTokens from "./output/tokens-theme-light-platform-desktop-density-compact.json"',
    )
    console.log('\n   View demo: open demo.html or run `pnpm start`\n')
  } catch (error) {
    console.error('\n❌ Build failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run the build
build()
