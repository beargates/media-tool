// import {getType, arrayBuffer2hex, dataView2hex, uint8Array2hex} from './type-util'
import {curry} from './curry'
// import {getGlobalObj} from './global-util'

const getGlobalThis = () => {
  // eslint-disable-next-line no-undef
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof self !== 'undefined') return self
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  // if (typeof this !== 'undefined') return this
  throw new Error('Unable to locate global `this`')
}

export function getGlobalObj(name, context) {
  const KEY = Symbol.for(name)
  if (!getGlobalThis()[KEY]) {
    getGlobalThis()[KEY] = {...context}
  }
  return getGlobalThis()[KEY]
}

const logLevelMap = {
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5,
  fatal: 6,
}

const logMap = getGlobalObj('lws.logger', {
  loggers: {},
  privates: {},
  cacheList: [],
  currLevel: 'info',
  writeCache: false,
  cutHuge: false,
})

export function setLogLevel(logLevel) {
  if (typeof logLevel !== 'string' || !logLevelMap[logLevel]) throw 'setLevel error: logLevel invalid'
  logMap.currLevel = logLevel
}

export function setExternalLogger(externalLogger) {
  if (externalLogger) logMap.externalLogger = externalLogger
}

export function getLogLevel() {
  return logMap.currLevel
}

export const getFunByType = (funType, funMap) =>
  async function funByType(context) {
    const fun = funMap[context[funType]]
    if (!fun) return Promise.reject(`invalid funType:${funType}`)
    return await fun(context)
  }

export function fmtDate(fmt, _date) {
  const date = new Date(_date)
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }

  return fmt
}

function pad(n, width, z = '0') {
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

export const getType = arg => Object.prototype.toString.call(arg).split(' ')[1].slice(0, -1)

export function arrayBuffer2hex(buf) {
  const view = new Uint8Array(buf)
  const hex = Array.from(view).map(v => pad(v.toString(16), 2))
  return hex.join(' ')
}

export function uint8Array2hex(u8Array) {
  const hex = Array.from(u8Array).map(v => pad(v.toString(16), 2))
  return hex.join(' ')
}

export function dataView2hex(view) {
  return arrayBuffer2hex(view.buffer)
}

export function str2ArrayBuffer(str) {
  const len = str.length
  const buffer = new ArrayBuffer(len)
  const dataView = new DataView(buffer)
  const textEncoder = new TextEncoder()
  for (let i = 0; i < len; i++) {
    dataView.setUint8(i, textEncoder.encode(str[i]))
  }

  return buffer
}

export function hex2ArrayBuffer(str) {
  if (str) {
    const hexList = str.split(' ')
    const view = new Uint8Array(hexList.length)

    for (let i = 0; i < hexList.length; i++) {
      view[i] = parseInt(hexList[i], 16)
    }

    return view.buffer
  } else {
    return new ArrayBuffer(0)
  }
}

export function hex2Uint8Array(str) {
  const hexList = str.split(' ')
  const view = new Uint8Array(hexList.length)

  for (let i = 0; i < hexList.length; i++) {
    view[i] = parseInt(hexList[i], 16)
  }
  return view
}

export function buffer2Str(buf) {
  const {StringDecoder} = require('string_decoder')
  const decoder = new StringDecoder('utf8')

  const cent = Buffer.from(buf)
  return decoder.write(cent)
}

function procArray(array) {
  if (array.length > 20) array = [...array.slice(0, 19), '...']
  for (let i = 0; i < array.length; i++) {
    const value = array[i]
    if (Array.isArray(value)) array[i] = procArray([...value])
    if (typeof value === 'object' && !Array.isArray(value)) array[i] = procObj({...value})
    if (typeof value === 'string' && value.length > 500) array[i] = value.slice(0, 499) + '...'
  }
  return array
}

function procObj(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (Array.isArray(value)) obj[key] = procArray([...value])
    if (typeof value === 'object' && !Array.isArray(value)) obj[key] = procObj({...value})
    if (typeof value === 'string' && value.length > 500) obj[key] = value.slice(0, 499) + '...'
  }
  return obj
}

const getHugeArray = array => {
  const newArray = [...array]

  return procArray(newArray)
}

const getHugeObject = obj => {
  const newObj = {...obj}

  return procObj(newObj)
}

const cacheLogs = curry(function cacheLogs(owner, name, levelName, ...args) {
  if (logMap.externalLogger) {
    //
  } else {
    if (logMap.privates[owner].localLogLevel) {
      if (logLevelMap[logMap.privates[owner].currLevel] > logLevelMap[levelName]) {
        return
      }
    } else {
      if (logLevelMap[logMap.currLevel] > logLevelMap[levelName]) {
        return
      }
    }
  }

  const currentCache = []
  for (const arg of args) {
    const rawType = getType(arg)
    if (rawType === 'ArrayBuffer') {
      currentCache.push(rawType, arrayBuffer2hex(arg))
    } else if (rawType === 'DataView') {
      currentCache.push(rawType, dataView2hex(arg))
    } else if (rawType === 'Uint8Array') {
      currentCache.push(rawType, uint8Array2hex(arg))
    } else if (rawType === 'Error') {
      currentCache.push(arg.stack)
    } else if (rawType === 'Map' || rawType === 'Set') {
      currentCache.push(rawType, JSON.stringify([...arg], null, 2))
    } else if (rawType === 'Object') {
      try {
        currentCache.push(JSON.stringify(logMap.cutHuge ? getHugeObject(arg) : arg, null, 2))
      } catch (err) {
        currentCache.push(arg)
      }
    } else if (rawType === 'Array') {
      currentCache.push(JSON.stringify(logMap.cutHuge ? getHugeArray(arg) : arg, null, 2))
    } else if (rawType === 'Undefined') {
      currentCache.push('Undefined')
    } else if (rawType === 'Null') {
      // currentCache.push('Null')
    } else {
      currentCache.push(arg)
    }
  }

  const msg =
    currentCache.length === 1 && currentCache[0] === '\n'
      ? ['\n']
      : [`${name} [${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())}] [${levelName}]`, ...currentCache]

  // const msg = [`${name} [${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())}] [${levelName}]`, ...currentCache]

  if (logMap.externalLogger) {
    logMap.externalLogger[levelName](...currentCache)
  } else {
    if (console && console.log && msg.length) {
      console.log(...msg)
    }
    if (logMap.writeCache) logMap.cacheList.push(msg.join(' '))
  }
}, 4)

export function getLogger(name, {isCached = false, localLogLevel = false, isCutHuge = false} = {}) {
  if (typeof name !== 'string') throw 'getLogger owner invalid'

  // 每次都不一样
  const owner = Symbol('lws.loggerOwner')

  logMap.loggers[owner] = {}
  for (const levelName of Object.keys(logLevelMap)) {
    logMap.loggers[owner][levelName] = cacheLogs(owner, name, levelName)
  }

  logMap.privates[owner] = {}
  logMap.privates[owner].localLogLevel = localLogLevel
  logMap.privates[owner].currLevel = 'info'

  // 一次设置为 true 全局生效
  if (isCached) logMap.writeCache = true

  logMap.loggers[owner].cacheList = () => logMap.cacheList

  // 一次设置为 true 全局生效
  if (isCutHuge) {
    // logMap.loggers[owner].info('isCutHuge is true')
    logMap.cutHuge = true
  }

  if (localLogLevel) {
    logMap.loggers[owner].setLogLevel = logLevel => {
      if (typeof logLevel !== 'string' || !logLevelMap[logLevel]) throw 'setLevel error: logLevel invalid'
      logMap.privates[owner].currLevel = logLevel
    }
    logMap.loggers[owner].getLogLevel = () => logMap.privates[owner].currLevel
  }

  return logMap.loggers[owner]
}

export function getURLPrefix() {
  console.log(document.location)
  return `${document.location.protocol}//${document.location.host}`
}

export function getBreadcrumbs(pathName) {
  if (pathName === '/') return [[], '/']
  const linkList = pathName
    .split('/')
    .slice(1)
    .reduce((sum, curr) => [...sum, sum[sum.length - 1].concat(`/${curr}`).replace(/\/+/, '/')], ['/'])

  return [linkList.slice(0, -1), linkList.slice(-1).join('')]
}
