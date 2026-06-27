import { solvro } from '@solvro/config/eslint';

export default solvro({
  ignores: [
    '.next',
    '.turbo',
    '.vscode-test',
    'apps/*/.next',
    'apps/*/out',
    'node_modules',
    'out',
    'packages/*/dist',
  ],
}, {
  files: ['apps/web/src/app/**/*.{ts,tsx}'],
  rules: {
    'import/no-default-export': 'off',
  },
});
