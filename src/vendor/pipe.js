import {curry} from './curry'

export function warpPipe(name, context, pipeList) {
  const {debug} = {debug: false, ...context}

  async function asyncPipe(name, context, ...fns) {
    let ret = context
    for (const fn of fns) {
      if (typeof fn !== 'function')
        return Promise.reject({
          code: -2,
          message: `pipe function invalid`,
        })

      const fnName = fn.fnname ? fn.fnname : fn.name ? fn.name : `noname: ${fn.toString()}`
      try {
        if (debug) {
          // console?.log(`    execute pipe fun '${fnName}`)
        }
        ret = await fn(ret)
      } catch (err) {
        if (debug) {
          // console?.trace(err)
        }

        const errFn = err?.errFn ? err.errFn : fnName
        if (debug) {
          if (errFn === fnName || errFn.startsWith('noname:')) console?.error(err)
        }
        return Promise.reject(
          err.code
            ? err
            : {
                code: -1,
                errFn,
                message: err.message ? err.message : `execute pipe fun fail: ${err.toString()}`,
              }
        )
      }
    }

    return ret
  }

  let start
  return Promise.resolve()
    .then(async () => {
      if (debug) {
        start = Date.now()
        console?.log(`\nasyncPipe ${name} start`)
      }
      const ret = await asyncPipe(name, context, ...pipeList)
      if (debug) {
        console?.log(`asyncPipe ${name} succ,use ${Date.now() - start} ms\n`)
      }
      return ret
    })
    .catch(err => {
      // console?.error(`asyncPipe ${name} fail`, err)
      return Promise.reject(
        err.code
          ? {...err, pipiFn: err.pipiFn ? err.pipiFn : name}
          : {code: -999, pipiFn: name, message: err.toString()}
      )
    })
}

export const preFuncPipe = curry(async function preFuncPipe(name, func, pipeList, context) {
  return (await func(context)) ? await warpPipe(name, context, pipeList) : context
})

export const conditionPipe = curry(async function conditionPipe(name, func, pipeList, elsePipeList, context) {
  return (await func(context)) ? await warpPipe(name, context, pipeList) : await warpPipe(name, context, elsePipeList)
})
