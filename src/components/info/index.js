import React, {Fragment} from 'react'

import {makeStyles} from '@material-ui/core/styles'
import clsx from 'clsx'

import Box from '@material-ui/core/Box'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import IconButton from '@material-ui/core/IconButton'

import ErrorIcon from '@material-ui/icons/Error'
import InfoIcon from '@material-ui/icons/Info'
import CloseIcon from '@material-ui/icons/Close'

// eslint-disable-next-line no-unused-vars
import Paper from '@material-ui/core/Paper'

const useStyles = makeStyles(theme => ({
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}))

export const Info = props => {
  const {isInfo, setIsInfo} = props
  const classes = useStyles()

  return (
    <Fragment>
      {isInfo.map((item, index) => (
        <Box display="flex" flexDirection="row" key={index}>
          <SnackbarContent
            style={{width: '100%'}}
            className={classes.info}
            message={
              <span id="client-snackbar" className={classes.message}>
                <InfoIcon className={clsx(classes.icon, classes.iconVariant)} />
                {item}
              </span>
            }
            action={[
              <IconButton
                key="close"
                aria-label="close"
                color="inherit"
                onClick={() => {
                  setIsInfo(infoList => {
                    const infoSet = new Set(infoList)
                    infoSet.delete(item)
                    return [...infoSet]
                  })
                }}
              >
                <CloseIcon className={classes.icon} />
              </IconButton>,
            ]}
          />
        </Box>
      ))}
    </Fragment>
  )
}

export const Error = props => {
  const classes = useStyles()

  const {isError, setIsError} = props

  return (
    <Fragment>
      {isError.map((item, index) => (
        <Box display="flex" flexDirection="row" key={index}>
          <SnackbarContent
            style={{width: '100%'}}
            className={classes.error}
            message={
              <span id="client-snackbar" className={classes.message}>
                <ErrorIcon className={clsx(classes.icon, classes.iconVariant)} />
                {item}
              </span>
            }
            action={[
              <IconButton
                key="close"
                aria-label="close"
                color="inherit"
                onClick={() => {
                  setIsError(errorList => {
                    const errorSet = new Set(errorList)
                    errorSet.delete(item)
                    return [...errorSet]
                  })
                }}
              >
                <CloseIcon className={classes.icon} />
              </IconButton>,
            ]}
          />
        </Box>
      ))}
    </Fragment>
  )
}
