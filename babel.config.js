module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        'corejs': 'core-js@3',
        'useBuiltIns': 'usage'
      }
    ],
    '@vue/app'
  ]
}
