import React from 'react'

import {useDropzone} from 'react-dropzone'

import {makeStyles} from '@material-ui/core/styles'

import Box from '@material-ui/core/Box'

import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/Delete'

const useStyles = makeStyles(theme => ({
  zone: {
    minHeight: 100,
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
}))

export const DropzoneElectron = props => {
  const classes = useStyles()

  const {uploadFiles, setUploadFiles, accept, multiple, defaultList = true} = props

  const onDrop = acceptedFiles => {
    setUploadFiles(new Set([...uploadFiles, ...acceptedFiles.map(item => item.path)]))
  }

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept, multiple})

  return (
    <Paper square>
      <Paper square {...getRootProps()}>
        <Box display="flex" justifyContent="center" alignItems="center" className={classes.zone}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography className={classes.text} variant="h6" gutterBottom>
              拖拽文件至此处 ...
            </Typography>
          ) : (
            <Typography className={classes.text} variant="h6" gutterBottom>
              拖拽文件至此处或点击此处选择文件
            </Typography>
          )}
        </Box>
      </Paper>
      {uploadFiles.size !== 0 && defaultList && (
        <List dense={true} component="nav" aria-label="secondary mailbox folders" className={classes.list}>
          {[...uploadFiles].map(item => (
            <ListItem key={item}>
              <ListItemText primary={item} />
              <IconButton
                className={classes.button}
                aria-label="delete"
                onClick={() => {
                  uploadFiles.delete(item)
                  setUploadFiles(new Set(uploadFiles))
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  )
}
