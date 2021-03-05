const electron = require('electron')
// Module to control application life.
const app = electron.app

// const { session } = require('electron')

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer')

// const config = require('./config')
// console.dir(config)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null

const isDev = process.env['NODE_ENV'] === 'development'

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    // width: isDev ? 3200 : 1600,
    // height: isDev ? 1600 : 800,
    width: 500,
    height: 800,
    // transparent: true,
    webPreferences: {
      allowRunningInsecureContent: true,
      nodeIntegration: true, // 不设置该项 qiniu sdk 会报错
      webSecurity: false,
    },
  })

  if (isDev) {
    require('./webpack-server.js')
    mainWindow.loadURL('http://localhost:3001/index.html')
  } else {
    mainWindow.loadFile('dist/index.html')
  }

  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // mainWindow = null
  })
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    createWindow()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
  app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
