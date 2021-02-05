import {curry} from './curry'

export const checkParam = curry(function checkParam(paramList, context) {
  if (!context) return Promise.reject(`checkParam context invalid`)
  if (!Array.isArray(paramList)) return Promise.reject('checkParam paramList not array')
  const errList = []
  for (const param of paramList) {
    if (context[param] === undefined || context[param] === null) errList.push(param)
  }

  if (errList.length) return Promise.reject(`checkParam param: ${errList} invalid`)
  return context
})

export const removeKey = curry(function removeKey(keys, context) {
  if (!context) return Promise.reject(`removeKey context invalid`)
  const list = Array.isArray(keys) ? keys : [keys]

  for (const key of list) {
    if (context[key]) delete context[key]
    else return Promise.reject(`removeKey key:${key} non exist`)
  }
  return context
})

export async function fetchToJson(url, options = {}) {
  try {
    let ret = await fetch(url, options)
    const reqUrl = ret.url

    let msg

    if (!ret.ok) {
      msg = `fetchToJson status error:${ret.status},url: ${reqUrl}`
      ret = await ret.text()
      if (!options.slice) console.error(`fetchToJson result error,url:`, reqUrl, ',body\n', ret.split('\n'), '\n')
      return Promise.reject(msg)
    }
    ret = await ret.text()
    try {
      return JSON.parse(ret)
    } catch (err) {
      return ret
    }
  } catch (err) {
    return Promise.reject(`fetchToJson err,url:${url}`)
  }
}

export const fetchByContextToJson = curry(async function fetchByContextToJson(url, options, context) {
  const fetchRet = await fetchToJson(url, options)
  return {...context, fetchRet}
})

export async function fetchWithHuohua(url, options = {}) {
  const fetchRet = await fetchToJson(url, options)
  return fetchRet.success ? fetchRet : Promise.reject(JSON.stringify(fetchRet))
}

export const fetchByContextWithHuohua = curry(async function fetchByContextWithHuohua(url, options, context) {
  const fetchRet = await fetchToJson(url, options)
  return fetchRet.success ? {...context, fetchRet} : Promise.reject(JSON.stringify(fetchRet))
})

export function sleepResolve(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function sleepReject(time) {
  return new Promise((resolve, reject) => setTimeout(reject, time))
}

export const retryExec = curry(async function retryExec(fn, retryNumber, retryInterval, context) {
  let error
  for (let index = 0; index < retryNumber; index++) {
    try {
      const ret = await fn(context)
      return ret
    } catch (err) {
      error = err
    }
    await sleepResolve(retryInterval)
  }
  return Promise.reject(error)
})
