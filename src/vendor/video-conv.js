const path = require('path')
const fs = require('fs')
const fsPromises = fs.promises

import {checkParam} from './curry-ext'

import {preFuncPipe, warpPipe} from './pipe'
import {checkFileExistByContext, mkdirByContext, removeFileByContext} from './file-util'

import {getFunByType, getLogger} from './logger'
const logger = getLogger('video-conv')

const ffmpeg = require('fluent-ffmpeg')

const convByHuohua = context =>
  new Promise((resolve, reject) => {
    const {src, audioRate, videoRate, inputParamList, filterParamList, outputParamList, mid} = context

    let command
    command = ffmpeg().input(src)

    inputParamList.reduce(
      (previous, current) => previous.addInput(current.src).addInputOptions(current.addInputOptions),
      command
    )

    command = command
      .addOptions([
        // ...inputParamList,

        ...filterParamList,

        '-vcodec libx264',
        '-crf ' + videoRate,

        // '-preset slow',
        // '-tune animation',
        // '-profile:v baseline',

        '-refs 6',
        '-bf 6',
        '-deblock 1:1',
        '-qcomp 0.5',
        '-psy-rd 0.3:0',
        '-aq-mode 2',
        '-aq-strength 0.8',

        // '-aq-mode 1',
        // '-bf 6',
        // '-subq 4',
        // '-refs 4',

        '-c:a aac',
        '-profile:a aac_low',
        '-ab ' + audioRate,
        '-ar 44100',
        '-ac 2',

        // '-direct-pred auto',
        '-movflags faststart',
        '-pix_fmt yuv420p',

        '-map_metadata -1',
        '-map_chapters -1',
        `-metadata copyright=huohua.cn-${videoRate}`,

        ...outputParamList,

        '-v warning',
        '-f mp4',
      ])
      .output(mid)
      .on('start', commandLine => {
        logger.info(`convByHuohua commandLine: ${commandLine}`)
      })
      .on('end', () => {
        resolve(context)
      })
      .on('stderr', function () {})
      .on('error', (err, stdout, stderr) => {
        // logger.error(err, stdout, stderr)
        // return reject(err)
        return removeFileByContext('mid')(context).then(() => reject([err, stdout, stderr]))
      })

    command.run()
  })

const convByXiaowan = context =>
  new Promise((resolve, reject) => {
    const {src, audioRate, videoRate, inputParamList, filterParamList, outputParamList, mid} = context

    let command
    command = ffmpeg().input(src)

    inputParamList.reduce(
      (previous, current) => previous.addInput(current.src).addInputOptions(current.addInputOptions),
      command
    )

    command = command
      .addOptions([
        // ...inputParamList,

        ...filterParamList,

        '-vcodec libx264',
        '-crf ' + videoRate,
        // '-x264opts "crf=20:preset=8:I=240:r=4:b=3:me=umh:i=1:scenecut=60"',
        // '-preset slow',
        // '-tune animation',
        // '-profile:v baseline',
        // -f 1:1

        // '-sc_threshold 60',
        // '-g 240',
        // '-me_method umh',
        // '-refs 4',
        // '-bf 3',

        '-qcomp 0.5',
        '-psy-rd 0.3:0',
        '-aq-mode 2',
        '-aq-strength 0.8',

        // '-aq-mode 1',
        // '-bf 6',
        // '-subq 4',
        // '-refs 4',

        '-c:a aac',
        '-profile:a aac_low',
        '-ab ' + audioRate,
        '-ar 44100',
        '-ac 2',

        // '-direct-pred auto',
        '-movflags faststart',
        '-pix_fmt yuv420p',

        '-map_metadata -1',
        '-map_chapters -1',
        `-metadata copyright=huohua.cn-${videoRate}`,

        ...outputParamList,

        '-v warning',
        '-f mp4',
      ])
      .output(mid)
      .on('start', commandLine => {
        logger.info(`convByHuohua commandLine: ${commandLine}`)
      })
      .on('end', () => {
        resolve(context)
      })
      .on('stderr', function () {})
      .on('error', (err, stdout, stderr) => {
        // logger.error(err, stdout, stderr)
        // return reject(err)
        return removeFileByContext('mid')(context).then(() => reject([err, stdout, stderr]))
      })

    command.run()
  })

const videoCopy = context =>
  new Promise((resolve, reject) => {
    const {src, outputParamList, mid} = context
    ffmpeg()
      .input(src)
      .addOptions([
        '-c copy',
        '-bsf:a aac_adtstoasc',
        '-bsf:v h264_mp4toannexb',

        '-map_metadata -1',
        '-map_chapters -1',
        '-movflags faststart',
        '-pix_fmt yuv420p',

        ...outputParamList, //可以处理空数组
        //   '-v info', // info 状态下才有进度
        '-v warning',
        '-f mp4',
      ])
      .output(mid)
      .on('start', commandLine => {
        logger.log(`convMP4Huohua commandLine: ${commandLine}`)
      })
      .on('end', () => {
        resolve(context)
      })
      .on('stderr', function () {})
      .on('error', (err, stdout, stderr) => {
        // logger.error(err, stdout, stderr)
        // return reject(err)
        return removeFileByContext('mid')(context).then(() => reject([err, stdout, stderr]))
      })
      .run()
  })

const convToFMP4 = context =>
  new Promise((resolve, reject) => {
    const {src, outputParamList, mid} = context
    ffmpeg()
      .input(src)
      .addOptions([
        '-c copy',
        '-hls_segment_type fmp4',
        '-hls_flags single_file',
        '-hls_time 1',
        '-hls_playlist_type event',

        '-map_metadata -1',
        '-map_chapters -1',
        ...outputParamList, //可以处理空数组
        //   '-v info', // info 状态下才有进度
        '-v warning',
      ])
      .output(mid)
      .on('start', commandLine => {
        logger.log(`convToFMP4 commandLine: ${commandLine}`)
      })
      .on('end', () => {
        resolve(context)
      })
      .on('stderr', function () {})
      .on('error', (err, stdout, stderr) => {
        // logger.error(err, stdout, stderr)
        // return reject(err)
        return removeFileByContext('mid')(context).then(() => reject([err, stdout, stderr]))
      })
      .run()
  })
function convByPass1(context) {
  return new Promise((resolve, reject) => {
    const {convVideo, src, videoRate, inputParamList, outputParamList, logDir, devNull} = context
    if (convVideo) {
      ffmpeg()
        .input(src) // path.normalize规避wndows和linux路径的差异
        .addOptions([
          ...inputParamList,

          '-vcodec libx264',
          '-pass 1',
          `-passlogfile ${path.resolve(logDir, 'conv_mp4.log')}`,

          '-bf 6',

          '-subq 1',
          `-b:v ${videoRate}`,
          '-direct-pred auto',
          '-pix_fmt yuv420p',

          ...outputParamList,

          // '-v info', // info 状态下才有进度
          '-v warning',

          '-f mp4',
        ])
        .output(devNull)
        .on('start', commandLine => {
          logger.log(`convMP4Pass1 commandLine: ${commandLine}`)
        })
        .on('end', () => {
          return resolve(context)
        })
        .on('stderr', function () {})
        .on('error', (err, stdout, stderr) => {
          // logger.error(err, stdout, stderr)
          return reject([err, stdout, stderr])
        })
        .run()
    } else {
      return resolve(context)
    }
  })
}

function convByPass2(context) {
  return new Promise((resolve, reject) => {
    const {
      src,
      audioRate,
      convAudio,
      convToMp3,
      convVideo,
      videoRate,
      inputParamList,
      outputParamList,
      mid,
      logDir,
    } = context
    let audioParms = convAudio
      ? ['-c:a aac', '-profile:a aac_low', '-ab ' + audioRate, '-ar 48000', '-ac 2']
      : ['-codec:a:0 copy']

    let videoParms = convVideo
      ? [
          '-vcodec libx264',
          '-pass 2',
          '-passlogfile ' + path.resolve(logDir, 'conv_mp4.log'),
          '-direct-pred auto',

          // '-aq-mode 1',
          // '-bf 6',
          // '-subq 4',
          // '-refs 4',
          // '-me_method umh',

          '-refs 6',
          '-bf 6',
          '-deblock 1:1',
          '-qcomp 0.5',
          '-psy-rd 0.3:0',
          '-aq-mode 2',
          '-aq-strength 0.8',

          '-b:v ' + videoRate,
        ]
      : ['-codec:v copy']

    if (convToMp3) {
      audioParms = ['-c:a mp3', '-ab ' + audioRate]
      videoParms = []
    }

    ffmpeg()
      .input(src)
      .addOptions([
        ...inputParamList,

        ...videoParms,
        ...audioParms,

        '-map_metadata -1',
        '-map_chapters -1',
        '-movflags faststart',
        '-pix_fmt yuv420p',

        ...outputParamList,

        // '-v info', // info 状态下才有进度
        '-v warning',

        `-f ${convToMp3 ? 'mp3' : 'mp4'}`,
      ])
      .output(mid)
      .on('start', commandLine => {
        logger.log(`convMP4Pass2 commandLine: ${commandLine}`)
      })
      .on('end', () => {
        logger.info(`文件 ${src} 转码完成`)
        return resolve(context)
      })
      .on('stderr', function () {})
      .on('error', (err, stdout, stderr) => {
        // logger.error(err, stdout, stderr)
        // return reject(err)
        return removeFileByContext('mid')(context).then(() => reject([err, stdout, stderr]))
      })
      .run()
  })
}

const convBy2Pass = context =>
  Promise.resolve(context).then(
    async context => await warpPipe('convBy2Pass', {debug: true, ...context}, [convByPass1, convByPass2])
  )

const videoConvMap = {
  '2pass': convBy2Pass,
  copy: videoCopy,
  huohua: convByHuohua,
  fmp4: convToFMP4,
  xiaowan: convByXiaowan,
}

function init(context) {
  const devNull = require('os').platform() === 'win32' ? 'NUL' : '/dev/null'

  const {ffmpegPath, baseDir, src, dst} = context
  const logDir = baseDir ? path.resolve(baseDir, 'logs') : null

  if (ffmpegPath) {
    logger.info('setFfmpegPath', ffmpegPath)
    ffmpeg.setFfmpegPath(ffmpegPath)
  }

  const mid = dst ? dst : src.replace(/(.+)\.[^.]+$/, '$1') + '.tmp'
  return {...context, dst, devNull, logDir, mid}
}

export async function after(context) {
  const {src, dst, mid, removeSrc} = context
  /*
  不指定目标文件:
     移除源文件:
        移除源文件,目标文件命名为源文件名,且扩展名替换为.mp4
     不移除源文件:
        源文件扩展名是 .mp4:
           src 加后缀 .old,目标文件命名为源文件
        源文件扩展名不是 .mp4
           src 不变,目标文件命名为源文件名,且扩展名替换为.mp4
  指定目标文件:
     移除源文件:
        移除源文件,目标文件不变
     不移除源文件:  
        源文件和目标文件都不变
  */
  let final
  if (!dst) {
    if (removeSrc) {
      // logger.log('移除源文件')
      await fsPromises.unlink(src)
      final = `${src.replace(/\.[^.]+$/, '.mp4')}`
      // await fsPromises.rename(mid, final)
    } else {
      // logger.log('不移除源文件')
      if (src.match(/\.mp4$/i)) {
        // logger.log('源文件扩展名是 .mp4')
        await fsPromises.rename(src, `${src}.old`)
        final = `${src}`
        // await fsPromises.rename(mid, final)
      } else {
        // logger.log('源文件扩展名不是 .mp4')
        final = `${src.replace(/\.[^.]+$/, '.mp4')}`
        // await fsPromises.rename(mid, final)
      }
    }
    await fsPromises.rename(mid, final)
  } else {
    final = dst
    if (removeSrc) await fsPromises.unlink(src)
  }

  return {...context, final, status: true}
}

export const videoConv = context =>
  Promise.resolve(context).then(async context => {
    const options = {
      debug: false,
      convType: 'huohua',
      convAudio: true,
      convVideo: true,
      removeSrc: false,
      inputParamList: [],
      outputParamList: [],
      filterParamList: [],
      ...context,
    }
    return await warpPipe('videoConv', options, [
      checkParam(['src', 'convType']),
      checkFileExistByContext('src'),
      preFuncPipe('src no exist', context => !context.fileExist, [
        context => Promise.reject(`src ${context.src} no exist`),
      ]),
      init,
      preFuncPipe('need logDir', context => context.logDir, [mkdirByContext('logDir')]),
      getFunByType('convType', videoConvMap),
      after,
    ])
  })
