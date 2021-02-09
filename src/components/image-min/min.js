const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

const min = async (files, options) => {
  const singleFile = !Array.isArray(files)
  files = singleFile ? [files] : files
  const done = await imagemin(files, {
    // destination: 'build/images',
    glob: false,
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        speed: 1,
        strip: true,
        quality: [0.6, 0.8],
      }),
    ],
  })
  console.log(done)
  if (singleFile) {
    return done[0].data
  }
  return done.map(({data}) => data)
}

export default min
