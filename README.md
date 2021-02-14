### 安装汇编
`brew install nasm`

### 安装autoconf
`brew install autoconf`

### 安装electron
`sudo npm i electron@8.2.5 -g --unsafe-perm=true` <br/>
参考官方文档 https://www.electronjs.org/docs/tutorial/installation

### 安装依赖
先在package.json中删除ffmpeg-static，执行npm i；然后将准备好的ffmpeg-static整个文件夹复制到node_modules里

imagemin-pngquant和imagemin-jpegtran的安装比较麻烦，一旦electron或ffmpeg-static在`npm i`安装途中失败（control+z）这两个包很可能被覆盖了，应用启动过程中不会报错，但是在压缩图片时总时报错Error，需要重新安装

### 其他说明
1。ffmpeg-static各平台二进制文件下载：(使用迅雷下载)<br/>
https://github.com/eugeneware/ffmpeg-static/blob/master/build/index.sh

2。构建时，依旧会重新下载electron<br/>
此时把缓存目录里的electron-darwin-v8.2.5.zip和sha文件复制至electron缓存目录`~/Library/Caches/electron/`即可