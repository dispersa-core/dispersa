/**
 * @fileoverview JSON Schema validator for design tokens and resolver documents
 *
 * Validates token data and resolver configurations against JSON schemas
 * to ensure DTCG compliance and catch errors early in the build process.
 */

import { ConfigurationError } from '@shared/errors/index'
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

import {
  buildConfigSchema,
  cssRendererOptionsSchema,
  figmaRendererOptionsSchema,
  filterPluginSchema,
  jsModuleRendererOptionsSchema,
  jsonRendererOptionsSchema,
  outputConfigSchema,
  preprocessorPluginSchema,
  rendererPluginSchema,
  dispersaOptionsSchema,
  transformPluginSchema,
} from './config-schemas'
import {
  dtcgSchemaRegistry,
  formatSchema,
  groupSchema,
  resolverSchema,
  tokenSchema,
} from './schemas'

/**
 * Validation error with message and optional context
 */
export type ValidationError = {
  /** Human-readable error message */
  message: string

  /** JSON path to the error location (e.g., '/tokens/color/primary') */
  path?: string

  /** Additional error parameters from JSON Schema validation */
  params?: Record<string, unknown>
}

/**
 * Custom validation hook function
 *
 * Allows extending validation with custom logic beyond JSON Schema.
 *
 * @param data - The data being validated
 * @param errors - Current validation errors (can be modified)
 * @returns Updated array of validation errors
 */
export type ValidationHook = (data: unknown, errors: ValidationError[]) => ValidationError[]

/**
 * Options for schema validator configuration
 */
export type SchemaValidatorOptions = {
  /**
   * Custom validation hook called after schema validation
   * Allows adding custom validation logic or modifying errors
   */
  onValidate?: ValidationHook

  /**
   * Custom hooks for specific token types (e.g., { 'color': validateColorFn })
   */
  typeValidators?: Record<string, ValidationHook>
}

/**
 * Validates design tokens and resolver documents against JSON schemas
 *
 * Uses AJV (Another JSON Validator) to validate data structures and ensure
 * compliance with DTCG specification and Dispersa extensions.
 *
 * @example
 * ```typescript
 * const validator = new SchemaValidator()
 *
 * // Validate resolver document
 * const resolverErrors = validator.validateResolver(resolverData)
 * if (resolverErrors.length > 0) {
 *   console.error('Resolver validation failed:', resolverErrors)
 * }
 *
 * // Validate token
 * const tokenErrors = validator.validateToken(tokenData, 'color')
 * ```
 */
export class SchemaValidator {
  private ajv: Ajv
  private validators: Map<string, ValidateFunction>
  private options: SchemaValidatorOptions

  constructor(options: SchemaValidatorOptions = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    })
    addFormats(this.ajv)
    this.validators = new Map()
    this.options = options
    this.registerDefaultSchemas()
  }

  private registerDefaultSchemas(): void {
    for (const schema of dtcgSchemaRegistry) {
      this.ajv.addSchema(schema as Record<string, unknown>, (schema as { $id?: string }).$id)
    }

    // Register DTCG schemas
    this.registerSchema('format', formatSchema)
    this.registerSchema('resolver', resolverSchema)
    this.registerSchema('token', tokenSchema)
    this.registerSchema('group', groupSchema)

    // Register config schemas
    this.registerSchema('outputConfig', outputConfigSchema)
    this.registerSchema('dispersaOptions', dispersaOptionsSchema)
    this.registerSchema('buildConfig', buildConfigSchema)
    this.registerSchema('transformPlugin', transformPluginSchema)
    this.registerSchema('rendererPlugin', rendererPluginSchema)
    this.registerSchema('filterPlugin', filterPluginSchema)
    this.registerSchema('preprocessorPlugin', preprocessorPluginSchema)

    // Register renderer options schemas
    this.registerSchema('cssRendererOptions', cssRendererOptionsSchema)
    this.registerSchema('jsonRendererOptions', jsonRendererOptionsSchema)
    this.registerSchema('jsModuleRendererOptions', jsModuleRendererOptionsSchema)
    this.registerSchema('figmaRendererOptions', figmaRendererOptionsSchema)
  }

  /**
   * Registers a custom JSON schema for validation
   *
   * Compiles and registers a JSON schema that can be used with `validate()`.
   *
   * @param name - Unique identifier for the schema
   * @param schema - JSON Schema object (draft-07 compatible)
   *
   * @example
   * ```typescript
   * validator.registerSchema('customToken', {
   *   type: 'object',
   *   required: ['$value', '$type'],
   *   properties: {
   *     $value: { type: 'string' },
   *     $type: { const: 'custom' }
   *   }
   * })
   * ```
   */
  registerSchema(name: string, schema: object): void {
    const validate = this.ajv.compile(schema as Record<string, unknown>)
    this.validators.set(name, validate)
  }

  /**
   * Validates data against a registered schema
   *
   * @param schemaName - Name of the registered schema to validate against
   * @param data - Data to validate
   * @returns Array of validation errors (empty if valid)
   * @throws {Error} If schema name is not registered
   *
   * @example
   * ```typescript
   * const errors = validator.validate('color', colorTokenData)
   * if (errors.length > 0) {
   *   console.error('Validation failed:', errors)
   * }
   * ```
   */
  validate(schemaName: string, data: unknown): ValidationError[] {
    const validator = this.validators.get(schemaName)
    if (validator == null) {
      throw new ConfigurationError(`Schema not found: ${schemaName}`)
    }

    const valid = validator(data)
    let errors = valid ? [] : this.formatErrors(validator.errors ?? [])

    // Apply global validation hook
    if (this.options.onValidate != null) {
      errors = this.options.onValidate(data, errors)
    }

    // Apply type-specific validation hook
    const typeValidator = this.options.typeValidators?.[schemaName]
    if (typeValidator != null) {
      errors = typeValidator(data, errors)
    }

    return errors
  }

  /**
   * Validates a resolver document structure
   *
   * Checks that the resolver document conforms to the expected schema with
   * valid references, sets, and modifier definitions.
   *
   * @param data - Resolver document data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const resolverErrors = validator.validateResolver(resolverData)
   * ```
   */
  validateResolver(data: unknown): ValidationError[] {
    return this.validate('resolver', data)
  }

  /**
   * Validates a design token structure
   *
   * Validates a token against the DTCG token schema. The schema itself
   * enforces type-specific constraints based on the token's $type.
   *
   * @param data - Token data to validate
   * @param tokenType - Optional token type (ignored; kept for API compatibility)
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * // Generic token validation
   * const errors = validator.validateToken(tokenData)
   *
   * // Type-aware validation (schema enforces $type rules)
   * const colorErrors = validator.validateToken(colorData, 'color')
   * ```
   */
  validateToken(data: unknown, _tokenType?: string): ValidationError[] {
    return this.validate('token', data)
  }

  /**
   * Validates a group structure (DTCG Section 6)
   *
   * Groups organize tokens hierarchically and can have properties like
   * $type, $description, $deprecated, $extensions, and $extends.
   * Groups MUST NOT have $value or $ref properties.
   *
   * @param data - Group data to validate
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const groupErrors = validator.validateGroup(groupData)
   * ```
   */
  validateGroup(data: unknown): ValidationError[] {
    return this.validate('group', data)
  }

  /**
   * Smart validation: Try both token and group schemas
   *
   * Per DTCG spec, an object is either a token (has $value/$ref) or a group (no $value/$ref).
   * This method tries to validate as both and returns the appropriate result.
   *
   * Strategy:
   * 1. Check for structural hints ($value/$ref present)
   * 2. Try validating as the likely type first
   * 3. If that fails, try the other type
   * 4. Only error if both fail
   *
   * @param obj - Object to validate (token or group)
   * @returns Validation result with type and errors
   *
   * @example
   * ```typescript
   * const result = validator.validateTokenOrGroup(obj)
   * if (result.type === 'invalid') {
   *   console.error(result.message, result.errors)
   * }
   * ```
   */
  validateTokenOrGroup(obj: unknown): {
    type: 'token' | 'group' | 'invalid'
    errors: ValidationError[]
    message?: string
  } {
    // First, check structural hints
    const hasValue = typeof obj === 'object' && obj !== null && ('$value' in obj || '$ref' in obj)

    if (hasValue) {
      // Looks like a token - validate as token
      const tokenErrors = this.validateToken(obj)
      if (tokenErrors.length === 0) {
        return { type: 'token', errors: [] }
      }
      // Failed as token, but it clearly has $value/$ref, so it's an invalid token
      return {
        type: 'invalid',
        errors: tokenErrors,
        message: 'Object has $value/$ref but failed token validation',
      }
    } else {
      // Looks like a group - validate as group
      const groupErrors = this.validateGroup(obj)
      if (groupErrors.length === 0) {
        return { type: 'group', errors: [] }
      }

      // Failed as group - could it be a malformed token?
      const tokenErrors = this.validateToken(obj)
      if (tokenErrors.length === 0) {
        return { type: 'token', errors: [] }
      }

      // Failed both - return better error
      return {
        type: 'invalid',
        errors: groupErrors.length < tokenErrors.length ? groupErrors : tokenErrors,
        message:
          groupErrors.length < tokenErrors.length
            ? 'Object appears to be a group but failed validation'
            : 'Object appears to be a token but failed validation',
      }
    }
  }

  /**
   * Format AJV errors into readable ValidationError objects
   */
  private formatErrors(errors: ErrorObject[]): ValidationError[] {
    return errors.map((error) => ({
      message: error.message ?? 'Validation error',
      path: error.instancePath,
      params: error.params,
    }))
  }

  /**
   * Formats validation errors into a human-readable message
   *
   * Combines multiple validation errors into a single string suitable
   * for logging or error displays.
   *
   * @param errors - Array of validation errors
   * @returns Formatted error message string
   *
   * @example
   * ```typescript
   * const errors = validator.validateToken(tokenData, 'color')
   * if (errors.length > 0) {
   *   const message = validator.getErrorMessage(errors)
   *   console.error(message)
   * }
   * ```
   */
  getErrorMessage(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return 'No errors'
    }

    return errors
      .map((error) => {
        const path = error.path != null && error.path !== '' ? `at ${error.path}` : ''
        return `${error.message} ${path}`.trim()
      })
      .join('; ')
  }

  // ============================================================================
  // CONFIGURATION VALIDATION METHODS
  // ============================================================================

  /**
   * Validates an OutputConfig structure
   *
   * @param data - Output configuration data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const outputErrors = validator.validateOutputConfig({
   *   name: 'css',
   *   renderer: cssRenderer(),
   *   options: { preset: 'bundle' },
   *   file: 'tokens.css'
   * })
   * ```
   */
  validateOutputConfig(data: unknown): ValidationError[] {
    return this.validate('outputConfig', data)
  }

  /**
   * Validates DispersaOptions structure
   *
   * Validates constructor options including inline resolver objects.
   * The resolver schema is referenced directly in the options schema,
   * so inline ResolverDocument objects are validated automatically.
   *
   * @param data - Dispersa options data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const optionsErrors = validator.validateDispersaOptions({
   *   resolver: './tokens.resolver.json',
   *   buildPath: './output'
   * })
   * ```
   */
  validateDispersaOptions(data: unknown): ValidationError[] {
    return this.validate('dispersaOptions', data)
  }

  /**
   * Validates BuildConfig structure
   *
   * Validates build configuration including inline resolver objects.
   * The resolver schema is referenced directly in the build config schema,
   * so inline ResolverDocument objects are validated automatically.
   *
   * @param data - Build configuration data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const configErrors = validator.validateBuildConfig({
   *   outputs: [{ name: 'css', renderer: cssRenderer(), options: { preset: 'bundle' } }]
   * })
   * ```
   */
  validateBuildConfig(data: unknown): ValidationError[] {
    return this.validate('buildConfig', data)
  }

  /**
   * Validates Transform plugin structure
   *
   * @param data - Transform plugin data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const transformErrors = validator.validateTransform({
   *   name: 'color:hex',
   *   transform: (token) => token
   * })
   * ```
   */
  validateTransform(data: unknown): ValidationError[] {
    const errors = this.validate('transformPlugin', data)

    // Additional runtime validation for function properties
    if (errors.length === 0 && typeof data === 'object' && data !== null) {
      const transform = data as Record<string, unknown>

      if (typeof transform.transform !== 'function') {
        errors.push({
          message: 'Transform "transform" property must be a function',
          path: '/transform',
        })
      }

      if (transform.matcher !== undefined && typeof transform.matcher !== 'function') {
        errors.push({
          message: 'Transform "matcher" property must be a function if provided',
          path: '/matcher',
        })
      }
    }

    return errors
  }

  /**
   * Validates Renderer plugin structure
   *
   * @param data - Renderer plugin data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const rendererErrors = validator.validateRenderer({
   *   name: 'scss',
   *   format: (tokens) => '...'
   * })
   * ```
   */
  validateRenderer(data: unknown): ValidationError[] {
    const errors = this.validate('rendererPlugin', data)

    // Additional runtime validation for function properties
    if (errors.length === 0 && typeof data === 'object' && data !== null) {
      const renderer = data as Record<string, unknown>

      if (typeof renderer.format !== 'function') {
        errors.push({
          message: 'Renderer "format" property must be a function',
          path: '/format',
        })
      }
    }

    return errors
  }

  /**
   * Validates Filter plugin structure
   *
   * @param data - Filter plugin data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const filterErrors = validator.validateFilter({
   *   name: 'colors-only',
   *   filter: (token) => token.$type === 'color'
   * })
   * ```
   */
  validateFilter(data: unknown): ValidationError[] {
    const errors = this.validate('filterPlugin', data)

    // Additional runtime validation for function properties
    if (errors.length === 0 && typeof data === 'object' && data !== null) {
      const filter = data as Record<string, unknown>

      if (typeof filter.filter !== 'function') {
        errors.push({
          message: 'Filter "filter" property must be a function',
          path: '/filter',
        })
      }
    }

    return errors
  }

  /**
   * Validates Preprocessor plugin structure
   *
   * @param data - Preprocessor plugin data
   * @returns Array of validation errors (empty if valid)
   *
   * @example
   * ```typescript
   * const preprocessorErrors = validator.validatePreprocessor({
   *   name: 'strip-metadata',
   *   preprocess: (raw) => raw
   * })
   * ```
   */
  validatePreprocessor(data: unknown): ValidationError[] {
    const errors = this.validate('preprocessorPlugin', data)

    // Additional runtime validation for function properties
    if (errors.length === 0 && typeof data === 'object' && data !== null) {
      const preprocessor = data as Record<string, unknown>

      if (typeof preprocessor.preprocess !== 'function') {
        errors.push({
          message: 'Preprocessor "preprocess" property must be a function',
          path: '/preprocess',
        })
      }
    }

    return errors
  }

  /**
   * Validates CSS renderer options
   *
   * @param data - CSS renderer options data
   * @returns Array of validation errors (empty if valid)
   */
  validateCssRendererOptions(data: unknown): ValidationError[] {
    return this.validate('cssRendererOptions', data)
  }

  /**
   * Validates JSON renderer options
   *
   * @param data - JSON renderer options data
   * @returns Array of validation errors (empty if valid)
   */
  validateJsonRendererOptions(data: unknown): ValidationError[] {
    return this.validate('jsonRendererOptions', data)
  }

  /**
   * Validates JS Module renderer options
   *
   * @param data - JS Module renderer options data
   * @returns Array of validation errors (empty if valid)
   */
  validateJsModuleRendererOptions(data: unknown): ValidationError[] {
    return this.validate('jsModuleRendererOptions', data)
  }

  /**
   * Validates Figma Variables renderer options
   *
   * @param data - Figma Variables renderer options data
   * @returns Array of validation errors (empty if valid)
   */
  validateFigmaVariablesOptions(data: unknown): ValidationError[] {
    return this.validate('figmaRendererOptions', data)
  }
}
