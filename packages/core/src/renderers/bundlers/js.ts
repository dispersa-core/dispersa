/**
 * @fileoverview JavaScript module bundler for multi-theme output
 */

import type { ResolverDocument } from '@lib/resolution/resolution.types'
import type { ResolvedTokens } from '@lib/tokens/types'
import type { JsModuleRendererOptions } from '@renderers/types'
import { ConfigurationError } from '@shared/errors/index'

import type { BundleDataItem } from './types'
import { buildMetadata, normalizeModifierInputs, stripInternalMetadata } from './utils'

/**
 * Extract object literal from formatted JS module using balanced brace matching
 * More robust than regex for handling nested objects/arrays
 */
function extractObjectFromJsModule(formattedJs: string): string {
  // Find the start of the object assignment: "const name = {"
  const assignmentMatch = /const\s+\w+\s*=\s*\{/.exec(formattedJs)
  if (!assignmentMatch) {
    return '{}'
  }

  const startIndex = assignmentMatch.index + assignmentMatch[0].length - 1 // Include the opening brace
  let braceCount = 0
  let inString = false
  let stringChar = ''
  let escaped = false

  for (let i = startIndex; i < formattedJs.length; i++) {
    const char = formattedJs[i]

    // Handle string literals (ignore braces inside strings)
    if (!escaped && (char === '"' || char === "'" || char === '`')) {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
    }

    // Track escape sequences
    escaped = !escaped && char === '\\'

    // Count braces when not in a string
    if (!inString) {
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          // Found the matching closing brace
          return formattedJs.substring(startIndex, i + 1)
        }
      }
    }
  }

  // Fallback if no matching brace found
  return '{}'
}

function toCamelKey(key: string): string {
  if (key === '') {
    return ''
  }
  return key
    .split('-')
    .filter((part) => part !== '')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')
}

function buildStableDashKey(params: {
  modifierInputs: Record<string, string>
  dimensions: string[]
  defaults: Record<string, string>
}): string {
  const { modifierInputs, dimensions, defaults } = params
  const inputs = normalizeModifierInputs(modifierInputs)

  return dimensions
    .map((dimension) => {
      const value = inputs[dimension] ?? defaults[dimension] ?? ''
      return String(value)
    })
    .join('-')
}

/**
 * Bundle tokens as JS module with metadata and optional helper
 *
 * JS-specific strategy: All combinations for dynamic theming
 * - Includes metadata with dimensions and defaults
 * - All permutations included (no filtering)
 * - Optional helper function for key generation
 */
export async function bundleAsJsModule(
  bundleData: BundleDataItem[],
  resolver: ResolverDocument,
  options: JsModuleRendererOptions | undefined,
  formatTokens?: (tokens: ResolvedTokens) => Promise<string>,
): Promise<string> {
  // Build metadata
  const metadata = buildMetadata(resolver)

  // Build tokens object
  const jsBlocks: string[] = []

  for (const { tokens, modifierInputs } of bundleData) {
    // Strip internal metadata before formatting
    const cleanTokens = stripInternalMetadata(tokens)

    // Stable key in metadata dimension order (avoids Object.values insertion-order dependence)
    const key = buildStableDashKey({
      modifierInputs,
      dimensions: metadata.dimensions,
      defaults: metadata.defaults,
    })
    // Convert to camelCase for JS object keys (kept for backward compatibility)
    const camelKey = toCamelKey(key)

    // Extract modifier info
    if (!formatTokens) {
      throw new ConfigurationError('JS formatter was not provided')
    }

    // Format tokens using the renderer (respects structure, minify, etc.)
    const formattedJs = await formatTokens(cleanTokens)

    // Extract the token object from formatted JS using balanced brace matching
    // Handles nested objects/arrays correctly unlike regex
    const tokenObject = extractObjectFromJsModule(formattedJs)

    const comment = `  // ${key}`
    // Indent the extracted object to fit within the bundle structure
    const indentedObject = tokenObject.replace(/\n/g, '\n  ')
    // Always quote keys to avoid invalid identifiers (e.g., keys starting with digits)
    jsBlocks.push(`${comment}\n  ${JSON.stringify(camelKey)}: ${indentedObject}`)
  }

  // Check if helper function should be generated
  // The generateHelper option is part of JsModuleRendererOptions but not on OutputConfig
  // Check if it exists on the output config
  const generateHelper = options?.generateHelper ?? false

  // Build the output
  let outputContent = `const tokenBundle = {\n`
  outputContent += `  _meta: ${JSON.stringify(metadata, null, 2).replace(/\n/g, '\n  ')},\n`
  outputContent += `  tokens: {\n${jsBlocks.join(',\n')}\n  }\n`
  outputContent += `}\n\n`

  // Add helper function if requested
  if (generateHelper) {
    const dimensionOrder = metadata.dimensions.map((d) => JSON.stringify(d)).join(', ')
    outputContent += `/**\n`
    outputContent += ` * Get tokens for a specific modifier combination\n`
    outputContent += ` * @param {Object} modifiers - Modifier values (e.g., { theme: 'dark', brand: 'partner-a' })\n`
    outputContent += ` * @returns {Object} Resolved tokens for the combination\n`
    outputContent += ` */\n`
    outputContent += `export function getTokens(modifiers = {}) {\n`
    outputContent += `  const key = [${dimensionOrder}]\n`
    outputContent += `    .map(dim => modifiers[dim] || tokenBundle._meta.defaults[dim])\n`
    outputContent += `    .join('-')\n`
    outputContent += `  const camelKey = key\n`
    outputContent += `    .split('-')\n`
    outputContent += `    .filter(Boolean)\n`
    outputContent += `    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))\n`
    outputContent += `    .join('')\n`
    outputContent += `  return tokenBundle.tokens[camelKey]\n`
    outputContent += `}\n\n`
  }

  outputContent += `export default tokenBundle\n`

  return outputContent
}
