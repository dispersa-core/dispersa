/**
 * @license MIT
 * Copyright (c) 2025-present Dispersa Contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { detectPackageManager, scaffoldProject } from './scaffold.js'

const TEMPLATES = [
  {
    value: 'typescript-starter' as const,
    label: 'TypeScript',
    hint: 'Programmatic build script with CSS output',
  },
  {
    value: 'cli-starter' as const,
    label: 'CLI',
    hint: 'Config-file workflow using the dispersa CLI',
  },
]

export async function runCreate(args: string[]): Promise<void> {
  const targetArg = args[0]

  p.intro(pc.bgCyan(pc.black(' create-dispersa ')))

  const project = await p.group(
    {
      directory: () =>
        p.text({
          message: 'Where should we create your project?',
          placeholder: './my-dispersa-project',
          defaultValue: targetArg ?? './my-dispersa-project',
          initialValue: targetArg,
          validate: (value) => {
            if (!value) {
              return 'Directory is required'
            }
          },
        }),
      template: () =>
        p.select({
          message: 'Which template would you like to use?',
          options: TEMPLATES,
        }),
      install: () =>
        p.confirm({
          message: 'Install dependencies?',
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Setup cancelled.')
        process.exit(0)
      },
    },
  )

  await scaffoldProject({
    directory: project.directory,
    template: project.template,
    install: project.install,
  })

  const pm = detectPackageManager()
  const dir = project.directory.replace(/^\.\//, '')

  p.note(
    [dir !== '.' ? `cd ${dir}` : '', !project.install ? `${pm} install` : '', `${pm} run build`]
      .filter(Boolean)
      .join('\n'),
    'Next steps',
  )

  p.outro(`Problems? ${pc.underline(pc.cyan('https://github.com/timges/dispersa/issues'))}`)
}
