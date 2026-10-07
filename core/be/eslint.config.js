import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

// Ten role KHONG duoc xuat hien trong code (RBAC dynamic). Chi seed duoc phep.
const ROLE_NAME_PATTERN = '^(center[_\\s-]?manager|receptionist|coach|admin|administrator)$';
// URL / host phai nam trong bien moi truong.
// Luu y: trong selector esquery, dau "/" ben trong regex phai escape thanh "\/"
const URL_PATTERN = '^(https?:\\/\\/|localhost|127\\.0\\.0\\.1)';

const SIZE_LIMITS = {
  FILE_LINES: 200,
  FUNCTION_LINES: 60,
  DEPTH: 3,
  PARAMS: 4,
  COMPLEXITY: 10,
};

export default [
  { ignores: ['node_modules/**', 'prisma/migrations/**', 'coverage/**', 'dist/**'] },
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: { 'check-file': checkFile, jsdoc },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: {
      // ---------- Kich thuoc: file / ham ngan de nguoi moi doc duoc ----------
      'max-lines': [
        'error',
        { max: SIZE_LIMITS.FILE_LINES, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: SIZE_LIMITS.FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['error', SIZE_LIMITS.DEPTH],
      'max-params': ['error', SIZE_LIMITS.PARAMS],
      complexity: ['error', SIZE_LIMITS.COMPLEXITY],

      // ---------- Khong hardcode ----------
      'no-magic-numbers': [
        'error',
        { ignore: [0, 1, -1], ignoreArrayIndexes: true, enforceConst: true, detectObjects: false },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${ROLE_NAME_PATTERN}/i]`,
          message: 'Khong hardcode ten role. RBAC la dynamic: dung PERMISSIONS.* tu @scms/shared.',
        },
        {
          selector: `Literal[value=/${URL_PATTERN}/]`,
          message: 'Khong hardcode URL/host. Dua vao bien moi truong (src/config/env.js).',
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: 'Khong doc process.env truc tiep. Import { env } tu src/config/env.js.',
        },
      ],

      // ---------- Chat luong chung ----------
      'no-console': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'error',

      // ---------- Comment: ham export phai co JSDoc ----------
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-param-names': ['warn', { checkDestructured: false }],

      // ---------- Ten file & thu muc: kebab-case ----------
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.js': 'KEBAB_CASE', 'prisma/**/*.js': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
    },
  },
  {
    // Cac file duoc phep chua gia tri cau hinh / ten role (chi o day!)
    files: [
      'src/config/**',
      'src/constants/**',
      'prisma/**',
      'prisma.config.mjs',
      'eslint.config.js',
    ],
    rules: {
      'no-restricted-syntax': 'off',
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['**/*.test.js', 'tests/helpers/**/*.js'],
    rules: {
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
];
