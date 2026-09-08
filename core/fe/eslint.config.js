import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

// Ten role KHONG duoc xuat hien trong code (RBAC dynamic).
const ROLE_NAME_PATTERN = '^(center[_\\s-]?manager|receptionist|coach|admin|administrator)$';
// URL / host phai nam trong bien moi truong (VITE_*).
// Luu y: trong selector esquery, dau "/" ben trong regex phai escape thanh "\/"
const URL_PATTERN = '^(https?:\\/\\/|localhost|127\\.0\\.0\\.1)';

const SIZE_LIMITS = {
  FILE_LINES: 200,
  FUNCTION_LINES_JS: 60,
  FUNCTION_LINES_JSX: 80,
  DEPTH: 3,
  PARAMS: 4,
  COMPLEXITY: 10,
};

const NO_HARDCODE_RULES = {
  'no-restricted-syntax': [
    'error',
    {
      selector: `Literal[value=/${ROLE_NAME_PATTERN}/i]`,
      message: 'Khong hardcode ten role. Dung PERMISSIONS.* tu @scms/shared + usePermission().',
    },
    {
      selector: `Literal[value=/${URL_PATTERN}/]`,
      message: 'Khong hardcode URL/host. Dua vao .env (VITE_*) va doc qua src/config/env.js.',
    },
    {
      selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
      message: 'Khong doc import.meta.env truc tiep. Import { env } tu src/config/env.js.',
    },
  ],
};

export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  prettier,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'check-file': checkFile },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'max-lines': [
        'error',
        { max: SIZE_LIMITS.FILE_LINES, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['error', SIZE_LIMITS.DEPTH],
      'max-params': ['error', SIZE_LIMITS.PARAMS],
      complexity: ['error', SIZE_LIMITS.COMPLEXITY],
      ...NO_HARDCODE_RULES,
      'no-console': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      'no-duplicate-imports': 'error',
      // Ten file: component/page/layout = PascalCase.jsx; hook = useXxx.js; con lai camelCase
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/{components,pages,layouts}/**/*.jsx': 'PASCAL_CASE',
          'src/hooks/**/*.js': 'CAMEL_CASE',
          'src/{services,stores,utils,config,constants,mocks,theme}/**/*.js': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
    },
  },
  {
    // File logic thuan (.js): ham ngan hon, cam magic number
    files: ['src/**/*.js'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: SIZE_LIMITS.FUNCTION_LINES_JS, skipBlankLines: true, skipComments: true },
      ],
      'no-magic-numbers': [
        'error',
        { ignore: [0, 1, -1], ignoreArrayIndexes: true, enforceConst: true, detectObjects: false },
      ],
    },
  },
  {
    // Component (.jsx): cho phep dai hon mot chut vi JSX; so trong style/props phai vao theme/constants
    files: ['src/**/*.jsx'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: SIZE_LIMITS.FUNCTION_LINES_JSX, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // Noi duy nhat duoc doc env / chua gia tri cau hinh / mock
    files: [
      'src/config/**',
      'src/constants/**',
      'src/theme/**',
      'src/mocks/**',
      'vite.config.js',
      'eslint.config.js',
    ],
    rules: {
      'no-restricted-syntax': 'off',
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    // File cau hinh chay bang Node (khong phai trinh duyet)
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // routeRegistry khai bao lazy component + mang route trong cung file (khong can fast refresh)
    files: ['src/router/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.test.{js,jsx}'],
    rules: { 'no-magic-numbers': 'off', 'max-lines-per-function': 'off' },
  },
];
