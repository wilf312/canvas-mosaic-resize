
// dom
const file = document.querySelector('#file')
const message = document.querySelector('#message')
const before = document.querySelector('#before')
const after = document.querySelector('#after')

// ファイルの読み込み
file.addEventListener('change', (event) => {
  if (event.target.files.length === 1) {
    message.textContent = '読み込み'
    loadAction(event.target.files[0])
  } else if (event.target.files.length === 0) {
    message.textContent = 'ファイルが選択されていません'
  } else {
    message.textContent = '複数ファイルの読み込みはできません'
  }
})

// 画像読み込み時の処理
const loadAction = async (file) => {
  const result = await loadFile(file)
  const image = await loadImage(result)
  resizeCanvas(image.width, image.height)
  // beforeのレンダリング
  const beforeContext = before.getContext('2d')
  beforeContext.drawImage(image, 0,0)

  // afterの初期化
  const afterContext = after.getContext('2d')
  afterContext.clearRect(0,0, afterContext.canvas.width, afterContext.canvas.height)

  mosaic(10)
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
  before.width = width
  after.width = width
  before.height = height
  after.height = height
}

const getContext = (_before = before, _after = after) => {
  return {
    before: _before.getContext('2d'),
    after: _after.getContext('2d')
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

// モザイク処理
const mosaic = (mosaicSize) =>{
  const {before, after} = getContext()
  const imageData = before.getImageData(0,0, before.canvas.width, before.canvas.height)

  var srcData = imageData.data
  var imgWidth = imageData.width
  var imgHeight = imageData.height
  var _imageData = createImageData(imgWidth, imgHeight)
  var data = _imageData.data

  // モザイクサイズが mxnの場合 mxnごとにしょりする
  for( var x = 0; x < imgWidth; x += mosaicSize) {
    if (mosaicSize <= imgWidth - x) {
      w = mosaicSize
    } else {
      w = imgWidth - x
    }

    for(var y  = 0; y < imgHeight; y += mosaicSize) {
      if (mosaicSize <= imgHeight - y) {
        h = mosaicSize
      } else {
        h = imgHeight - y
      }


      // --- モザイクの色を計算する
      
      // wとhのブロックのrgbの色の合計を取得する
      var r = g = b = 0
      for(var i= 0; i < w; i++) {
        for(var j =0; j< h; j++) {
          const pixelIndex = ((y + j) * imgWidth + (x + i)) * 4

          r += srcData[pixelIndex + 0]
          g += srcData[pixelIndex + 1]
          b += srcData[pixelIndex + 2]
        }
      }

      // 平均をとる
      const pixelCount = w * h // ピクセル数
      r = Math.round(r / pixelCount)
      g = Math.round(g/ pixelCount)
      b = Math.round(b / pixelCount)


      // モザイクをかける
      for(var i= 0; i < w; i++) {
        for(var j =0; j< h; j++) {
          const pixelIndex = ((y + j) * imgWidth + (x + i)) * 4

          data[pixelIndex + 0] = r
          data[pixelIndex + 1] = g
          data[pixelIndex + 2] = b
          data[pixelIndex + 3] = srcData[pixelIndex + 3]
        }
      }
    }

  }


  // レンダリング
  after.clearRect(0,0, after.canvas.width, after.canvas.height)
  after.putImageData(_imageData, 0, 0)
}