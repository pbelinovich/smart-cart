/*eslint-env node*/
const presets = [
  [
    '@babel/preset-env',
    {
      corejs: { version: 3 },
      useBuiltIns: 'usage',
      targets: {
        edge: '12',
        firefox: '34',
        chrome: '37',
        safari: '7.1',
        ie: '11',
        opera: '24',
      },
    },
  ],
]
const plugins = [
  ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
  ['@babel/plugin-proposal-class-properties'],
  ['@babel/transform-runtime'],
  ['@babel/plugin-transform-modules-commonjs'],
]

module.exports = {
  presets,
  plugins,
}
