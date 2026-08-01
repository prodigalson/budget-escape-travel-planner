import js from '@eslint/js';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        CustomEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
      },
    },
  },
];
