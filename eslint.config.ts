import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
  // Files to lint
  {
    files: ['src/**/*.{ts,tsx,vue}'],
  },

  // Files to ignore
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'public/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },

  // Node scripts
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Vue flat/recommended rules for Vue 3
  ...pluginVue.configs['flat/recommended'],

  // Project-specific overrides
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        // Let vue-eslint-parser handle .vue files; ts parser handles the <script> block
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      // ── TypeScript ────────────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // ── Vue ───────────────────────────────────────────────────────────
      'vue/multi-word-component-names': 'off',       // portfolio components are single-word by design
      'vue/no-v-html': 'warn',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': ['error', {
        order: ['defineProps', 'defineEmits', 'defineExpose'],
      }],

      // ── General ───────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
    },
  },
)
