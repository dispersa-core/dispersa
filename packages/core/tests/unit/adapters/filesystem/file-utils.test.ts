/**
 * @fileoverview Unit tests for file I/O utilities
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { readJSONFile, writeOutputFile } from '../../../../src/adapters/filesystem/file-utils'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// Mock fs module
vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

describe('File Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('readJSONFile()', () => {
    it('should read and parse valid JSON file', async () => {
      const mockData = { test: 'value' }
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      const result = await readJSONFile('/test/file.json')

      expect(result).toEqual(mockData)
      expect(fs.access).toHaveBeenCalledWith('/test/file.json', expect.any(Number))
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.json', 'utf-8')
    })

    it('should resolve relative paths from baseDir', async () => {
      const mockData = { test: 'value' }
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      await readJSONFile('file.json', '/base/dir')

      const expectedPath = path.resolve('/base/dir', 'file.json')
      expect(fs.access).toHaveBeenCalledWith(expectedPath, expect.any(Number))
    })

    it('should resolve relative paths from cwd when no baseDir', async () => {
      const mockData = { test: 'value' }
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      await readJSONFile('file.json')

      const expectedPath = path.resolve(process.cwd(), 'file.json')
      expect(fs.access).toHaveBeenCalledWith(expectedPath, expect.any(Number))
    })

    it('should throw error when file not found', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))

      await expect(readJSONFile('/test/missing.json')).rejects.toThrow('Failed to read file')
    })

    it('should throw error for invalid JSON', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }')

      await expect(readJSONFile('/test/invalid.json')).rejects.toThrow(
        'Failed to read or parse file',
      )
    })

    it('should throw error for read failures', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'))

      await expect(readJSONFile('/test/file.json')).rejects.toThrow('Failed to read or parse file')
    })

    it('should handle absolute paths', async () => {
      const mockData = { test: 'value' }
      const absolutePath = '/absolute/path/file.json'
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      await readJSONFile(absolutePath)

      expect(fs.access).toHaveBeenCalledWith(absolutePath, expect.any(Number))
    })

    it('should parse arrays', async () => {
      const mockData = [1, 2, 3]
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData))

      const result = await readJSONFile('/test/array.json')

      expect(result).toEqual(mockData)
    })

    it('should parse null values', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined)
      vi.mocked(fs.readFile).mockResolvedValue('null')

      const result = await readJSONFile('/test/null.json')

      expect(result).toBeNull()
    })
  })

  describe('writeOutputFile()', () => {
    it('should write file with content', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeOutputFile('/test/output.txt', 'test content')

      expect(fs.mkdir).toHaveBeenCalledWith('/test', { recursive: true })
      expect(fs.writeFile).toHaveBeenCalledWith('/test/output.txt', 'test content', 'utf-8')
    })

    it('should create parent directories', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeOutputFile('/deep/nested/path/file.txt', 'content')

      expect(fs.mkdir).toHaveBeenCalledWith('/deep/nested/path', { recursive: true })
    })

    it('should use custom encoding', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeOutputFile('/test/file.txt', 'content', 'utf-16le')

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf-16le')
    })

    it('should handle write errors', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'))

      await expect(writeOutputFile('/test/file.txt', 'content')).rejects.toThrow(
        'Failed to write file',
      )
    })

    it('should handle mkdir errors', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'))

      await expect(writeOutputFile('/test/file.txt', 'content')).rejects.toThrow(
        'Failed to write file',
      )
    })

    it('should write to root directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeOutputFile('/file.txt', 'content')

      expect(fs.mkdir).toHaveBeenCalledWith('/', { recursive: true })
    })

    it('should write empty content', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      await writeOutputFile('/test/empty.txt', '')

      expect(fs.writeFile).toHaveBeenCalledWith('/test/empty.txt', '', 'utf-8')
    })

    it('should write large content', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined)
      vi.mocked(fs.writeFile).mockResolvedValue(undefined)

      const largeContent = 'a'.repeat(10000)
      await writeOutputFile('/test/large.txt', largeContent)

      expect(fs.writeFile).toHaveBeenCalledWith('/test/large.txt', largeContent, 'utf-8')
    })
  })
})
