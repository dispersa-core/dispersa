/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

import { spinner } from '@clack/prompts'
import { downloadTemplate } from 'giget'

declare const __PKG_VERSION__: string

const GITHUB_REPO = 'gh:timges/dispersa'

type TemplateId = 'typescript-starter' | 'cli-starter'

type ScaffoldOptions = {
  directory: string
  template: TemplateId
  install: boolean
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const { directory, template, install } = options
  const targetDir = resolve(process.cwd(), directory)

  const s = spinner()

  s.start('Downloading template...')
  await downloadTemplate(`${GITHUB_REPO}/examples/${template}#main`, {
    dir: targetDir,
    force: true,
  })
  s.stop('Template downloaded')

  rewritePackageJson(targetDir, directory)
  rewriteTsconfig(targetDir)

  if (!install) {
    return
  }

  const pm = detectPackageManager()
  s.start(`Installing dependencies with ${pm}...`)
  execSync(`${pm} install`, { cwd: targetDir, stdio: 'ignore' })
  s.stop('Dependencies installed')
}

function rewritePackageJson(targetDir: string, directory: string): void {
  const pkgPath = join(targetDir, 'package.json')
  if (!existsSync(pkgPath)) {
    return
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  pkg.name = deriveProjectName(directory)

  const dispersaVersion = pkg.dependencies?.dispersa
  if (dispersaVersion?.startsWith('workspace:') || dispersaVersion?.startsWith('file:')) {
    pkg.dependencies.dispersa = `^${__PKG_VERSION__}`
  }

  delete pkg.private

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function rewriteTsconfig(targetDir: string): void {
  const tsconfigPath = join(targetDir, 'tsconfig.json')
  if (!existsSync(tsconfigPath)) {
    return
  }

  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
  if (!tsconfig.extends) {
    return
  }

  delete tsconfig.extends

  tsconfig.compilerOptions = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022'],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    types: ['node'],
    ...tsconfig.compilerOptions,
  }

  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n')
}

function deriveProjectName(directory: string): string {
  const cleaned = directory.replace(/^\.\//, '')
  if (cleaned === '.') {
    return basename(resolve(process.cwd()))
  }
  return basename(cleaned)
}

export function detectPackageManager(): string {
  const agent = process.env.npm_config_user_agent ?? ''
  if (agent.startsWith('yarn')) {
    return 'yarn'
  }
  if (agent.startsWith('pnpm')) {
    return 'pnpm'
  }
  if (agent.startsWith('bun')) {
    return 'bun'
  }
  return 'npm'
}
