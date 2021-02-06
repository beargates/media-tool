import React, {useEffect, useState} from 'react'
import {promisify} from 'util'
import fs from 'fs'
import compressor from 'imagemin-pngquant'
import uuid from 'uuid/dist/v4'
import {
  FormControl,
  FormControlLabel,
  Switch as BaseSwitch,
  Box,
  makeStyles,
  InputLabel,
  Select as BaseSelect,
  MenuItem,
  Button,
  Paper,
} from '@material-ui/core'
import ResultList from './List'
import {DropzoneElectron} from '../dropzone'
import {getImageInfo} from '../../vendor/video-info'
import {fsPromisesStats} from '../../vendor/file-util'
import proc from './process'
import upload from './upload'

const path = require('path')
const {app} = require('electron').remote

const isDev = process.env.NODE_ENV === 'development'
const baseDir = path.resolve(app.getAppPath()).replace('app.asar', 'app.asar.unpacked')
const ffmpegStaticPath = require('ffmpeg-static')
const ffmpegPath = isDev ? path.resolve(ffmpegStaticPath) : path.resolve(baseDir, ffmpegStaticPath)

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const ImageMin = function () {
  const classes = useStyles()

  const [currReplaceFlag, setCurrReplaceFlag] = useState(false)
  const [currClip, setCurrClip] = useState(false)
  const [curr2JPGFlag, setCurr2JPGFlag] = useState(false)
  const [currSpeed, setCurrSpeed] = useState(SPEED_LIST[3])
  const [currQuality, setCurrQuality] = useState(QUALITY_LIST[2])

  const [uploadFiles, setUploadFiles] = useState(new Set())
  const [doneList, setDoneList] = useState([])
  const [convState, setConvState] = useState(false)

  useEffect(() => {
    const fn = async () => {
      const convConfig = {
        ffmpegPath,
        // outputParamList: [...outputParamList],
        // baseDir,
        // convType: 'xiaowan',
        // audioRate: '192k',
        // videoRate: currRate,
      }
      for (const file of uploadFiles) {
        const context = {...convConfig, src: file, srcVideo: file}

        const {videoResolution} = await getImageInfo(context)
        const state = await fsPromisesStats(file)
        const {size} = state
        const width = videoResolution.split('x')[0]
        const height = videoResolution.split('x')[1]

        const {dir, name, ext} = path.parse(file)
        // png无法直接输出到源位置
        let output = dir + '/' + name + '_optimized'
        if (currQuality) {
          output += `_${currQuality}`
        }
        const options = []
        if (currClip) {
          const ratio = 0.5
          options.push(`-vf scale=${width * ratio}:${height * ratio}`)
          output += `_@${ratio}x`
        }

        const targetExtName = curr2JPGFlag ? '.jpg' : ext
        output += targetExtName
        await proc(file, options, output)

        let {size: currSize} = await fsPromisesStats(output)

        const correctFilePath = correctExtName(file, targetExtName)
        if (currSize > size) {
          fs.unlink(output, () => {})
          // 修正扩展名
          output = correctFilePath
          currSize = size
        }

        // console.clear()

        const buffer = await readFile(output)
        try {
          const data = await compressor({
            speed: currSpeed,
            strip: true,
            quality: [currQuality === 1 ? 0.8 : currQuality, currQuality],
            // posterize: 4, // todo
            verbose: true,
          })(buffer)
          if (data.length < currSize) {
            currSize = data.length
            await writeFile(output, data)
          } else {
            console.log('压缩后尺寸变大，跳过压缩')
          }
        } catch (e) {
          console.log('压缩失败', e)
        }

        if (currSize < size) {
          if (currReplaceFlag) {
            fs.unlink(file, () => {}) // 删除源文件
            fs.rename(output, correctFilePath, () => {}) // 重命名
          }
        }

        setDoneList([...doneList, correctFilePath])
      }
      setUploadFiles(new Set())
      setConvState(false)
    }
    fn()
  }, [convState])

  const handleItemClick = async i => {
    const res = await upload(doneList[i], generateUploadKey(doneList[i]), console.log)
    console.log(res)
  }

  return (
    <>
      <Switch
        checked={currReplaceFlag}
        onChange={e => setCurrReplaceFlag(e.target.checked)}
        label={'直接替换源文件(请做好备份)'}
      />
      <Switch checked={currClip} onChange={e => setCurrClip(e.target.checked)} label={'0.5x'} />
      <Switch checked={curr2JPGFlag} onChange={e => setCurr2JPGFlag(e.target.checked)} label={'转JPG'} />
      <Select
        value={currSpeed}
        list={SPEED_LIST}
        onChange={e => setCurrSpeed(e.target.value)}
        label={'压缩速度(1~11, 11=fast, 10比4压缩速度快8倍)'}
      />
      <Select
        value={currQuality}
        list={QUALITY_LIST}
        onChange={e => setCurrQuality(e.target.value)}
        label={'压缩质量(0~1, 1=best)'}
      />

      <DropzoneElectron
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        accept="video/*, image/jpeg, image/png"
        multiple
      />

      <Box display="flex" flexDirection="row" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          disabled={uploadFiles.size === 0}
          onClick={() => setConvState(true)}
        >
          处理
        </Button>
      </Box>
      <Paper square className={classes.paper}>
        <ResultList list={doneList} onClick={handleItemClick} />
      </Paper>
    </>
  )
}

const SPEED_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const QUALITY_LIST = [0.5, 0.8, 1]

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    padding: theme.spacing(3, 2),
  },
  progress: {
    margin: theme.spacing(2),
  },
  list: {
    width: '100%',
  },
  text: {
    margin: theme.spacing(1),
  },
  button: {
    margin: theme.spacing(1),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 180,
  },
}))

const Switch = ({checked, onChange, label}) => {
  const classes = useStyles()
  return (
    <Box display="flex" flexDirection="row">
      <FormControl className={classes.formControl}>
        <FormControlLabel
          control={<BaseSwitch checked={checked} onChange={onChange} value="checkedB" color="primary" />}
          label={label}
        />
      </FormControl>
    </Box>
  )
}
const Select = ({value, list, onChange, label}) => {
  const classes = useStyles()
  return (
    <Box display="flex" flexDirection="row">
      <FormControl className={classes.formControl}>
        <InputLabel>{label}</InputLabel>
        <BaseSelect value={value} onChange={onChange}>
          {list.map(item => (
            <MenuItem value={item} key={item}>
              {item}
            </MenuItem>
          ))}
        </BaseSelect>
      </FormControl>
    </Box>
  )
}

const correctExtName = (file, extname) => {
  const {dir, name} = path.parse(file)
  return dir + '/' + name + extname
}
const generateUploadKey = file => {
  const {ext} = path.parse(file)
  return 'assets/' + uuid() + ext
}

export default ImageMin
