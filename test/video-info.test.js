import {
  // getVideoInfo,
  checkBlackFrameWithHeadOrTail,
} from '../../../../lib/video-info'

import {setLogLevel} from '../../../../lib/logger'

setLogLevel('log')
describe('video-info test', () => {
  // it('getVideoResolution', async () => {
  //   const path = require('path')
  //   const src = path.resolve(__dirname, '..', 'black.mp4')
  //   const context = {src}
  //   const ret = await getVideoInfo(context)
  //   console.log(ret)

  //   expect(ret.videoResolution).toStrictEqual('1024x768')
  // })

  it('checkBlackFrameWithHeadOrTail', async () => {
    const path = require('path')
    const src = path.resolve(__dirname, '..', 'black.mp4')
    const context = {src}
    const ret = await checkBlackFrameWithHeadOrTail(context)
    console.log(ret)

    expect(ret.videoResolution).toStrictEqual('1024x768')
  })
})
