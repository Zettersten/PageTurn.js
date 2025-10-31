import js from '@eslint/js';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default ts.config(js.configs.recommended, ts.configs.recommendedTypeChecked, prettier, {
  files: ['src/**/*.ts'],
  ignores: ['src/legacy/**'],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json'
    }
  },
  rules: {
    'no-console': 'warn'
  }
});
