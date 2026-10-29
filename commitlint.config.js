// Commit message: <type>(<scope>): <short English description>
// type: feat | fix | docs | style | refactor | perf | test | chore | revert
// example: feat(class): add class enrollment API
// Rules: English only (no Vietnamese), and no AI co-author trailers.
const NON_ENGLISH = /[^\x09\x0A\x0D\x20-\x7E]/;
const AI_TRAILER =
  /co-authored-by:.*(claude|anthropic|copilot|chatgpt|openai|gemini)|generated with/i;

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'english-only': (parsed) => {
          const text = parsed.raw ?? '';
          return [
            !NON_ENGLISH.test(text),
            'commit message must be written in English (ASCII only)',
          ];
        },
        'no-ai-coauthor': (parsed) => {
          const text = parsed.raw ?? '';
          return [
            !AI_TRAILER.test(text),
            'do not add AI tools as co-author or "generated with" lines',
          ];
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'english-only': [2, 'always'],
    'no-ai-coauthor': [2, 'always'],
  },
};
