import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  globalIgnores(['dist', 'vite.config.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.app.json'],
      },
    },
    rules: {
      // shadcn/ui and context files legitimately mix components with constants/hooks
      'react-refresh/only-export-components': 'warn',
      // Intentional patterns: initial data loads and form-state sync via effects
      'react-hooks/set-state-in-effect': 'warn',
      // Dynamic entity data requires any in a few mapper/selector spots
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
