/**
 * Performance testing utilities
 */

/**
 * Measure execution time of an async function
 */
export async function measureTime(fn: () => Promise<any>): Promise<number> {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

/**
 * Measure execution time of a sync function
 */
export function measureTimeSync(fn: () => any): number {
  const start = performance.now()
  fn()
  const end = performance.now()
  return end - start
}

/**
 * Run a function multiple times and get average execution time
 */
export async function measureAverage(
  fn: () => Promise<any>,
  iterations: number,
): Promise<{
  avg: number
  min: number
  max: number
  times: number[]
}> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const time = await measureTime(fn)
    times.push(time)
  }

  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times,
  }
}

/**
 * Assert performance baseline (throws if exceeded)
 */
export function assertPerformance(actual: number, baseline: number, label: string) {
  if (actual > baseline) {
    throw new Error(
      `Performance baseline exceeded for ${label}: ${actual.toFixed(2)}ms > ${baseline}ms`,
    )
  }
}
