/* eslint-disable no-console */
const ora = require('ora')
const rm = require('rimraf')
const path = require('path')

const webpack = require('webpack')

const config = require('./webpack.config')
// console.dir(config)

const spinner = ora('building for ' + process.env.NODE_ENV + ' environment...')
spinner.start()

rm(path.join(config.output.path), err => {
  if (err) throw err
  webpack(config, (err, stats) => {
    spinner.stop()
    if (err) throw err
    process.stdout.write(
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
      }) + '\n\n'
    )

    if (stats.hasErrors()) {
      console.log(' Build failed with errors.\n')
      process.exit(1)
    }

    console.log(' Build complete.\n')
  })
})
