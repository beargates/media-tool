import React, {useState} from 'react'
import {
  Button,
  Checkbox,
  makeStyles,
  List as CommonList,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core'
import {FileCopy, CloudUpload} from '@material-ui/icons'
import upload from './upload'
import uuid from 'uuid/dist/v4'

const path = require('path')
const {clipboard} = require('electron').remote

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    margin: theme.spacing(1),
  },
}))

export default function List({files}) {
  const classes = useStyles()
  const [checked, setChecked] = React.useState([0])

  const handleToggle = value => () => {
    const currentIndex = checked.indexOf(value)
    const newChecked = [...checked]

    if (currentIndex === -1) {
      newChecked.push(value)
    } else {
      newChecked.splice(currentIndex, 1)
    }

    setChecked(newChecked)
  }

  return (
    <CommonList className={classes.root}>
      {files.map(value => {
        return <Item key={value} checked={checked.indexOf(value) !== -1} filePath={value} handleToggle={handleToggle} />
      })}
    </CommonList>
  )
}

const UPLOAD_STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
}
function Item({checked, handleToggle, filePath}) {
  const [uploadStatus, setUploadStatus] = useState(UPLOAD_STATUS.PENDING)
  const [url, setUrl] = useState(null)

  const classes = useStyles()
  const labelId = `checkbox-list-label-${filePath}`
  const onUpload = async () => {
    try {
      const {url} = await uploadFile(filePath)
      if (url) {
        setUploadStatus(UPLOAD_STATUS.SUCCESS)
        setUrl(url)
      } else {
        setUploadStatus(UPLOAD_STATUS.FAILED)
      }
    } catch (e) {
      console.log(e)
      setUploadStatus(UPLOAD_STATUS.FAILED)
    }
  }
  const copy = () => {
    copyToClipboard(url)
  }
  const onClick = uploadStatus === UPLOAD_STATUS.SUCCESS ? copy : onUpload
  const Icon = uploadStatus === UPLOAD_STATUS.SUCCESS ? FileCopy : CloudUpload
  const btnText =
    uploadStatus === UPLOAD_STATUS.PENDING
      ? '上传'
      : uploadStatus === UPLOAD_STATUS.SUCCESS
      ? '复制到剪切板'
      : '重新上传'
  const {name, ext} = path.parse(filePath)
  const text = name + ext
  return (
    <ListItem dense button onClick={handleToggle(filePath)}>
      {/*<ListItemIcon>*/}
      {/*  <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />*/}
      {/*</ListItemIcon>*/}
      <ListItemText id={labelId} primary={text} />
      <ListItemSecondaryAction>
        <Button
          variant="outlined"
          size="small"
          color="primary"
          className={classes.button}
          startIcon={<Icon />}
          onClick={onClick}
        >
          {btnText}
        </Button>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const copyToClipboard = url => {
  clipboard.writeText(url)
}
const uploadFile = async filePath => {
  const {url} = await upload(filePath, generateUploadKey(filePath), console.log)
  copyToClipboard(url)
  return {url}
}
const generateUploadKey = file => {
  const {ext} = path.parse(file)
  return 'assets/' + uuid() + ext
}
