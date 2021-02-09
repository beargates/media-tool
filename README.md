## electron的安装目前是
### `sudo npm i electron@8.2.5 -g --unsafe-perm=true`
### 另外可以参考官方文档 https://www.electronjs.org/docs/tutorial/installation

## ffmpeg-static的安装
### 先在package.json中删除，暂时不安装，等待别的依赖安装完之后，将准备好的ffmpeg-static整个文件夹复制到node_modules里

### imagemin-pngquant和imagemin-jpegtran的安装比较麻烦，一旦electron或ffmpeg-static在`npm i`安装途中失败（control+z）这两个包很可能被覆盖了，应用启动过程中不会报错，但是在压缩图片时总时报错Error，需要重新安装

## 安装汇编
### `bew install nasm`

## 安装autoconf
### `bew install autoconf`
