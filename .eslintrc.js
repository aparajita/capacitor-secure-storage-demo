module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:prettier-vue/recommended',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  settings: {
    'prettier-vue': {
      SFCBlocks: {
        template: false,
        script: true,
        style: true,

        customBlocks: {
          docs: { lang: 'markdown' },
          config: { lang: 'json' },
          module: { lang: 'ts' },
          comments: false
        }
      },

      usePrettierrc: true,
      fileInfoOptions: {
        ignorePath: '.testignore',
        withNodeModules: false
      }
    }
  },
  globals: {
    process: true
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-deprecated-slot-attribute': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  overrides: [
    {
      files: ['**/*.vue'],
      parserOptions: {
        ecmaVersion: 2017
      },
      env: {
        browser: true
      }
    },
    {
      files: ['**/*.js'],
      parserOptions: {
        ecmaVersion: 2020
      },
      env: {
        node: true
      }
    },
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
