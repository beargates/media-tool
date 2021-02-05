import ffmpeg from 'fluent-ffmpeg'

export default function (src, options, output) {
  return new Promise((resolve, reject) => {
    ffmpeg({logger: 'debug'})
      .input(src)
      .addOptions(options)
      .output(output)
      .on('start', console.log)
      .on('stderr', console.log)
      .on('error', err => {
        reject(err)
      })
      .on('end', () => {
        resolve(output)
      })
      .run()
  })
}
