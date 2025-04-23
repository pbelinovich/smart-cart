const configs = require('./configs')
const plugins = require('./configs/plugins')
const packageJson = require('./package.json')
const webpack = require('webpack')

const server = configs.getDefaultConfig({
  module: 'server',
  externals: require('./externals'),
  entry: '/src/server/index.ts',
  outputFolder: './server',
  libraryTarget: 'commonjs2',
  target: 'node',
  plugins: [
    new plugins.IndexDtsGenerator({ folder: 'server' }),
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(packageJson.version),
    }),
    new webpack.NormalModuleReplacementPlugin(/^xregexp$/, 'xregexp/xregexp-all'),
  ],
})

server.module.rules.push({
  test: /.node$/,
  loader: 'node-loader',
})

module.exports = [
  {
    ...server,
    node: {
      __dirname: false,
      __filename: false,
    },
    optimization: {
      minimize: false,
    },
  },
]
