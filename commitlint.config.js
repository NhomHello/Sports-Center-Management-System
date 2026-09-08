// Commit message: <type>(<scope>): <mo ta ngan>
// type: feat | fix | docs | style | refactor | test | chore
// vi du: feat(class): them API dang ky lop
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
