/**
 * @fileoverview TypeScript type definition generator for design tokens
 *
 * Generates comprehensive TypeScript type definitions from resolved tokens
 * including token name unions, value types, and nested structure types.
 *
 * Value types reference the publicly-exported DTCG value types (e.g.
 * `ColorValueObject`, `DimensionValue`) via an emitted `import type`
 * statement, so generated definitions reflect the real resolved token shapes.
 */

import type { ResolvedTokens, ResolvedToken, TokenType } from '@shared/token-types'

/**
 * Options for TypeScript type generation
 */
export type TypeGeneratorOptions = {
  /** Export style: 'type' alias or 'interface' (default: 'type') */
  exportType?: 'type' | 'interface'

  /** Include token value types (default: false) */
  includeValues?: boolean

  /** Name for the main module type (default: 'Tokens') */
  moduleName?: string
}

/**
 * Generates TypeScript type definitions from design tokens
 *
 * Creates type-safe TypeScript definitions including:
 * - Token name string literal unions for autocomplete
 * - Value types mapped to token values
 * - Nested structure types matching token hierarchy
 *
 * @example
 * ```typescript
 * const generator = new TypeGenerator()
 * const types = generator.generate(tokens, {
 *   exportType: 'type',
 *   includeValues: true,
 *   moduleName: 'DesignTokens'
 * })
 *
 * // Output:
 * // export type TokenName = 'color.primary' | 'color.secondary' | ...
 * // export type DesignTokens = { color: { primary: string, ... } }
 * ```
 */
export class TypeGenerator {
  /**
   * DTCG value type names referenced by the generated definitions.
   *
   * Populated while rendering; used to emit a single `import type`
   * statement in `generate()`.
   */
  private usedTypeImports = new Set<string>()

  /**
   * Generates complete TypeScript type definitions from resolved tokens
   *
   * @param tokens - Resolved tokens to generate types from
   * @param options - Generation options
   * @returns TypeScript type definition string
   *
   * @example
   * ```typescript
   * const types = generator.generate(tokens, {
   *   moduleName: 'Tokens',
   *   includeValues: true
   * })
   * ```
   */
  generate(tokens: ResolvedTokens, options?: TypeGeneratorOptions): string {
    const opts = {
      exportType: 'type',
      includeValues: false,
      moduleName: 'Tokens',
      ...options,
    } as const

    this.usedTypeImports.clear()

    const sections: string[] = []

    // Generate token names type
    sections.push(this.generateTokenNamesType(tokens, 'TokenName').join('\n'))

    // Generate token values type (records DTCG type imports when included)
    if (opts.includeValues) {
      sections.push(this.generateTokenValuesType(tokens, `${opts.moduleName}Values`).join('\n'))
    }

    // Generate nested structure type (records remaining DTCG type imports)
    sections.push(this.generateStructureType(tokens, opts).join('\n'))

    const lines: string[] = []

    // Emit imports for the DTCG value types referenced by the sections above
    const importLine = this.buildImportLine()
    if (importLine) {
      lines.push(importLine)
      lines.push('')
    }

    lines.push(sections.join('\n\n'))

    return lines.join('\n')
  }

  /**
   * Generates a string literal union type of all token names
   *
   * Useful for creating type-safe token name variables.
   *
   * @param tokens - Resolved tokens
   * @param typeName - Name for the exported type (default: 'TokenName')
   * @returns Array of type definition lines
   *
   * @example
   * ```typescript
   * // Output:
   * // export type TokenName =
   * //   | "color.primary"
   * //   | "color.secondary"
   * ```
   */
  generateTokenNamesType(tokens: ResolvedTokens, typeName = 'TokenName'): string[] {
    const names = Object.keys(tokens).sort(this.compareKeys)
    const lines: string[] = []

    if (names.length === 0) {
      lines.push(`export type ${typeName} = never`)
      return lines
    }

    lines.push(`export type ${typeName} =`)
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      if (name == null) {
        continue
      }
      lines.push(`  | "${name}"`)
    }

    return lines
  }

  /**
   * Generate token values type
   */
  generateTokenValuesType(tokens: ResolvedTokens, typeName = 'TokenValues'): string[] {
    const lines: string[] = []

    lines.push(`export type ${typeName} = {`)

    const entries = Object.entries(tokens).sort(([nameA], [nameB]) =>
      this.compareKeys(nameA, nameB),
    )

    for (const [name, token] of entries) {
      if (token.$description) {
        lines.push(`  /** ${token.$description} */`)
      }

      const valueType = this.inferValueType(token)
      lines.push(`  "${name}": ${valueType}`)
    }

    lines.push('}')

    return lines
  }

  /**
   * Generate nested structure type
   */
  private generateStructureType(
    tokens: ResolvedTokens,
    options: Required<TypeGeneratorOptions>,
  ): string[] {
    const lines: string[] = []
    const structure = this.buildNestedStructure(tokens)

    const opener =
      options.exportType === 'type'
        ? `export type ${options.moduleName} = {`
        : `export interface ${options.moduleName} {`

    lines.push(opener)
    this.addStructureProperties(lines, structure, 1)
    lines.push('}')

    return lines
  }

  /**
   * Build nested structure from flat tokens
   */
  private buildNestedStructure(tokens: ResolvedTokens): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const token of Object.values(tokens)) {
      const parts = token.path
      if (!parts || parts.length === 0) {
        continue
      }

      let current = result

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (part == null) {
          continue
        }
        if (!(part in current)) {
          current[part] = {}
        }
        current = current[part] as Record<string, unknown>
      }

      const lastPart = parts[parts.length - 1]
      if (lastPart != null) {
        current[lastPart] = token
      }
    }

    return result
  }

  /**
   * Add structure properties to lines
   */
  private addStructureProperties(
    lines: string[],
    structure: Record<string, unknown>,
    indent: number,
  ): void {
    const indentStr = '  '.repeat(indent)
    const entries = Object.entries(structure).sort(([keyA], [keyB]) => this.compareKeys(keyA, keyB))

    for (const [key, value] of entries) {
      if (this.isToken(value)) {
        const token = value
        if (token.$description) {
          lines.push(`${indentStr}/** ${token.$description} */`)
        }

        const valueType = this.inferValueType(token)
        lines.push(`${indentStr}${this.quoteKey(key)}: ${valueType}`)
      } else {
        lines.push(`${indentStr}${this.quoteKey(key)}: {`)
        this.addStructureProperties(lines, value as Record<string, unknown>, indent + 1)
        lines.push(`${indentStr}}`)
      }
    }
  }

  /**
   * Infer TypeScript type from token
   */
  private inferValueType(token: ResolvedToken): string {
    const value = token.$value

    // Use token type if available
    if (token.$type) {
      return this.tokenTypeToTsType(token.$type)
    }

    // Infer from value
    if (typeof value === 'string') {
      return 'string'
    }
    if (typeof value === 'number') {
      return 'number'
    }
    if (typeof value === 'boolean') {
      return 'boolean'
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'unknown[]'
      }
      const itemType = typeof value[0]
      return `${itemType}[]`
    }

    if (typeof value === 'object' && value !== null) {
      return 'Record<string, unknown>'
    }

    return 'unknown'
  }

  /**
   * Map a DTCG token type to its TypeScript type representation.
   *
   * Composite and object-shaped token types reference the publicly-exported
   * DTCG value types (e.g. `ColorValueObject`, `TypographyValue`) so the
   * generated definitions reflect the real resolved token shapes instead of
   * a blanket `string`. Referenced type names are recorded in
   * {@link usedTypeImports} for the emitted import statement.
   */
  private tokenTypeToTsType(tokenType: TokenType): string {
    switch (tokenType) {
      case 'color':
        this.usedTypeImports.add('ColorValueObject')
        return 'ColorValueObject'
      case 'dimension':
        this.usedTypeImports.add('DimensionValue')
        return 'DimensionValue'
      case 'fontFamily':
        this.usedTypeImports.add('FontFamilyValue')
        return 'FontFamilyValue'
      case 'fontWeight':
        this.usedTypeImports.add('FontWeightValue')
        return 'FontWeightValue'
      case 'duration':
        this.usedTypeImports.add('DurationValue')
        return 'DurationValue'
      case 'number':
        return 'number'
      case 'cubicBezier':
        return '[number, number, number, number]'
      case 'shadow':
        this.usedTypeImports.add('ShadowValue')
        return 'ShadowValue'
      case 'typography':
        this.usedTypeImports.add('TypographyValue')
        return 'TypographyValue'
      case 'border':
        this.usedTypeImports.add('BorderValue')
        return 'BorderValue'
      case 'strokeStyle':
        this.usedTypeImports.add('StrokeStyleValue')
        return 'StrokeStyleValue'
      case 'transition':
        this.usedTypeImports.add('TransitionValue')
        return 'TransitionValue'
      case 'gradient':
        this.usedTypeImports.add('GradientValue')
        return 'GradientValue'
      default:
        return 'string'
    }
  }

  /**
   * Deterministic key ordering shared by all generated sections.
   *
   * Uses a single dedicated comparator so token names, value records, nested
   * structure keys, and the emitted import list all follow the same order
   * regardless of input object order.
   */
  private compareKeys(a: string, b: string): number {
    return a.localeCompare(b)
  }

  /**
   * Build the `import type` statement for DTCG value types used during
   * generation, or undefined when no named value types were referenced.
   */
  private buildImportLine(): string | undefined {
    const names = [...this.usedTypeImports].sort(this.compareKeys)
    if (names.length === 0) {
      return undefined
    }
    return `import type { ${names.join(', ')} } from 'dispersa'`
  }

  /**
   * Quote key if necessary
   */
  private quoteKey(key: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return key
    }
    return `"${key}"`
  }

  /**
   * Check if value is a token
   */
  private isToken(value: unknown): value is ResolvedToken {
    return (
      typeof value === 'object' &&
      value !== null &&
      '$value' in value &&
      'path' in value &&
      'name' in value
    )
  }
}
