const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
const imageminOptipng = require('imagemin-optipng')

const path = require('path')
const {app} = require('electron').remote

// TODO: jpegtran返回相对路径 node_modules/jpegtran-bin/vendor/jpegtran
//       pngquant返回绝对路径 /node_modules/pngquant-bin/vendor/pngquant
// const jpegtranBinPath = require('jpegtran-bin')
// const pngquantBinPath = require('pngquant-bin')
const jpegtranBinPath = 'node_modules/jpegtran-bin/vendor/jpegtran'
const pngquantBinPath = 'node_modules/pngquant-bin/vendor/pngquant'
const optipngBinPath = 'node_modules/optipng-bin/vendor/optipng'

const isDev = process.env.NODE_ENV === 'development'
const baseDir = path.resolve(app.getAppPath()).replace('app.asar', 'app.asar.unpacked')
const jpegtranPath = isDev ? path.resolve(jpegtranBinPath) : path.resolve(baseDir, jpegtranBinPath)
const pngquantPath = isDev ? path.resolve(pngquantBinPath) : path.resolve(baseDir, pngquantBinPath)
const optipngPath = isDev ? path.resolve(optipngBinPath) : path.resolve(baseDir, optipngBinPath)

const min = async (files, options = {}) => {
  const singleFile = !Array.isArray(files)
  files = singleFile ? [files] : files
  options.speed = options.speed || 4
  options.quality = options.quality || 0.6

  const done = await imagemin(files, {
    // destination: 'build/images',
    glob: false,
    plugins: [
      imageminJpegtran({
        jpegtranPath,
      }),
      imageminPngquant({
        speed: options.speed,
        // strip: true, // unavailable on win, got '"--strip" is unsupported'
        quality: [options.quality, 1],
        pngquantPath,
      }),
      imageminOptipng({optipngPath}),
    ],
  })
  console.log(done)
  if (singleFile) {
    return done[0].data
  }
  return done.map(({data}) => data)
}

export default min
