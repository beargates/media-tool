const ffmpeg = require('fluent-ffmpeg')

import {preFuncPipe, warpPipe} from './pipe'
import {curry} from './curry'
import {checkParam, removeKey} from './curry-ext'
import {checkFileExistByContext} from './file-util'

// import {getLogger, setLogLevel} from './logger'
import {getLogger} from './logger'
const logger = getLogger('video-info')

export const getVideoScalaParam = (resolution, maxSize) => {
  const width = parseInt(resolution.split('x')[0])
  const height = parseInt(resolution.split('x')[1])
  const extParam = []
  const oldWidth = width - (width % 2)
  const oldHeight = height - (height % 2)
  const isFat = oldWidth > oldHeight
  const big = isFat ? oldWidth : oldHeight
  const small = isFat ? oldHeight : oldWidth
  let newBig = big
  let newSmall = small
  let newWidth = oldWidth
  let newHeight = oldHeight

  const rawMax = maxSize - (maxSize % 2)
  if (big > rawMax) {
    newBig = rawMax
    newSmall = parseInt((small * rawMax) / big)
    newSmall = newSmall - (newSmall % 2)
  }
  newWidth = isFat ? newBig : newSmall
  newHeight = isFat ? newSmall : newBig
  if (oldWidth !== width || oldHeight !== height) {
    extParam.push(`-vf crop=${oldWidth}:${oldHeight}:0:0`)
  }
  if (newBig !== big) {
    extParam.push(`-s ${newWidth}x${newHeight}`)
  }
  logger.log(
    'width',
    width,
    'height',
    height,
    'maxSize',
    maxSize,
    'oldWidth',
    oldWidth,
    'oldHeight',
    oldHeight,
    'newWidth',
    newWidth,
    'newHeight',
    newHeight,
    'extParam',
    extParam
  )
  return extParam
}

const procVideo = context => {
  const msgList = []
  // if (context.debug) setLogLevel('log')
  return new Promise(resolve => {
    const {srcVideo} = context
    ffmpeg()
      .input(srcVideo)
      .on('start', () => {
        // logger.log(`getVideoInfo commandLine: ${commandLine}`)
      })
      .on('stderr', err => msgList.push(err))
      .on('error', () => {
        resolve({...context, msgList})
      })
      .output(require('os').platform() === 'win32' ? 'NUL' : '/dev/null')
      .run()
  })
}

const matchResolution = context => {
  const {msgList} = context
  // logger.log('matchResolution msgList', msgList)
  let videoResolution
  for (const msg of msgList) {
    if (msg.includes('Video:')) {
      const matchList = msg.match(/[^\d](\d{1,4}x\d{1,4})[^\d]/)
      if (matchList && matchList?.length > 1) videoResolution = matchList[1]
    }
    if (msg.match(/rotate +: 90/)) {
      videoResolution = videoResolution.split('x').reverse().join('x')
    }
  }

  // return Promise.reject('获取视频分辨率失败')
  return {...context, videoResolution}
}

const matchCodeRate = context => {
  const {msgList} = context
  // logger.log('matchResolution msgList', msgList)
  let codeRate
  for (const msg of msgList) {
    if (msg.includes('Duration:')) {
      const matchList = msg.match(/bitrate: ([^ ]+) /)
      if (matchList?.length > 1) codeRate = matchList[1]
    }
  }

  // return Promise.reject('获取视频分辨率失败')
  return {...context, codeRate}
}

const matchDuration = context => {
  const {msgList} = context
  // logger.debug('matchDuration msgList', msgList)
  let videoDuration, videoDurationSecond, durations
  for (const msg of msgList) {
    if (msg.includes('Duration:')) {
      // logger.debug('Duration msg', msg)
      const matchList = msg.match(/Duration: ([^,]+),/)
      if (matchList?.length > 1) {
        videoDuration = matchList[1]
        durations = videoDuration.split(':')
        videoDurationSecond = parseInt(durations[0]) * 60 * 60 + parseInt(durations[1]) * 60 + parseFloat(durations[2])
        break
      }
    }
  }

  // return Promise.reject('获取视频时长失败')
  return {...context, videoDuration, videoDurationSecond}
}

const matchFPS = context => {
  const {msgList} = context
  // logger.log('matchResolution msgList', msgList)
  let fps
  for (const msg of msgList) {
    if (msg.includes('Video:')) {
      const matchList = msg.match(/ *([^,]+) fps/)
      console.log(matchList)
      if (matchList?.length > 1) fps = matchList[1]
    }
  }

  // return Promise.reject('获取视频分辨率失败')
  return {...context, fps}
}

export const getVideoInfo = context =>
  Promise.resolve(context).then(
    async context =>
      await warpPipe('getVideoInfo', context, [
        checkParam(['srcVideo']),
        checkFileExistByContext('srcVideo'),
        preFuncPipe('srcVideo no exist', context => !context.fileExist, [
          context => Promise.reject(`src ${context.srcVideo} no exist`),
        ]),
        context => {
          if (context.ffmpegPath) {
            ffmpeg.setFfmpegPath(context.ffmpegPath)
          }
          return context
        },
        procVideo,
        matchResolution,
        matchDuration,
        matchCodeRate,
        matchFPS,
        removeKey(['msgList']),
      ])
  )

export const getImageInfo = context =>
  Promise.resolve(context).then(
    async context =>
      await warpPipe('getVideoInfo', context, [
        checkParam(['srcVideo']),
        checkFileExistByContext('srcVideo'),
        preFuncPipe('srcVideo no exist', context => !context.fileExist, [
          context => Promise.reject(`src ${context.srcVideo} no exist`),
        ]),
        context => {
          if (context.ffmpegPath) {
            ffmpeg.setFfmpegPath(context.ffmpegPath)
          }
          return context
        },
        procVideo,
        matchResolution,
        removeKey(['msgList']),
      ])
  )

function getBlackFrame(context) {
  return new Promise(resolve => {
    const {src, inputParamList} = context

    const msgList = []

    ffmpeg()
      .addInput(src)
      .addInputOptions([...inputParamList])
      .addOptions(['-vf blackframe', '-v info', '-f null'])
      .on('start', commandLine => {
        logger.debug(`getBlackFrame commandLine: ${commandLine}`)
      })
      .on('stderr', err => msgList.push(err))
      .on('end', () => {
        resolve({
          ...context,
          blackFrame: msgList.some(item => item.match(/Parsed_blackframe/)),
        })
      })
      .output('-')
      .run()
  })
}

async function checkBlackFrame(context) {
  const {videoDurationSecond} = context
  const ret = await getBlackFrame({...context, inputParamList: [`-t 2`]})
  if (ret.blackFrame) return context
  return await getBlackFrame({
    ...context,
    inputParamList: [`-ss ${videoDurationSecond - 2}`, `-t 2`],
  })
}

export const checkBlackFrameWithHeadOrTail = context =>
  Promise.resolve(context).then(
    async context =>
      await warpPipe('checkBlackFrame', {debug: false, ...context}, [
        getVideoInfo,
        checkBlackFrame,
        context => ({...context, inputParamList: []}),
      ])
  )

export function checkVideoError(src) {
  let errMsg = ''
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(src)
      .addOptions(['-v error', '-f null'])
      .on('start', commandLine => {
        console.log(`checkVideoError commandLine: ${commandLine}`)
      })
      .on('stderr', err => {
        if (err.match(/Error while decoding stream/)) {
          errMsg = errMsg ? errMsg : err
        }
        // errMsg = errMsg ? errMsg : err
        // console.error(err)
      })
      .on('error', err => {
        reject(err)
      })
      .on('end', () => {
        if (errMsg) reject(`${src} have error`)
        else resolve(true)
      })
      .output('-')
      .run()
  })
}

export const checkByContextVideoError = curry((key, context) =>
  Promise.resolve(context).then(
    async context =>
      await warpPipe('checkByContextVideoError', context, [
        checkParam([key]),
        async context => {
          if (context.ffmpegPath) {
            ffmpeg.setFfmpegPath(context.ffmpegPath)
          }
          await checkVideoError(context[key])
          return context
        },
      ])
  )
)
