// const {webFrame} = require('electron')
import {hot} from 'react-hot-loader'
import React from 'react'

import {setLogLevel} from './vendor/logger'
const isDev = process.env.NODE_ENV === 'development'
setLogLevel(isDev ? 'log' : 'log')

// import config from '../config'

// import {Create} from './components/create'
// import {BatAudioConv} from './components/batch-video-conv'
import ImageMin from './components/image-min'

// import {Layout} from 'antd'
// const {Content} = Layout

// webFrame.setZoomFactor(isDev ? 2 : 1) // 这里设置有效
// webFrame.setZoomFactor(1) // 这里设置有效

function App() {
  return <ImageMin />
}

// setConfig({
//   ignoreSFC: true, // RHL will be __completely__ disabled for SFC
//   pureRender: true, // RHL will not change render method
// })
export default hot(module)(App)
