import { dispersaPlugin } from 'dispersa/lint'
import { json } from 'dispersa'

export default {
  resolver: './tokens.resolver.json',
  buildPath: './dist',
  lint: {
    enabled: true,
    plugins: { dispersa: dispersaPlugin },
    rules: {
      'dispersa/require-description': 'error',
    },
  },
  outputs: [json({ name: 'json', file: 'tokens.json', preset: 'standalone', structure: 'flat' })],
}
