// import {uploadQiniu} from '@huohua/upload-web-qiniu'
//
// function upload(file, key, onProgress) {
//   return uploadQiniu({
//     file,
//     key,
//     useFallback: true, // 七牛上传失败后通过公司服务器代理上传
//     progressHandle: onProgress,
//     logHandle: data => console.log('logHandle', data),
//   })
// }
import {uploadToQiniu} from './upload-qiniu-node'
import config from './qiniu-config'

function upload(file, key) {
  return uploadToQiniu({...config, key, localFile: file})
}

export default upload
