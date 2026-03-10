/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @fileoverview Path schema matcher implementation
 */

import { matchesGlob } from '@lint/utils'
import type { ResolvedToken } from '@shared/token-types'

import type { PathSchemaConfig, Pattern, SegmentDefinition, TransitionRule } from './types'

export type Violation = {
  type: 'INVALID_PATH' | 'FORBIDDEN_TRANSITION'
  data: Record<string, string | number>
}

type CompiledPattern = Array<
  | { type: 'segment'; name: string }
  | { type: 'segment'; name: string; optional: true }
  | { type: 'segment'; name: string; orValues: string[] }
  | { type: 'segment'; name: string; orValues: string[]; optional: true }
  | { type: 'literal'; value: string }
  | { type: 'wildcard' }
>

type CompiledPatternPart = CompiledPattern[number] & { value?: string }

type CompiledTransition = {
  from: Pattern
  to: Pattern
  allow: boolean
}

type TransitionRulesByFrom = {
  string: Map<string, CompiledTransition[]>
  pattern: CompiledTransition[]
}

export { matchesGlob }

function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp || Object.prototype.toString.call(value) === '[object RegExp]'
}

const SEGMENT_NAME_PATTERN = '([\\w-]+)'
const OR_SEGMENT_PATTERN = '([\\w-]+\\|[\\w-]+(?:\\|[\\w-]+)*)'
const REGEX_OR_OPTIONAL = new RegExp(`^\\{${OR_SEGMENT_PATTERN}\\}\\?`)
const REGEX_OPTIONAL = new RegExp(`^\\{${SEGMENT_NAME_PATTERN}\\}\\?`)
const REGEX_OR = new RegExp(`^\\{${OR_SEGMENT_PATTERN}\\}`)
const REGEX_SEGMENT = new RegExp(`^\\{${SEGMENT_NAME_PATTERN}\\}`)
const REGEX_WILDCARD = /^\*/
const REGEX_LITERAL = /^[^{}*]+/

/**
 * Compiles and validates token paths against a schema
 */
export class PathSchemaMatcher {
  private segments: Record<string, SegmentDefinition>
  private pathPatterns: CompiledPattern[]
  private pathPatternParts: CompiledPattern[]
  private transitionRules: TransitionRulesByFrom

  constructor(config: PathSchemaConfig) {
    this.segments = config.segments ?? {}
    this.assertSegmentsValid(this.segments)
    const compiled = this.compilePaths(config.paths ?? [])
    this.pathPatterns = compiled.patterns
    this.pathPatternParts = compiled.parts
    this.transitionRules = this.compileTransitions(config.transitions ?? [])
  }

  private assertSegmentsValid(segments: Record<string, SegmentDefinition>): void {
    for (const [name, def] of Object.entries(segments)) {
      if (Array.isArray(def.values)) {
        if (def.values.length === 0) {
          throw new Error(`Segment '${name}' has empty values array`)
        }
        for (const v of def.values) {
          if (typeof v === 'string') {
            if (v === '') {
              throw new Error(`Segment '${name}' has empty string value`)
            }
          } else if (v instanceof RegExp) {
            this.validateRegex(v, `segment '${name}'`)
          } else {
            throw new Error(`Segment '${name}' has invalid value type: ${typeof v}`)
          }
        }
      } else if (def.values instanceof RegExp) {
        this.validateRegex(def.values, `segment '${name}'`)
      } else {
        throw new Error(`Segment '${name}' has invalid values type: ${typeof def.values}`)
      }
    }
  }

  private validateOrSegmentNames(segmentNames: string[], pattern: string): void {
    const undefinedSegments = segmentNames.filter((name) => !this.segments[name])
    if (undefinedSegments.length > 0) {
      throw new Error(
        `OR segment '${pattern}' references undefined segment(s): ${undefinedSegments.join(', ')}`,
      )
    }
  }

  private validateRegex(regex: RegExp, context: string): void {
    try {
      new RegExp(regex.source, regex.flags)
    } catch {
      throw new Error(`Invalid regex in ${context}: /${regex.source}/${regex.flags}`)
    }
  }

  private validateTransitionPattern(pattern: Pattern, context: string): void {
    if (isRegExp(pattern)) {
      this.validateRegex(pattern, `transition '${context}'`)
    } else if (Array.isArray(pattern)) {
      for (const p of pattern) {
        if (isRegExp(p)) {
          this.validateRegex(p, `transition '${context}'`)
        }
      }
    }
  }

  /**
   * Validate a token against the schema
   */
  validate(token: ResolvedToken): Violation[] {
    const violations: Violation[] = []
    const pathSegments = token.path
    const hasPaths = this.pathPatterns.length > 0
    const hasTransitions =
      this.transitionRules.string.size > 0 || this.transitionRules.pattern.length > 0

    // Check transitions if defined
    if (hasTransitions) {
      const transitionViolations = this.validateTransitions(pathSegments, token.name)
      violations.push(...transitionViolations)
    }

    // Check against path patterns if defined
    if (hasPaths) {
      const matchesAny = this.pathPatterns.some((_, idx) =>
        this.matchPattern(this.pathPatternParts[idx]!, pathSegments),
      )
      if (!matchesAny) {
        violations.push({
          type: 'INVALID_PATH',
          data: { path: token.name },
        })
      }
    }

    return violations
  }

  /**
   * Validate transitions between segments.
   *
   * Deny rules are checked independently (any match = violation).
   * Allow rules use OR semantics: at least one must match.
   */
  private validateTransitions(segments: string[], tokenName: string): Violation[] {
    const violations: Violation[] = []

    for (let i = 0; i < segments.length - 1; i++) {
      const from = segments[i]
      const to = segments[i + 1]

      if (!from || !to) {
        continue
      }

      const applicableRules: CompiledTransition[] = []

      const stringRules = this.transitionRules.string.get(from)
      if (stringRules) {
        applicableRules.push(...stringRules)
      }

      for (const rule of this.transitionRules.pattern) {
        if (this.matchesPattern(from, rule.from)) {
          applicableRules.push(rule)
        }
      }

      if (applicableRules.length === 0) {
        continue
      }

      const denyRules = applicableRules.filter((r) => r.allow === false)
      const allowRules = applicableRules.filter((r) => r.allow === true)

      for (const rule of denyRules) {
        if (this.matchesPattern(to, rule.to)) {
          violations.push({
            type: 'FORBIDDEN_TRANSITION',
            data: { from, to, path: tokenName },
          })
        }
      }

      if (allowRules.length > 0) {
        const anyAllowMatches = allowRules.some((r) => this.matchesPattern(to, r.to))
        if (!anyAllowMatches) {
          violations.push({
            type: 'FORBIDDEN_TRANSITION',
            data: { from, to, path: tokenName },
          })
        }
      }
    }

    return violations
  }

  /**
   * Check if a value matches a pattern
   */
  private matchesPattern(value: string, pattern: Pattern): boolean {
    if (typeof pattern === 'string') {
      return value === pattern
    }
    if (Array.isArray(pattern)) {
      return pattern.includes(value)
    }
    return pattern.test(value)
  }

  /**
   * Compile path patterns into matcher structures
   */
  private compilePaths(patterns: string[]): {
    patterns: CompiledPattern[]
    parts: CompiledPattern[]
  } {
    const compiledPatterns = patterns.map((p) => this.parsePattern(p))
    const compiledParts = compiledPatterns.map((pattern) => this.extractPatternParts(pattern))
    return { patterns: compiledPatterns, parts: compiledParts }
  }

  /**
   * Extract pattern parts that consume segments (segments + wildcards)
   * But include literals that are NOT just path separators (single dots)
   */
  private extractPatternParts(pattern: CompiledPattern): CompiledPattern {
    return pattern.filter((p) => {
      if (p.type === 'segment' || p.type === 'wildcard') {
        return true
      }
      if (p.type === 'literal') {
        return p.value !== '.' && !/^\.+$/.test(p.value)
      }
      return false
    })
  }

  /**
   * Parse a path pattern string into compiled form
   * - `{name}` is a segment placeholder
   * - `{name}?` is an optional segment placeholder (the ? comes AFTER the closing brace)
   * - `{a|b|c}` is an OR segment matching any of the values
   * - `{a|b|c}?` is an optional OR segment
   * - `*` is a wildcard that matches any single segment
   * - `.` is the path separator (implicit between segments)
   */
  private parsePattern(pattern: string): CompiledPattern {
    const parts: CompiledPattern = []
    let remaining = pattern

    while (remaining.length > 0) {
      const orOptionalMatch = remaining.match(REGEX_OR_OPTIONAL)
      if (orOptionalMatch) {
        const values = orOptionalMatch[1]!.split('|')
        this.validateOrSegmentNames(values, orOptionalMatch[0]!)
        parts.push({ type: 'segment', name: orOptionalMatch[1]!, orValues: values, optional: true })
        remaining = remaining.slice(orOptionalMatch[0].length)
        continue
      }

      const optionalMatch = remaining.match(REGEX_OPTIONAL)
      if (optionalMatch) {
        parts.push({ type: 'segment', name: optionalMatch[1]!, optional: true })
        remaining = remaining.slice(optionalMatch[0].length)
        continue
      }

      const orMatch = remaining.match(REGEX_OR)
      if (orMatch) {
        const values = orMatch[1]!.split('|')
        this.validateOrSegmentNames(values, orMatch[0]!)
        parts.push({ type: 'segment', name: orMatch[1]!, orValues: values })
        remaining = remaining.slice(orMatch[0].length)
        continue
      }

      const segmentMatch = remaining.match(REGEX_SEGMENT)
      if (segmentMatch) {
        parts.push({ type: 'segment', name: segmentMatch[1]! })
        remaining = remaining.slice(segmentMatch[0].length)
        continue
      }

      const wildcardMatch = remaining.match(REGEX_WILDCARD)
      if (wildcardMatch) {
        parts.push({ type: 'wildcard' })
        remaining = remaining.slice(1)
        continue
      }

      const literalMatch = remaining.match(REGEX_LITERAL)
      if (literalMatch) {
        parts.push({ type: 'literal', value: literalMatch[0] })
        remaining = remaining.slice(literalMatch[0].length)
        continue
      }

      break
    }

    return parts
  }

  /**
   * Match path segments against a compiled pattern using dynamic programming.
   * Supports optional segments via DP table.
   *
   * DP[i][j] = can we match path[0..i) with pattern[0..j)?
   */
  private matchPattern(patternParts: CompiledPattern, pathSegments: string[]): boolean {
    const pathLen = pathSegments.length
    const patternLen = patternParts.length

    // DP table: dp[i][j] = can we match first i path segments with first j pattern parts?
    // Initialize with false values
    const dp: boolean[][] = []
    for (let i = 0; i <= pathLen; i++) {
      dp[i] = []
      for (let j = 0; j <= patternLen; j++) {
        dp[i]![j] = false
      }
    }

    // Base case: empty path matches empty pattern
    dp[0]![0] = true

    // Fill DP table
    for (let i = 0; i <= pathLen; i++) {
      for (let j = 0; j <= patternLen; j++) {
        const currentState = dp[i]![j]
        if (!currentState) {
          continue
        }

        // If we've consumed all path segments, we can still skip remaining optional pattern parts
        if (i === pathLen) {
          // Can skip remaining optional pattern parts
          if (j < patternLen && this.isPartOptional(patternParts[j]!)) {
            dp[i]![j + 1] = true
          }
          continue
        }

        // If we've consumed all pattern parts, we can only continue if path is also exhausted
        if (j === patternLen) {
          continue
        }

        const part = patternParts[j]!

        // ALWAYS try to match current path segment with current pattern part first
        if (i < pathLen && this.matchPatternPart(part, pathSegments[i]!)) {
          dp[i + 1]![j + 1] = true
        }

        // THEN try skipping current pattern part if it's optional
        // (this is separate from matching - both can be valid)
        if (this.isPartOptional(part)) {
          dp[i]![j + 1] = true
        }
      }
    }

    // Path matches if we can reach any state where both path and pattern are consumed
    return dp[pathLen]![patternLen] ?? false
  }

  /**
   * Check if a pattern part is optional based on the pattern syntax
   */
  private isPartOptional(part: CompiledPattern[number]): boolean {
    if (part.type !== 'segment') {
      return false
    }
    return 'optional' in part && part.optional === true
  }

  /**
   * Match a single pattern part against a path segment value
   */
  private matchPatternPart(part: CompiledPatternPart, value: string): boolean {
    if (part.type === 'wildcard') {
      return true
    }

    if (part.type === 'literal' && part.value !== undefined) {
      const literalValue = part.value.replace(/^\.+|\.+$/g, '')
      return literalValue === value
    }

    if (part.type === 'segment' && part.name) {
      if ('orValues' in part && part.orValues) {
        const matched = part.orValues.some((segmentName: string) => {
          const segment = this.segments[segmentName]
          if (!segment) {
            return false
          }
          return this.matchesSegmentDefinition(value, segment)
        })
        if (!matched) {
          return false
        }
        return true
      }

      const segment = this.segments[part.name]
      if (!segment) {
        return false
      }
      return this.matchesSegmentDefinition(value, segment)
    }

    return false
  }

  /**
   * Check if a value matches a segment definition
   */
  private matchesSegmentDefinition(value: string, definition: SegmentDefinition): boolean {
    const { values } = definition
    if (Array.isArray(values)) {
      return values.some((v) => (typeof v === 'string' ? v === value : v.test(value)))
    }
    return values.test(value)
  }

  /**
   * Compile transition rules into optimized structure
   */
  private compileTransitions(transitions: TransitionRule[]): TransitionRulesByFrom {
    const stringMap = new Map<string, CompiledTransition[]>()
    const patternRules: CompiledTransition[] = []

    for (const t of transitions) {
      this.validateTransitionPattern(t.from, "'from'")
      this.validateTransitionPattern(t.to, "'to'")

      const compiled: CompiledTransition = {
        from: t.from,
        to: t.to,
        allow: t.allow ?? true,
      }

      if (typeof t.from === 'string') {
        const existing = stringMap.get(t.from)
        if (existing) {
          existing.push(compiled)
        } else {
          stringMap.set(t.from, [compiled])
        }
      } else {
        patternRules.push(compiled)
      }
    }

    return { string: stringMap, pattern: patternRules }
  }
}
