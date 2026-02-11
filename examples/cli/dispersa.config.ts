// @ts-nocheck
import { css, json } from 'dispersa'
import { nameKebabCase } from 'dispersa/transforms'

export default {
  resolver: './tokens.resolver.json',
  buildPath: './dist',
  outputs: [
    css({
      name: 'css',
      file: 'tokens.css',
      preset: 'bundle',
      selector: ':root',
      transforms: [nameKebabCase()],
    }),
    json({ name: 'json', file: 'tokens-{theme}.json', preset: 'standalone', structure: 'flat' }),
  ],
}
