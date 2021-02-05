const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')

import {curry} from './curry'
import {checkParam} from './curry-ext'
import {warpPipe} from './pipe'

export function getSumsByFile(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const input = fs.createReadStream(file)

    hash.setEncoding('hex')

    input.on('error', err => {
      return reject(err.message)
    })

    input.on('end', function () {
      hash.end()
      return resolve(hash.read())
    })

    input.pipe(hash)
  })
}

export function getHmacByValue(key, value) {
  const hmac = crypto.createHmac('sha256', key)
  return hmac.update(value).digest('hex')
}

export async function getFiles(context) {
  const {directory, ignoreDirectoryList = [], ignoreFileList = []} = context
  const files = []
  const prefixLength = path.resolve(directory).length + 1
  const ignoreDirectorySet = new Set(ignoreDirectoryList)

  async function getFilesFromDir(directory) {
    const direntList = await fsPromises.readdir(directory, {
      withFileTypes: true,
    })
    for (const dirent of direntList) {
      if (dirent.isFile()) {
        const file = path.resolve(directory, dirent.name).slice(prefixLength)

        let ignore = false
        for (const ignoreFile of ignoreFileList) {
          if (file.match(new RegExp(ignoreFile))) {
            ignore = true
            break
          }
        }
        if (!ignore) {
          files.push(file)
        }
      }
      if (dirent.isDirectory()) {
        const currPath = path.resolve(directory, dirent.name)
        const currDir = path.basename(currPath)
        // console.log('currDir', currDir)
        if (!ignoreDirectorySet.has(currDir)) {
          await getFilesFromDir(currPath)
        }
      }
    }
  }

  await getFilesFromDir(directory)
  // console.log('getFiles', files)
  return {...context, files}
}

const crypto = require('crypto')
export function getQiniuEtag(file) {
  return new Promise(resolve => {
    // sha1算法
    function sha1(content) {
      const sha1 = crypto.createHash('sha1')
      sha1.update(content)
      return sha1.digest()
    }

    function calcEtag(sha1String, blockCount) {
      if (!sha1String.length) {
        return 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ'
      }
      let sha1Buffer = Buffer.concat(sha1String, blockCount * 20)

      let prefix = 0x16
      // 如果大于4M，则对各个块的sha1结果再次sha1
      if (blockCount > 1) {
        prefix = 0x96
        sha1Buffer = sha1(sha1Buffer)
      }

      sha1Buffer = Buffer.concat([Buffer.from([prefix]), sha1Buffer], sha1Buffer.length + 1)

      return sha1Buffer.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
    }

    const stream = fs.createReadStream(file)

    // 以4M为单位分割
    const blockSize = 4 * 1024 * 1024
    const sha1String = []

    let blockCount = 0

    let fileSize = 0

    stream.on('readable', function () {
      let chunk
      while ((chunk = stream.read(blockSize))) {
        sha1String.push(sha1(chunk))
        fileSize += chunk.length
        blockCount++
      }
    })
    stream.on('end', function () {
      resolve([calcEtag(sha1String, blockCount), fileSize])
    })
  })
}

export const getQiniuEtagWithZip = curry(async function getQiniuEtagWithZip(zip, context) {
  const [hash, size] = await getQiniuEtag(zip)
  return {...context, etagHash: hash, etagSize: size}
})

const fsPromisesAccess = curry(function fsPromisesAccess(file, context) {
  return fsPromises
    .access(context[file], fs.constants.F_OK)
    .then(() => Promise.resolve({...context, fileExist: true}))
    .catch(() => Promise.resolve({...context, fileExist: false}))
})
export const checkFileExistByContext = curry(function checkFileExistByContext(file, context) {
  return warpPipe('checkFileExistByContext', {debug: false, ...context}, [checkParam([file]), fsPromisesAccess(file)])
})

const fsPromisesNonExistentFiles = curry(async function fsPromisesNonExistentFiles(files, context) {
  const nonExistentFiles = []
  for (const file of files) {
    await fsPromises.access(file, fs.constants.F_OK).catch(() => nonExistentFiles.push(file))
  }
  // console.log('fsPromisesNonExistentFiles', files, nonExistentFiles)
  return {...context, nonExistentFiles}
})
export const checkNonExistentFilesByContext = curry(function checkNonExistentFilesByContext(filesKey, context) {
  return warpPipe('checkNonExistentFilesByContext', {debug: false, ...context}, [
    checkParam([filesKey]),
    fsPromisesNonExistentFiles(context[filesKey]),
  ])
})

export const checkFileExist = curry(function checkFileExist(file) {
  return fsPromises
    .access(file, fs.constants.F_OK)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false))
})

// 如果目录名带扩展名,则认为该目录为文件，默认创建上级目录,为了兼容老版本 node，需要做额外的异常处理
const fsPromisesMkdir = curry(function fsPromisesMkdir(dir) {
  const rawDir = dir?.match(/\.[^.]+$/) ? path.dirname(dir) : dir
  return fsPromises
    .access(dir, fs.constants.F_OK)
    .then(() => Promise.resolve())
    .catch(() => fsPromises.mkdir(rawDir, {recursive: true}))
    .then(() => Promise.resolve())
    .catch(() => Promise.resolve()) // 为了兼容老版本 node，需要做额外的异常处理
})

export const mkdirByContext = curry(function mkdirByContext(dir, context) {
  return warpPipe('mkdirByContext', {debug: false, ...context}, [
    checkParam([dir]),
    async context => {
      await fsPromisesMkdir(context[dir])
      return {...context, mkdirResult: 'succ'}
    },
  ])
})

export const fsPromisesReadFile = curry(async function fsPromisesReadFile(file, context) {
  try {
    const ret = await fsPromises.readFile(context[file])
    // return {...context, [newKey]: valueKey ? JSON.parse(ret)[valueKey] : JSON.parse(ret)}
    return {...context, readRet: ret}
  } catch (err) {
    return Promise.reject(`readFile ${context[file]} err: ${err}`)
  }
})

export const readJsonFromFileByContext = curry(function readJsonFromFileByContext(file, valueKey, newKey, context) {
  return warpPipe('readJsonFromFileByContext', {debug: false, ...context}, [
    checkParam([file]),
    curry(fsPromisesReadFile)(file),
    context => ({
      ...context,
      [newKey]: valueKey ? JSON.parse(context.readRet)[valueKey] : JSON.parse(context.readRet),
    }),
  ])
})

export const fsPromisesWriteFile = curry(async function fsPromisesWriteFile(fileKey, context) {
  try {
    await fsPromises.writeFile(context[fileKey], context.content)
    return context
  } catch (err) {
    return Promise.reject(`writeFile ${context[fileKey]} err: ${err}`)
  }
})

export const writeJsonToFileByContext = curry(async function writeJsonToFileByContext(
  fileKey,
  newKey,
  valueKey,
  context
) {
  const value = valueKey ? context[valueKey] : context
  const content = JSON.stringify(
    newKey
      ? {
          [newKey]: value,
        }
      : value
  )

  return warpPipe('writeJsonToFileByContext', {debug: false, ...context}, [
    checkParam([fileKey]),
    mkdirByContext(fileKey),
    context => ({...context, content}),
    curry(fsPromisesWriteFile)(fileKey),
  ])
})

const fsPromisesMvFile = curry(async function fsPromisesMvFile(src, dst, context) {
  try {
    await fsPromises.rename(context[src], context[dst])
    return context
  } catch (err) {
    return Promise.reject(`fsPromisesMvFile ${src} to ${dst} err: ${err}`)
  }
})

// 如果目录名带扩展名,则认为该目录为文件，默认创建上级目录
export const mvFileByContext = curry(async function mvFileByContext(src, dst, context) {
  return await warpPipe('mvFileByContext', {debug: false, ...context}, [
    checkParam([src, dst]),
    mkdirByContext(dst),
    fsPromisesAccess(src),
    fsPromisesMvFile(src, dst),
  ])
})

export const fsPromisesCopyFile = curry(function fsPromisesCopyFile(src, dst, context) {
  const {COPYFILE_FICLONE} = fs.constants
  return fsPromises
    .access(src, fs.constants.F_OK)
    .then(() => fsPromises.copyFile(src, dst, COPYFILE_FICLONE).then(() => Promise.resolve(context)))
    .catch(() => Promise.reject(`copyFile src:${src} does not exist`))
})

export const copyFileByContext = curry(function copyFileByContext(srcKey, dstKey, context) {
  return warpPipe('copyFileByContext', {debug: false, ...context}, [
    checkParam([srcKey, dstKey]),
    fsPromisesCopyFile(context[srcKey], context[dstKey]),
  ])
})

// const fsPromisesUnlink = curry(function fsPromisesUnlink(file, context) {
//   return fsPromises
//     .access(context[file], fs.constants.F_OK)
//     .then(() => fsPromises.unlink(context[file]).then(() => Promise.resolve(context)))
//     .catch(() => Promise.resolve(context))
// })

// export const removeFileByContext = curry(function removeFileByContext(file, context) {
//   return warpPipe('removeFileByContext', {debug: false, ...context}, [checkParam([file]), fsPromisesUnlink(file)])
// })

export function fsPromisesUnlink(file) {
  return fsPromises
    .access(file, fs.constants.F_OK)
    .then(() =>
      fsPromises
        .unlink(file)
        .then(() => Promise.resolve({code: 0}))
        .catch(err => Promise.resolve({code: -999, message: `${err.toString()}`}))
    )
    .catch(() => Promise.resolve({code: -1, message: `file: ${file} no exist`}))
}

export const removeFileByContext = curry(function removeFileByContext(file, context) {
  return warpPipe('removeFileByContext', {debug: false, ...context}, [
    checkParam([file]),
    async context => {
      const ret = await fsPromisesUnlink(context[file])
      return {...context, ...ret}
    },
  ])
})

// const fsPromisesRmdir = curry(function fsPromisesRmdir(dir, context) {
//   return fsPromises
//     .access(context[dir], fs.constants.F_OK)
//     .then(() => fsPromises.rmdir(context[dir], {recursive: true}).then(() => Promise.resolve(context)))
//     .catch(() => Promise.resolve(context))
// })

export const fsPromisesRmdir = dir =>
  fsPromises
    .access(dir, fs.constants.F_OK)
    .then(() => fsPromises.rmdir(dir, {recursive: true}).then(() => Promise.resolve()))
    .catch(() => Promise.resolve())

export const fsPromisesStats = file =>
  fsPromises
    .access(file, fs.constants.F_OK)
    .then(() => fsPromises.stat(file).then(ret => Promise.resolve(ret)))
    .catch(() => Promise.resolve())

export const removeDirByContext = curry(function removeDirByContext(dir, context) {
  return warpPipe('removeDirByContext', {debug: false, ...context}, [
    checkParam([dir]),
    context => fsPromisesRmdir(dir).then(() => context),
  ])
})

export const lockWithDir = function lockWithDir(dir) {
  return fsPromises
    .mkdir(dir)
    .then(() => true)
    .catch(() => false)
}
