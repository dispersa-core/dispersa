// @ts-check
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Dispersa',
      logo: {
        src: './public/favicon.png',
      },
      favicon: './public/favicon.png',
      customCss: [
        '@fontsource-variable/inter',
        '@fontsource/jetbrains-mono/400.css',
        '@fontsource/jetbrains-mono/500.css',
        '@fontsource/jetbrains-mono/600.css',
        './src/styles/custom.css',
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/timges/dispersa',
        },
      ],
      sidebar: [
        { label: 'Introduction', link: '/' },
        { label: 'Understanding Tokens', autogenerate: { directory: 'tokens' } },
        { label: 'Getting Started', autogenerate: { directory: 'getting-started' } },
        { label: 'Core Concepts', autogenerate: { directory: 'concepts' } },
        { label: 'Output Formats', autogenerate: { directory: 'outputs' } },
        { label: 'Extending Dispersa', autogenerate: { directory: 'extending' } },
        { label: 'Guides', autogenerate: { directory: 'guides' } },
        { label: 'API Reference', autogenerate: { directory: 'reference' } },
      ],
      editLink: {
        baseUrl: 'https://github.com/timges/dispersa/edit/main/apps/docs/',
      },
    }),
    react(),
  ],
})
