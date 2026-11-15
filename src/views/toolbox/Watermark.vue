<template>
  <div class="wm-page">
    <div class="page-head">
      <div class="page-title">图片水印</div>
      <div class="page-desc">自定义水印文字、大小、位置、颜色和透明度，支持导出 PNG / JPEG；图片仅本地处理。</div>
    </div>

    <div class="wm-layout">
      <div class="panel panel-pad preview-panel">
        <DropZone v-if="!file" @files="chooseFiles">
          <div class="dz-icon"><el-icon><PictureFilled /></el-icon></div>
          <div class="dz-tip">拖拽 / 粘贴 / 点击选择图片</div>
          <div class="dz-sub">添加图片后实时预览水印效果</div>
        </DropZone>

        <template v-else>
          <div class="preview-box">
            <canvas ref="canvasEl"></canvas>
          </div>
          <div class="preview-footer">
            <div class="file-info">
              <div class="fname" :title="file.name">{{ file.name }}</div>
              <div class="muted">{{ dims }} · {{ formatSize(rawSize) }}</div>
            </div>
            <div class="gap-row">
              <el-button :icon="Refresh" @click="pickAnother">更换图片</el-button>
              <el-button type="primary" :icon="Download" :loading="busy" @click="exportImage">下载图片</el-button>
            </div>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onFilePick">
          </div>
        </template>
      </div>

      <div class="panel panel-pad settings-panel">
        <div class="set-row">
          <div class="set-label">添加水印</div>
          <el-switch v-model="wmEnabled"></el-switch>
        </div>

        <div class="set-row" :class="{ disabled: !wmEnabled }">
          <div class="set-label">水印文字 <span class="muted">（限 20 字）</span></div>
          <el-input v-model="wmText" maxlength="20" show-word-limit size="small" placeholder="请输入水印文字"></el-input>
        </div>

        <div class="set-row" :class="{ disabled: !wmEnabled }">
          <div class="set-label">水印大小 <span class="muted">{{ wmPct }}% · 约 {{ fontPx }}px</span></div>
          <el-slider v-model="wmPct" :min="1" :max="12" :step="0.5" :disabled="!wmEnabled"></el-slider>
        </div>

        <div class="set-row" :class="{ disabled: !wmEnabled }">
          <div class="set-label">颜色</div>
          <el-color-picker v-model="wmColor" :disabled="!wmEnabled" :predefine="predefineColors"></el-color-picker>
          <span class="muted" style="margin-left: 8px">{{ wmColor }}</span>
        </div>

        <div class="set-row" :class="{ disabled: !wmEnabled }">
          <div class="set-label">透明度 <span class="muted">{{ wmOpacity }}%</span></div>
          <el-slider v-model="wmOpacity" :min="5" :max="100" :disabled="!wmEnabled"></el-slider>
        </div>

        <div class="set-row" :class="{ disabled: !wmEnabled }">
          <div class="set-label">位置</div>
          <el-radio-group v-model="wmPos" :disabled="!wmEnabled">
            <el-radio-button value="lt">左上</el-radio-button>
            <el-radio-button value="rt">右上</el-radio-button>
            <el-radio-button value="lb">左下</el-radio-button>
            <el-radio-button value="rb">右下</el-radio-button>
            <el-radio-button value="cc">居中</el-radio-button>
          </el-radio-group>
        </div>

        <el-divider></el-divider>

        <div class="set-row">
          <div class="set-label">导出格式</div>
          <el-radio-group v-model="outFormat">
            <el-radio-button value="png">PNG（保留透明）</el-radio-button>
            <el-radio-button value="jpeg">JPEG</el-radio-button>
          </el-radio-group>
        </div>

        <div class="muted note">JPEG 会以白色为背景输出；建议浅色水印配文字阴影，深色图片上更清晰。</div>
      </div>
    </div>
  </div>
</template>

<script>
import { PictureFilled, Download, Refresh } from '@element-plus/icons-vue'
import DropZone from '@/components/DropZone'
import { readFileAsDataURL, loadImage, formatSize, onPasteImages, downloadBlob } from '@/utils/image'

export default {
  name: 'ToolWatermark',
  components: { DropZone, PictureFilled, Download, Refresh },
  data() {
    return {
      file: null,
      fileName: '',
      rawUrl: '',
      rawImg: null,
      rawSize: 0,
      dims: '',
      wmEnabled: true,
      wmText: 'Picture Hosting',
      wmPct: 5,
      wmColor: '#ffffff',
      wmOpacity: 85,
      wmPos: 'rb',
      outFormat: 'png',
      busy: false,
      predefineColors: ['#ffffff', '#000000', '#409eff', '#f56c6c', '#e6a23c', '#67c23a']
    }
  },
  computed: {
    fontPx() {
      if (!this.rawImg) return 0
      const min = Math.min(this.rawImg.naturalWidth, this.rawImg.naturalHeight)
      return Math.max(10, Math.round((min * this.wmPct) / 100))
    }
  },
  watch: {
    wmEnabled() { this.renderSoon() },
    wmText() { this.renderSoon() },
    wmPct() { this.renderSoon() },
    wmColor() { this.renderSoon() },
    wmOpacity() { this.renderSoon() },
    wmPos() { this.renderSoon() },
    outFormat() { this.renderSoon() }
  },
  mounted() {
    this._offPaste = onPasteImages(files => {
      if (files.length) this.chooseFiles(files)
    })
  },
  beforeUnmount() {
    this._offPaste && this._offPaste()
    if (this.rawUrl) URL.revokeObjectURL(this.rawUrl)
    clearTimeout(this._renderTimer)
  },
  methods: {
    chooseFiles(files) {
      if (!files || !files.length) return
      this.loadFile(files[0])
    },
    onFilePick(e) {
      const file = e.target.files && e.target.files[0]
      if (file) this.loadFile(file)
    },
    pickAnother() {
      this.$refs.fileInput.value = ''
      this.$refs.fileInput.click()
    },
    async loadFile(file) {
      if (!file.type || !file.type.startsWith('image/')) {
        this.msgError('请选择图片文件')
        return
      }
      try {
        if (this.rawUrl) URL.revokeObjectURL(this.rawUrl)
        const dataUrl = await readFileAsDataURL(file)
        const img = await loadImage(dataUrl)
        if (!img.naturalWidth || !img.naturalHeight) {
          this.msgError('无法解析该图片')
          return
        }
        this.file = file
        this.fileName = file.name
        this.rawSize = file.size
        this.rawImg = img
        this.rawUrl = dataUrl
        this.dims = `${img.naturalWidth} × ${img.naturalHeight}`
        await this.$nextTick()
        this.render()
      } catch (e) {
        console.error(e)
        this.msgError('图片加载失败')
      }
    },
    renderSoon() {
      clearTimeout(this._renderTimer)
      this._renderTimer = setTimeout(() => {
        if (this.rawImg) this.render()
      }, 120)
    },
    render() {
      const canvas = this.$refs.canvasEl
      const img = this.rawImg
      if (!canvas || !img) return
      const w = img.naturalWidth
      const h = img.naturalHeight
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, w, h)
      if (this.outFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)

      const text = (this.wmText || '').trim()
      if (this.wmEnabled && text) {
        const px = this.fontPx
        ctx.save()
        ctx.globalAlpha = this.wmOpacity / 100
        ctx.fillStyle = this.wmColor
        ctx.font = `600 ${px}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = Math.max(2, Math.round(px * 0.12))
        ctx.shadowOffsetY = Math.max(1, Math.round(px * 0.05))
        const tw = ctx.measureText(text).width
        const pad = Math.max(20, Math.round(px * 0.5))
        let x = pad
        let y = pad + px
        if (this.wmPos === 'rt') {
          x = w - pad - tw
          y = pad + px
        } else if (this.wmPos === 'lb') {
          x = pad
          y = h - pad
        } else if (this.wmPos === 'rb') {
          x = w - pad - tw
          y = h - pad
        } else if (this.wmPos === 'cc') {
          x = (w - tw) / 2
          y = h / 2 + px / 2
        }
        ctx.fillText(text, x, y)
        ctx.restore()
      }
    },
    exportImage() {
      if (!this.rawImg) return
      this.render()
      const canvas = this.$refs.canvasEl
      const mime = this.outFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
      const ext = this.outFormat === 'jpeg' ? 'jpg' : 'png'
      this.busy = true
      canvas.toBlob(blob => {
        this.busy = false
        if (!blob) {
          this.msgError('导出失败')
          return
        }
        const base = this.fileName.replace(/\.[^.]+$/, '')
        downloadBlob(blob, `${base}_watermark.${ext}`)
        this.msgSuccess('已开始下载')
      }, mime, 0.92)
    }
  }
}
</script>

<style lang="scss" scoped>
.wm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1000px) {
  .wm-layout {
    grid-template-columns: 1fr;
  }
}

.preview-panel {
  .preview-box {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 320px;
    max-height: 640px;
    overflow: auto;
    background: var(--bg-hover);

    canvas {
      max-width: 100%;
      max-height: 620px;
    }
  }

  .preview-footer {
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;

    .file-info {
      min-width: 0;

      .fname {
        font-weight: 600;
        color: var(--text-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.set-row {
  &.disabled {
    opacity: 0.5;
  }

  .set-label {
    font-size: 13px;
    color: var(--text-2);
    margin-bottom: 6px;
  }

  .el-color-picker {
    vertical-align: middle;
  }
}

.note {
  line-height: 1.7;
}
</style>
