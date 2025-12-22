/**
 * Fixture loading utilities with caching
 */

import { readFile } from 'node:fs/promises'
import * as path from 'node:path'

const fixtureCache = new Map<string, any>()

/**
 * Get the fixtures directory path
 */
export function getFixturesDir(): string {
  return path.join(__dirname, '..', 'fixtures')
}

/**
 * Load a fixture file with caching
 */
export async function loadFixture(relativePath: string, useCache = true): Promise<unknown> {
  if (useCache && fixtureCache.has(relativePath)) {
    return fixtureCache.get(relativePath)
  }

  const fixturesDir = getFixturesDir()
  const fixturePath = path.join(fixturesDir, relativePath)

  const content = await readFile(fixturePath, 'utf-8')
  const parsed = JSON.parse(content)

  if (useCache) {
    fixtureCache.set(relativePath, parsed)
  }

  return parsed
}

/**
 * Get path to a fixture file
 */
export function getFixturePath(relativePath: string): string {
  return path.join(getFixturesDir(), relativePath)
}

/**
 * Clear fixture cache
 */
export function clearFixtureCache(): void {
  fixtureCache.clear()
}
