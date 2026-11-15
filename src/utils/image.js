/**
 * 图片工具函数（纯前端）
 */

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export function extOf(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '')
  return m ? m[1].toLowerCase() : ''
}

/**
 * 注册 window paste 监听：从剪贴板中提取图片文件
 * @param {(files: File[]) => void} callback
 * @returns {() => void} 取消监听的函数
 */
export function onPasteImages(callback) {
  const handler = e => {
    const items = (e.clipboardData && e.clipboardData.items) || []
    const files = []
    for (const item of items) {
      if (item.kind === 'file' && item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length) callback(files)
  }
  window.addEventListener('paste', handler)
  return () => window.removeEventListener('paste', handler)
}

/**
 * 通过 canvas 重编码压缩图片
 * @param {HTMLImageElement} img
 * @param {Object} options { format: 'webp'|'jpeg'|'png', quality: 0-1 }
 * @returns {Promise<Blob>}
 */
export function reEncodeImage(img, { format = 'webp', quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('当前浏览器不支持 Canvas'))
      return
    }
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const mime = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('编码失败'))
      }
    }, mime, format === 'png' ? undefined : quality)
  })
}
