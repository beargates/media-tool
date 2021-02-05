import React, {Fragment, useState, useEffect} from 'react'

import {makeStyles} from '@material-ui/core/styles'

import CircularProgress from '@material-ui/core/CircularProgress'

import Box from '@material-ui/core/Box'

import Button from '@material-ui/core/Button'

import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

import FormControl from '@material-ui/core/FormControl'

import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'

const path = require('path')
const {app} = require('electron').remote

import {DropzoneElectron} from '../dropzone'
import {Info, Error} from '../info'

import {fsPromisesStats} from '../../vendor/file-util'
import {videoConv} from '../../vendor/video-conv'
import {checkBlackFrameWithHeadOrTail, checkByContextVideoError, getVideoInfo} from '../../vendor/video-info'

import {fmtDate, getLogger} from '../../vendor/logger'
const logger = getLogger('batch-video-conv')

const isDev = process.env.NODE_ENV === 'development'
const baseDir = path.resolve(app.getAppPath()).replace('app.asar', 'app.asar.unpacked')
const ffmpegStaticPath = require('ffmpeg-static')
const ffmpegPath = isDev ? path.resolve(ffmpegStaticPath) : path.resolve(baseDir, ffmpegStaticPath)
logger.info(`baseDir:\n${baseDir}\nffmpegStaticPath:\n${ffmpegStaticPath}\nffmpegPath:\n${ffmpegPath}`)

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

const VideoRateList = [
  // '10',
  // '11',
  // '12',
  // '13',
  // '14',
  // '15',
  // '16',
  // '17',
  // '18',
  // '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
]
const VideoAspectRatio = ['16:9', '4:3']
const VideoSize = {
  '16:9': ['1920x1080', '1280x720', '1024x576', '640x360'],
  '4:3': ['1440x1080', '1280x960', '1024x768', '640x480'],
}

export const BatAudioConv = () => {
  const classes = useStyles()

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState([])
  const [isInfo, setIsInfo] = useState([])

  const [uploadFiles, setUploadFiles] = useState(new Set())

  const [logs, setLogs] = useState([])

  const [convState, setConvState] = useState(false)

  const [currRate, setCurrRate] = useState(VideoRateList[2])

  const [changeVideoSize, setChangeVideoSize] = useState(true)
  const [currAspectRatio, setCurrAspectRatio] = useState(VideoAspectRatio[1])
  const [currSize, setCurrSize] = useState(VideoSize[VideoAspectRatio[1]][2])

  const [checkBlackFrame, setCheckBlackFrame] = useState(true)

  useEffect(() => {
    async function uploadStateChange() {
      try {
        if (convState) {
          setIsLoading(true)

          // const outputParamList = ['-r 25']
          const outputParamList = []
          if (changeVideoSize) {
            outputParamList.push(`-s ${currSize}`)
          }

          const convConfig = {
            ffmpegPath,
            outputParamList: [...outputParamList],
            baseDir,
            convType: 'xiaowan',
            audioRate: '192k',
            videoRate: currRate,
          }

          const logList = []

          for (const file of [...uploadFiles]) {
            const context = {...convConfig, src: file, srcVideo: file}

            let ret, stat, msg, srcDuration, srcRate, srcSize, destDuration, destRate, destSize
            if (checkBlackFrame) ret = await checkBlackFrameWithHeadOrTail(context)
            else ret = {blackFrame: false}

            // console.log(ret)
            if (ret.blackFrame) {
              msg = `${file} 视频头部或结尾有黑帧，不能转码`
              console.log(`setIsError: ${msg}`)
              setIsError(isError => [...isError, msg])
              logList.push(`${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())} ${msg}`)
            } else {
              ret = await checkByContextVideoError('srcVideo', {...context, srcVideo: file}).catch(err => {
                console.log(err)
                return false
              })
              if (!ret) {
                msg = `${file} 视频有损坏，不能转码`
                setIsError(isError => [...isError, msg])
                logList.push(`${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())} ${msg}`)
                continue
              }

              ret = await getVideoInfo({srcVideo: file})
              srcDuration = ret.videoDurationSecond
              srcRate = ret.codeRate
              stat = await fsPromisesStats(file)
              srcSize = stat.size

              await videoConv(context)

              ret = await getVideoInfo({srcVideo: file})
              destDuration = ret.videoDurationSecond
              destRate = ret.codeRate
              stat = await fsPromisesStats(file)
              destSize = stat.size

              if (Math.abs(srcDuration - destDuration) > 2) {
                msg = `${file} 原视频时长: ${srcDuration} ,转码后视频时长: ${destDuration} ,相差超过 2秒`
                setIsError(isError => [...isError, msg])
              }

              logList.push(
                `${fmtDate('yyyy-MM-dd hh:mm:ss', Date.now())} ${file} 转码完成` +
                  `,原视频\n 时长: ${srcDuration} s,码率: ${srcRate} kbps` +
                  `,文件长度 ${Math.floor((srcSize / 1024 / 1024) * 100) / 100} M` +
                  `,转码后视频\n 时长: ${destDuration} s,码率: ${destRate} kbps` +
                  `,文件长度 ${Math.floor((destSize / 1024 / 1024) * 100) / 100} M`
              )
            }
          }
          setLogs([...logs, ...logList])
          setUploadFiles(new Set())
        }
      } catch (err) {
        const message = Array.isArray(err)
          ? JSON.stringify(err)
          : err.stack
          ? err.stack
          : err.message
          ? err.message
          : err
        setIsError(errlist => [...errlist, message])
      } finally {
        setConvState(false)
        setIsLoading(false)
      }
    }

    uploadStateChange()
  }, [convState])

  return (
    <Fragment>
      {isLoading ? (
        <CircularProgress className={classes.progress} />
      ) : (
        <div style={{width: '100%'}}>
          <Error isError={isError} setIsError={setIsError} />
          <Info isInfo={isInfo} setIsInfo={setIsInfo} />

          <Box display="flex" flexDirection="row">
            <FormControl className={classes.formControl}>
              <InputLabel>视频质量 数字大=码率低</InputLabel>
              <Select value={currRate} onChange={event => setCurrRate(event.target.value)}>
                {VideoRateList.map(item => (
                  <MenuItem value={item} key={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" flexDirection="row">
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Switch
                    checked={checkBlackFrame}
                    onChange={event => setCheckBlackFrame(event.target.checked)}
                    value="checkedB"
                    color="primary"
                  />
                }
                label="检查视频首尾黑帧"
              />
            </FormControl>
          </Box>

          <Box display="flex" flexDirection="row">
            <FormControl className={classes.formControl}>
              <FormControlLabel
                control={
                  <Switch
                    checked={changeVideoSize}
                    onChange={event => setChangeVideoSize(event.target.checked)}
                    value="checkedB"
                    color="primary"
                  />
                }
                label="改变视频分辨率"
              />
            </FormControl>
          </Box>

          {changeVideoSize && (
            <Fragment>
              <FormControl className={classes.formControl}>
                <InputLabel>视频宽高比</InputLabel>
                <Select
                  value={currAspectRatio}
                  onChange={event => {
                    const newRatio = event.target.value
                    if (newRatio !== currAspectRatio) {
                      setCurrAspectRatio(newRatio)
                      setCurrSize(VideoSize[newRatio][0])
                    }
                  }}
                >
                  {VideoAspectRatio.map(item => (
                    <MenuItem value={item} key={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl className={classes.formControl}>
                <InputLabel>视频分辨率</InputLabel>
                <Select value={currSize} onChange={event => setCurrSize(event.target.value)}>
                  {VideoSize[currAspectRatio].map(item => (
                    <MenuItem value={item} key={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Fragment>
          )}

          <DropzoneElectron uploadFiles={uploadFiles} setUploadFiles={setUploadFiles} accept="video/*" multiple />
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
            <Typography className={classes.text} variant="h6" gutterBottom>
              日志
            </Typography>
            <Box display="flex" flexDirection="row">
              <List component="nav" aria-label="secondary mailbox folders" className={classes.list}>
                {logs.map((log, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={log} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </div>
      )}
    </Fragment>
  )
}
