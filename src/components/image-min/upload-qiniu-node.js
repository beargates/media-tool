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
