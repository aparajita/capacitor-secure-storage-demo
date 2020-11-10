module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      { targets: { chrome: '50' }, useBuiltIns: 'entry' }
    ]
  ]
}
