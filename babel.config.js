module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        'corejs': 'core-js@2',
        'useBuiltIns': 'usage'
      }
    ],
    '@vue/app'
  ]
}
