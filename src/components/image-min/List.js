import React from 'react'
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
import {CloudUpload} from '@material-ui/icons'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    margin: theme.spacing(1),
  },
}))

export default function List({list, onClick}) {
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
      {list.map((value, i) => {
        const labelId = `checkbox-list-label-${value}`

        return (
          <ListItem key={value} dense button onClick={handleToggle(value)}>
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={checked.indexOf(value) !== -1}
                tabIndex={-1}
                disableRipple
                inputProps={{'aria-labelledby': labelId}}
              />
            </ListItemIcon>
            <ListItemText id={labelId} primary={list[i]} />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                color="primary"
                className={classes.button}
                startIcon={<CloudUpload />}
                onClick={() => onClick(i)}
              >
                上传
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        )
      })}
    </CommonList>
  )
}
