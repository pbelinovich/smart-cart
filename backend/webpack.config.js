const configs = require('./configs')
const packageJson = require('./package.json')
const webpack = require('webpack')
const path = require('node:path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const server = configs.getDefaultConfig({
  module: 'server',
  externals: require('./externals'),
  entry: '/src/server/index.ts',
  outputFolder: './server',
  libraryTarget: 'commonjs2',
  target: 'node',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(packageJson.version),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(__dirname, './src/shared/parse-products.json'), to: path.join(__dirname, './server/parse-products.json') },
      ],
    }),
    new webpack.NormalModuleReplacementPlugin(/^xregexp$/, 'xregexp/xregexp-all'),
    new webpack.NormalModuleReplacementPlugin(
      /@shared/, // Регулярное выражение для поиска пути
      path.join(__dirname, './src/shared')
    ),
  ],
})

const processesConfig = configs.getDefaultConfig({
  module: 'processes',
  entry: './src/processes/index.ts',
  outputFolder: './processes',
  libraryTarget: 'commonjs2',
  externals: require('./externals'),
  target: 'node',
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^xregexp$/, 'xregexp/xregexp-all'),
    new webpack.NormalModuleReplacementPlugin(
      /@shared/, // Регулярное выражение для поиска пути
      path.join(__dirname, './src/shared')
    ),
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
      minimize: process.env.NODE_ENV === 'PRODUCTION',
    },
  },
  {
    ...processesConfig,
    node: {
      __dirname: false,
      __filename: false,
    },
    optimization: {
      minimize: process.env.NODE_ENV === 'PRODUCTION',
    },
  },
]
