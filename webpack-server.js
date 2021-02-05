/* eslint-disable no-console */
const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')

const app = express()

const config = require('./webpack.config.js')
// console.dir(config)

const compiler = webpack(config)

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    // stats: {}
  })
)
app.use(require('webpack-hot-middleware')(compiler))

app.listen(3001, function() {
  console.log('listening on port 3001!\n')
})
