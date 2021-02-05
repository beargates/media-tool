const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const devMode = process.env.NODE_ENV !== 'production'
console.log('devMode', devMode)
module.exports = {
  devtool: devMode ? 'cheap-module-eval-source-map' : 'source-map',
  entry: {
    app: ['src/index.js'].concat(devMode ? ['webpack-hot-middleware/client'] : []), // 手动执行 webpack-hot-middleware 必选
  },
  mode: devMode ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.(le|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            },
          },
        ],
      },
      {
        test: /\/node_modules\/iconv-lite\/.+/,
        resolve: {
          aliasFields: ['main'],
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {node: '10'},
                  useBuiltIns: 'entry',
                  corejs: {version: 3, proposals: true},
                  loose: true,
                },
              ],
              '@babel/preset-react',
            ],
            plugins: [
              ['@babel/plugin-proposal-class-properties', {loose: true}],
              ['@babel/plugin-proposal-optional-chaining', {loose: true}],
              // ["@babel/plugin-proposal-decorators", {"legacy": true}],
              'react-hot-loader/babel',
            ],
            parserOpts: {
              allowReturnOutsideFunction: true,
            },
          },
        },
      },
    ],
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          safe: true,
        },
      }),
    ],
  },
  output: {
    filename: devMode ? '[name].js' : '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },
  plugins: [
    new webpack.DefinePlugin({
      ...process.env.stringified,
      'process.env.FLUENTFFMPEG_COV': false,
    }),
    new HtmlWebpackPlugin({
      title:
        require('./package.json').description +
        ' v' +
        require('./package.json').version +
        ' 基于 electron ' +
        require('./package.json').devDependencies['electron'],
      // inlineSource: 'runtime~.+\\.js'
    }),
    new webpack.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 8,
    }),
  ].concat(
    devMode
      ? [new webpack.HotModuleReplacementPlugin()]
      : [
          new MiniCssExtractPlugin({
            filename: devMode ? '[name].css' : '[contenthash].css',
            chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
          }),
        ]
  ),
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
      src: path.resolve(__dirname, 'src'),
    },
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    extensions: ['.js', '.jsx', '.json'],
  },
  target: 'electron-renderer',
}
