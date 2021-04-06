import React, {useState} from 'react'
import {Box, makeStyles, Button, Paper} from '@material-ui/core'
import {DataGrid} from '@material-ui/data-grid'
import {DropzoneElectron} from '../dropzone'
import {getVideoInfo} from '../../vendor/video-info'

const path = require('path')
const {app} = require('electron').remote

const isDev = process.env.NODE_ENV === 'development'
const baseDir = path.resolve(app.getAppPath()).replace('app.asar', 'app.asar.unpacked')
const ffmpegStaticPath = require('ffmpeg-static')
const ffmpegPath = isDev ? path.resolve(ffmpegStaticPath) : path.resolve(baseDir, ffmpegStaticPath)

const useStyles = makeStyles(theme => ({
  button: {
    margin: theme.spacing(1),
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
  },
}))

const ImageMin = function () {
  const classes = useStyles()

  const [details, setDetails] = useState([])

  const proc = async set => {
    const convConfig = {ffmpegPath}
    for (const file of set) {
      const context = {...convConfig, src: file, srcVideo: file}

      const {
        videoResolution: resolution,
        videoDuration: duration,
        // videoDurationSecond,
        codeRate: rate,
        fps,
      } = await getVideoInfo(context)
      const {name, ext} = path.parse(file)
      setDetails([
        ...details.filter(({id}) => id !== file),
        {id: file, name: name + ext, resolution, duration, rate, fps},
      ])
      // const state = await fsPromisesStats(file)
      // const {size} = state
      // const width = videoResolution.split('x')[0]
      // const height = videoResolution.split('x')[1]
    }
  }

  const columns = [
    {field: 'name', headerName: '文件名', width: 300},
    {field: 'resolution', headerName: '分辨率', width: 150},
    {field: 'duration', headerName: '时长', width: 150},
    {field: 'rate', headerName: '比特率', width: 100},
    {field: 'fps', headerName: '帧率', width: 100},
  ]
  return (
    <>
      <Box display="flex" flexDirection="row" justifyContent="flex-end">
        <div className={classes.wrapper}>
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            disabled={false}
            onClick={() => setDetails([])}
          >
            清空
          </Button>
        </div>
      </Box>

      <DropzoneElectron uploadFiles={new Set()} setUploadFiles={proc} accept="video/*" multiple />

      <Paper square>
        <div style={{height: 300, width: '100%'}}>
          <DataGrid rows={details} columns={columns} rowHeight={40} checkboxSelection />
        </div>
      </Paper>
    </>
  )
}

export default ImageMin
