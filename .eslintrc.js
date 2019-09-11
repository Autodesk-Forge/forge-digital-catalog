module.exports = {
    env: {
        es6: true,
        node: true
    },
    extends: [
        "plugin:promise/recommended",
        "plugin:vue/recommended"
    ],
    parserOptions: {
        ecmaVersion: 2017,
        parser: 'babel-eslint',
        sourceType: 'module'
    },
    plugins: ['promise', 'vue', 'vuetify'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'semi': 0,
        'vuetify/grid-unknown-attributes': 'error',
        'vuetify/no-deprecated-classes': 'error',
        'vuetify/no-legacy-grid': 'error'
    },
    root: true
}