export function curry(fn, arity = fn.length) {
  function nextCurried(prevArgs) {
    const transition = function curried(...nextArgs) {
      const args = prevArgs.concat(nextArgs)
      if (args.length >= arity) {
        return fn(...args)
      } else {
        return nextCurried(args)
      }
    }
    Object.defineProperty(transition, 'fnname', {get: () => fn.name})
    return transition
  }

  return nextCurried([])
}

export function promiseToCallback(func) {
  return function (...args) {
    // console.log('args', args)
    // 返回封装后的函数.
    const callback = args[args.length - 1] // 如果是callback模式, 最后一个参数需要是callback函数.

    // If legacy callback mode
    if (args.length >= 1 && typeof callback === 'function') {
      return func(...args.slice(0, args.length - 1)) // 调用实际的功能函数.
        .then(res => {
          callback(null, res) // 成功
        })
        .catch(err => {
          callback(err) // 失败
        })
    }
    // Promise mode
    else return func(...args) // Promise模式, 直接return.
  }
}

export const replaceAll = (find, replace, str) =>
  // eslint-disable-next-line no-useless-escape
  str.replace(new RegExp(find.replace(/[\[\]\\{}()+*?.$^|]/g, '\\$&'), 'g'), replace)

export function deepMerge(...objects) {
  const isObject = obj => obj && typeof obj === 'object'

  const isFlatObject = obj => !Object.values(obj).some(item => typeof item === 'object')

  function deepMergeInner(target, source) {
    Object.keys(source).forEach(key => {
      const targetValue = target[key]
      const sourceValue = source[key]

      // console.log(`${key} targetValue`, targetValue, 'sourceValue', sourceValue)
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        target[key] = targetValue
      } else if (isObject(targetValue) && isObject(sourceValue)) {
        // 当 target 和 source 都是平铺对象(值里不包含对象),直接用 source 覆盖 target
        if (isFlatObject(targetValue) && isFlatObject(sourceValue)) target[key] = sourceValue
        else target[key] = deepMergeInner(Object.assign({}, targetValue), sourceValue)
      } else if (sourceValue !== undefined) target[key] = sourceValue
    })

    return target
  }

  if (objects.length < 2) {
    throw new Error('deepMerge: this function expects at least 2 objects to be provided')
  }

  if (objects.some(object => !isObject(object))) {
    throw new Error('deepMerge: all values should be of type "object"')
  }

  const target = objects.shift()
  let source

  while ((source = objects.shift())) {
    deepMergeInner(target, source)
  }

  return target
}
