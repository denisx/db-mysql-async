module.exports = {
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module'
    },
    env: {
        browser: true,
        es6: true,
        commonjs: true,
        'jest/globals': true
    },
    extends: [
        'plugin:import/recommended',
        'plugin:promise/recommended',
        'plugin:sonarjs/recommended',
        'airbnb',
        'prettier'
    ],
    plugins: ['jest', 'import', 'prettier', 'promise', 'sonarjs', 'filenames'],
    rules: {
        indent: [
            'warn',
            4,
            {
                SwitchCase: 1
            }
        ],

        'newline-after-var': ['error', 'always'],
        'newline-before-return': 'error',

        'filenames/match-regex': ['error', '^[a-z]+([a-z-.]+[a-z]+)*$'],

        'promise/always-return': 'off',
        'promise/catch-or-return': 'error',
        'promise/no-nesting': 'off',

        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                tabWidth: 4,
                semi: false
            }
        ]
    }
}
