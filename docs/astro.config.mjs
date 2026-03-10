import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://docs.fastifyadmin.dev',
  integrations: [
    starlight({
      title: 'fastify-admin',
      customCss: ['./src/styles/custom.css'],
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      social: {
        github: 'https://github.com/gugupy/fastify-admin',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Quick Start', slug: 'getting-started' },
            { label: 'Project Structure', slug: 'project-structure' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Configuration', slug: 'configuration' },
            { label: 'Database & Migrations', slug: 'database' },
            { label: 'Authentication', slug: 'authentication' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Adding Entities', slug: 'adding-entities' },
            { label: 'Roles & Permissions', slug: 'rbac' },
            { label: 'Icons', slug: 'icons' },
            { label: 'Theming', slug: 'theming' },
            { label: 'CLI Commands', slug: 'cli' },
            { label: 'Testing', slug: 'testing' },
            { label: 'Deployment', slug: 'deployment' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', slug: 'api-reference' },
            { label: 'Contributing', slug: 'contributing' },
          ],
        },
      ],
    }),
  ],
})
