/**
 * Contract testing utilities
 */

/**
 * Verify an object has all required properties
 */
export function assertHasProperties(obj: any, properties: string[]): void {
  properties.forEach((prop) => {
    if (!(prop in obj)) {
      throw new Error(`Missing required property: ${prop}`)
    }
  })
}

/**
 * Verify an object has all required methods
 */
export function assertHasMethods(obj: any, methods: string[]): void {
  methods.forEach((method) => {
    if (!(method in obj) || typeof obj[method] !== 'function') {
      throw new Error(`Missing or invalid method: ${method}`)
    }
  })
}

/**
 * Verify a function signature accepts expected parameters
 */
export function verifyFunctionSignature(fn: Function, expectedParamCount: number): void {
  if (fn.length !== expectedParamCount) {
    throw new Error(
      `Function signature mismatch: expected ${expectedParamCount} parameters, got ${fn.length}`,
    )
  }
}

/**
 * Verify API stability - check if exported symbols match expected set
 */
export function verifyExports(
  actualExports: Record<string, any>,
  expectedNames: string[],
): {
  missing: string[]
  unexpected: string[]
} {
  const actualNames = Object.keys(actualExports)
  const missing = expectedNames.filter((name) => !actualNames.includes(name))
  const unexpected = actualNames.filter((name) => !expectedNames.includes(name))

  return { missing, unexpected }
}
