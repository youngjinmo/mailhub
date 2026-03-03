/**
 * Shared ESLint base configuration factory for all sub-projects.
 *
 * No imports here — each project passes its own installed plugin instances
 * to avoid root-level node_modules dependency.
 *
 * @param {object} p
 * @param {import('@eslint/js')} p.js
 * @param {import('typescript-eslint')} p.tseslint
 * @param {object} p.eslintPluginPrettierRecommended - eslint-plugin-prettier/recommended
 * @param {import('typescript-eslint').ConfigArray} [p.tsConfigs] - defaults to tseslint.configs.recommended
 * @returns {import('typescript-eslint').ConfigArray}
 */
export function createBaseConfig({ js, tseslint, eslintPluginPrettierRecommended, tsConfigs }) {
  return [
    { ignores: ['node_modules', 'dist'] },
    js.configs.recommended,
    ...(tsConfigs ?? [...tseslint.configs.recommended]),
    eslintPluginPrettierRecommended,
    {
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  ];
}
