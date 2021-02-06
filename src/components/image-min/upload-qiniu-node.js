const qiniu = require('qiniu')

const accessKey = 'Bbea8tz2m-ppGwaOBbRx4IBB_t3hKUItvruw3x9t'
const secretKey = '2ZIGgSXBuHi4CE1Gj-IjpK8ZUISNNdLDfIPOg9NV'
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)

function uptoken(bucket, key) {
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket + ':' + key,
  })
  return putPolicy.uploadToken(mac)
}

export function uploadToQiniu({cdnPrefix = 'https://pkmcdn2.huohua.cn/', bucket = 'pkm', localFile, localStr, key}) {
  return new Promise((resolve, reject) => {
    const config = new qiniu.conf.Config()
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()
    const token = uptoken(bucket, key)
    // console.log('token', token)

    if (localFile) {
      formUploader.putFile(token, key, localFile, putExtra, (respErr, respBody) => {
        // console.log('respErr', respErr, 'respBody', respBody)
        if (respErr) {
          return reject(respErr)
        } else if (respBody.error) {
          return reject(respBody.error)
        } else return resolve(cdnPrefix + respBody.key)
      })
    } else {
      formUploader.put(token, key, localStr, putExtra, (respErr, respBody) => {
        // console.log('respErr', respErr, 'respBody', respBody)
        if (respErr) {
          return reject(respErr)
        } else if (respBody.error) {
          return reject(respBody.error)
        } else return resolve(cdnPrefix + respBody.key)
      })
    }
  })
}

// 计算文件的eTag，参数为buffer或者readableStream或者文件路径
export function getEtag(buffer) {
  return new Promise(resolve => {
    // sha1算法
    function sha1(content) {
      const crypto = require('crypto')
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

      sha1Buffer = Buffer.concat([new Buffer([prefix]), sha1Buffer], sha1Buffer.length + 1)

      return sha1Buffer.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
    }

    // 判断传入的参数是buffer还是stream还是filepath
    let mode = 'buffer'

    if (typeof buffer === 'string') {
      buffer = require('fs').createReadStream(buffer)
      mode = 'stream'
    } else if (buffer instanceof require('stream')) {
      mode = 'stream'
    }

    // 以4M为单位分割
    const blockSize = 4 * 1024 * 1024
    const sha1String = []

    let blockCount = 0

    let bufferSize = 0
    if (mode === 'buffer') {
      bufferSize = buffer.length
      blockCount = Math.ceil(bufferSize / blockSize)

      for (let i = 0; i < blockCount; i++) {
        sha1String.push(sha1(buffer.slice(i * blockSize, (i + 1) * blockSize)))
      }

      resolve([calcEtag(sha1String, blockCount), bufferSize])
    } else {
      const stream = buffer
      stream.on('readable', function () {
        let chunk
        while ((chunk = stream.read(blockSize))) {
          sha1String.push(sha1(chunk))
          bufferSize += chunk.length
          blockCount++
        }
      })
      stream.on('end', function () {
        resolve([calcEtag(sha1String, blockCount), bufferSize])
      })
    }
  })
}

export function getFileEtag(file) {
  return new Promise(resolve => {
    // sha1算法
    function sha1(content) {
      const crypto = require('crypto')
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

    const stream = require('fs').createReadStream(file)

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
