/**
 * @fileoverview File I/O utilities for consistent file operations
 */

import { constants as fsConstants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

import { FileOperationError, ValidationError } from '@shared/errors/index'
/**
 * Read and parse a JSON file
 * Provides consistent error handling and path resolution
 *
 * @param filePath - Path to JSON file (absolute or relative)
 * @param baseDir - Base directory for resolving relative paths (defaults to cwd)
 * @returns Parsed JSON content
 * @throws Error if file not found or invalid JSON
 */
export async function readJSONFile(filePath: string, baseDir?: string): Promise<unknown> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(baseDir ?? process.cwd(), filePath)

  try {
    await access(absolutePath, fsConstants.R_OK)
  } catch (error) {
    throw new FileOperationError('read', absolutePath, error as Error)
  }

  try {
    const content = await readFile(absolutePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new ValidationError(`Failed to read or parse file ${absolutePath}: ${errorMsg}`, [
      { message: errorMsg },
    ])
  }
}

/**
 * Write content to a file, creating parent directories as needed
 *
 * Provides consistent file writing with automatic directory creation.
 * This consolidates the common pattern of mkdir + writeFile.
 *
 * @param fileName - Path where file should be written (absolute or relative)
 * @param content - Content to write to the file
 * @param encoding - File encoding (default: 'utf-8')
 * @throws Error if file cannot be written
 *
 * @example
 * ```typescript
 * await writeOutputFile('./dist/tokens.css', cssContent)
 * ```
 */
export async function writeOutputFile(
  fileName: string,
  content: string,
  encoding: BufferEncoding = 'utf-8',
): Promise<void> {
  try {
    // Create parent directories if they don't exist
    await mkdir(path.dirname(fileName), { recursive: true })
    // Write the file
    await writeFile(fileName, content, encoding)
  } catch (error) {
    throw new FileOperationError('write', fileName, error as Error)
  }
}
