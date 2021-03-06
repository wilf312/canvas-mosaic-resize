
// dom
const file = document.querySelector('#file')
const message = document.querySelector('#message')
const before = document.querySelector('#before')
const download = document.querySelector('#download')
const canvasHeader = document.querySelector('#canvas-header')

// ファイルの読み込み
file.addEventListener('change', (event) => {
  if (event.target.files.length === 1) {
    loadAction(event.target.files[0])
  } else if (event.target.files.length === 0) {
    message.textContent = 'ファイルが選択されていません'
  } else {
    message.textContent = '複数ファイルの読み込みはできません'
  }
})

// canvasのダウンロード
download.addEventListener('click', (event) => {
  const link = document.createElement('a')
  link.href = before.toDataURL('image/png')
  link.download = 'test.png'
  link.click()
})

// イベントセット
let isTouch = false
if ('ontouchstart' in document.documentElement) {
  isTouch = true
}

let leftTop = {x: null, y: null}
const touchStartAction = (event) => {
  if (isTouch) {
    if (!event?.changedTouches[0]?.clientX || !event?.changedTouches[0]?.clientY) {
      return
    }
    leftTop.x = parseInt(event.changedTouches[0].clientX, 10)
    leftTop.y = parseInt(event.changedTouches[0].clientY, 10)
  } else {
    leftTop.x = parseInt(event.offsetX, 10)
    leftTop.y = parseInt(event.offsetY, 10)
  }
}
let rightBottom = {x: null, y: null}
const touchEndAction = (event) => {

  if (isTouch) {
    // 領域外で離れたらキャンセル
    if (
      !event?.changedTouches[0]?.clientX || 
      !event?.changedTouches[0]?.clientY ||
      before.width < event.changedTouches[0].clientX ||
      before.height < event.changedTouches[0].clientY) {

      // 初期化
      leftTop.x = null
      leftTop.y = null
      rightBottom.x = null
      rightBottom.y = null
      return
    }
    rightBottom.x = parseInt(event.changedTouches[0].clientX, 10)
    rightBottom.y = parseInt(event.changedTouches[0].clientY, 10)
  } else {
    rightBottom.x = parseInt(event.offsetX, 10)
    rightBottom.y = parseInt(event.offsetY, 10)
  }
  if (leftTop.x !== null &&leftTop.y !== null &&rightBottom.y !== null &&rightBottom.y !== null) {
    mosaicPart(30, checkPosition(leftTop, rightBottom))

    // 初期化
    leftTop.x = null
    leftTop.y = null
    rightBottom.x = null
    rightBottom.y = null
  }
}

// rightBottom が マイナス方向の場合にポジションを逆転させる
const checkPosition = (leftTop, rightBottom) => {
  return {
    x: leftTop.x < rightBottom.x ? leftTop.x : rightBottom.x,
    w: leftTop.x < rightBottom.x ? rightBottom.x :  leftTop.x,
    y: leftTop.y < rightBottom.y ? leftTop.y : rightBottom.y,
    h: leftTop.y < rightBottom.y ? rightBottom.y :  leftTop.y
  }
}

before.addEventListener('touchstart', touchStartAction)
before.addEventListener('mousedown', touchStartAction)

before.addEventListener('touchend', touchEndAction)
before.addEventListener('mouseup', touchEndAction)



// 画像読み込み時の処理
const loadAction = async (_file) => {
  const result = await loadFile(_file)
  const image = await loadImage(result)
  resizeCanvas(image.width, image.height)
  // beforeのレンダリング
  const beforeContext = before.getContext('2d')
  beforeContext.drawImage(image, 0,0)

  // 表示制御 ダウンロードボタンを表示 ファイルを非表示
  download.style.display = 'block'
  canvasHeader.style.display = 'block'
  file.style.display = 'none'

}

// ファイルからdataURLを生成
const loadFile = (file) => {
  const reader = new FileReader()
  
  return new Promise((resolve) => {
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
// dataURLから画像を生成
const loadImage = (dataUrl) => {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.src = dataUrl
  })
}
// キャンバスのリサイズ
const resizeCanvas = (width, height) => {
  // 画面サイズに合わせてリサイズ
  // const _width = window.innerWidth > width ? width : window.innerWidth
  // const _height = window.innerHeight > height ? height : window.innerHeight - 200

  before.width = width
  before.height = height
}

const getContext = (_before = before) => {
  return {
    before: _before.getContext('2d')
  }
}

// imageDataの作成
const createImageData= (width, height) => {
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(width, height)
  return imageData
}

const mosaicPart = (mosaicSize, position) =>{
  const {before} = getContext()
  const imageData = before.getImageData(0,0, before.canvas.width, before.canvas.height)

  var srcData = imageData.data
  var imgWidth = imageData.width
  var imgHeight = imageData.height
  var _imageData = createImageData(imgWidth, imgHeight)
  var data = _imageData.data

  // モザイクサイズが mxnの場合 mxnごとにしょりする
  for( var x = position.x; x < position.w; x += mosaicSize) {
    if (mosaicSize <= position.w - x) {
      w = mosaicSize
    } else {
      w = position.w - x
    }

    for(var y  = position.y; y < position.h; y += mosaicSize) {
      if (mosaicSize <= position.h - y) {
        h = mosaicSize
      } else {
        h = position.h - y
      }

      // --- モザイクの色を計算する
      
      // wとhのブロックのrgbの色の合計を取得する
      var r = g = b = a = 0
      for(var i= 0; i < w; i++) {
        for(var j = 0; j< h; j++) {
          const pixelIndex = ((y + j) * imgWidth + (x + i)) * 4

          r += srcData[pixelIndex + 0]
          g += srcData[pixelIndex + 1]
          b += srcData[pixelIndex + 2]
          a += srcData[pixelIndex + 3]
        }
      }

      // 平均をとる
      const pixelCount = w * h // ピクセル数
      r = Math.round(r / pixelCount)
      g = Math.round(g/ pixelCount)
      b = Math.round(b / pixelCount)
      a = Math.round(a / pixelCount)


      // モザイクをかける
      for(var i= 0; i < w; i++) {
        for(var j = 0; j< h; j++) {
          const pixelIndex = ((y + j) * imgWidth + (x + i)) * 4

          srcData[pixelIndex + 0] = r
          srcData[pixelIndex + 1] = g
          srcData[pixelIndex + 2] = b
          srcData[pixelIndex + 3] = a
        }
      }
    }
  }

  // レンダリング
  before.putImageData(imageData, 0, 0)
}