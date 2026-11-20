import js from '@eslint/js';
import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import security from 'eslint-plugin-security';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.temp/**'] },
  js.configs.recommended,
  // Flags DOM XSS sinks such as innerHTML and insertAdjacentHTML, and common unsafe patterns.
  noUnsanitized.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.jsx', 'packages/*/src/**/*.js'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ['*.config.js', '**/vite.config.js', 'scripts/**/*.js', 'vitest.setup.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Throwaway spike runners: they build into `.temp/`, import a config by path, and run some code
    // in the browser inside page.evaluate.
    files: ['docs/design/spikes/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'security/detect-non-literal-fs-filename': 'off', 'no-unsanitized/method': 'off' },
  },
];
