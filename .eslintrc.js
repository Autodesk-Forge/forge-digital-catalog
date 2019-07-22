module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: [
        "plugin:security:recommended",
        "plugin:vue/essential"
    ],
    parserOptions: {
        ecmaVersion: 2017,
        parser: 'babel-eslint',
        sourceType: 'module'
    },
    rules: {
        'no-console': 'off',
        'semi': 0
    },
    root: true,
    plugins: ['security', 'vue']
}