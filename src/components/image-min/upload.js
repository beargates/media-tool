import {uploadQiniu} from '@huohua/upload-web-qiniu'

function upload(file, key, onProgress) {
  return uploadQiniu({
    file,
    key,
    useFallback: true, // 七牛上传失败后通过公司服务器代理上传
    progressHandle: onProgress,
    logHandle: data => console.log('logHandle', data),
  })
}

export default upload
