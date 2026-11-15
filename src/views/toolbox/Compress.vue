<template>
  <div class="compress-page">
    <div class="page-head">
      <div class="page-title">图片压缩</div>
      <div class="page-desc">纯浏览器本地处理，图片不会上传到服务器；支持批量拖拽 / 粘贴 / 点击选择。</div>
    </div>

    <div class="panel panel-pad block">
      <DropZone @files="addFiles">
        <div class="dz-icon"><el-icon><PictureFilled /></el-icon></div>
        <div class="dz-tip">拖拽 / 粘贴 / 点击此处选择图片</div>
        <div class="dz-sub">不限制图片大小和数量</div>
      </DropZone>

      <div class="toolbar options">
        <div class="opt-item">
          <span class="opt-label">输出格式</span>
          <el-select v-model="options.format" style="width: 130px">
            <el-option label="WebP（推荐）" value="webp"></el-option>
            <el-option label="JPEG" value="jpeg"></el-option>
            <el-option label="PNG（无损）" value="png"></el-option>
          </el-select>
        </div>
        <div class="opt-item">
          <span class="opt-label">质量</span>
          <el-slider v-model="options.quality" :min="10" :max="100" :disabled="options.format === 'png'" style="width: 180px"></el-slider>
          <span class="muted">{{ options.quality }}%</span>
        </div>
        <div class="gap-row" style="margin-left: auto">
          <el-button :disabled="!pendingCount" type="primary" :icon="MagicStick" :loading="busy" @click="start">开始压缩</el-button>
          <el-button :disabled="!doneItems.length" :icon="Download" @click="downloadAll">下载全部（{{ doneItems.length }}）</el-button>
          <el-button v-if="items.length" text type="danger" @click="clearAll">清空</el-button>
        </div>
      </div>
    </div>

    <div v-if="items.length" class="grid">
      <div v-for="item in items" :key="item.id" class="panel item-card">
        <div class="thumb">
          <el-image :src="item.rawUrl || item.thumbUrl" fit="contain"></el-image>
          <el-icon v-if="item.status === 'error'" class="state-badge error"><WarningFilled /></el-icon>
          <span v-else-if="item.status === 'busy'" class="state-badge busy">压缩中…</span>
        </div>
        <div class="info">
          <div class="name" :title="item.name">{{ item.name }}</div>
          <div v-if="item.status === 'done'" class="size-row">
            <span>{{ formatSize(item.oriSize) }}</span>
            <el-icon><Right /></el-icon>
            <span class="strong">{{ formatSize(item.outSize) }}</span>
            <el-tag v-if="item.saving !== null && item.saving >= 0" size="small" type="success" effect="plain">-{{ item.saving }}%</el-tag>
            <el-tag v-else-if="item.saving !== null && item.saving < 0" size="small" type="info" effect="plain">变大 {{ -item.saving }}%</el-tag>
          </div>
          <div v-else-if="item.status === 'error'" class="muted">处理失败，请重试</div>
          <div v-else class="muted">{{ formatSize(item.oriSize) }}</div>
        </div>
        <div class="ops">
          <el-button size="small" type="primary" :icon="Download" :disabled="item.status !== 'done'" @click="downloadOne(item)">下载</el-button>
          <el-icon class="remove" @click="removeItem(item)"><Close /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PictureFilled, MagicStick, Download, Right, WarningFilled, Close } from '@element-plus/icons-vue'
import DropZone from '@/components/DropZone'
import { readFileAsDataURL, loadImage, reEncodeImage, formatSize, onPasteImages, downloadBlob } from '@/utils/image'

let uid = 0

export default {
  name: 'ToolCompress',
  components: { DropZone, PictureFilled, MagicStick, Download, Right, WarningFilled, Close },
  data() {
    return {
      items: [],
      busy: false,
      options: {
        format: 'webp',
        quality: 75
      }
    }
  },
  computed: {
    pendingCount() {
      return this.items.filter(i => i.status === 'wait').length
    },
    doneItems() {
      return this.items.filter(i => i.status === 'done' && i.outBlob)
    }
  },
  mounted() {
    this._offPaste = onPasteImages(files => this.addFiles(files))
  },
  beforeUnmount() {
    this._offPaste && this._offPaste()
    this.revokeUrls()
  },
  methods: {
    addFiles(files) {
      files.forEach(file => {
        const item = {
          id: ++uid,
          file,
          name: file.name,
          oriSize: file.size,
          status: 'wait', // wait | busy | done | error
          rawUrl: URL.createObjectURL(file),
          outBlob: null,
          outName: '',
          outSize: 0,
          saving: null,
          thumbUrl: ''
        }
        this.items.push(item)
      })
    },
    async start() {
      const targets = this.items.filter(i => i.status === 'wait')
      if (!targets.length) {
        this.msgError('没有待压缩的图片')
        return
      }
      this.busy = true
      for (const item of targets) {
        item.status = 'busy'
        try {
          const dataUrl = await readFileAsDataURL(item.file)
          const img = await loadImage(dataUrl)
          const blob = await reEncodeImage(img, {
            format: this.options.format,
            quality: this.options.quality / 100
          })
          item.outBlob = blob
          item.outSize = blob.size
          item.outName = this.outputName(item.name)
          item.saving = item.oriSize ? Math.round((1 - blob.size / item.oriSize) * 100) : null
          if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl)
          item.thumbUrl = URL.createObjectURL(blob)
          item.status = 'done'
        } catch (e) {
          console.error(e)
          item.status = 'error'
        }
      }
      this.busy = false
    },
    outputName(name) {
      const ext = this.options.format === 'jpeg' ? 'jpg' : this.options.format
      const base = name.replace(/\.[^.]+$/, '')
      return `${base}.${ext}`
    },
    downloadOne(item) {
      if (!item.outBlob) return
      downloadBlob(item.outBlob, item.outName)
    },
    downloadAll() {
      this.doneItems.forEach(item => downloadBlob(item.outBlob, item.outName))
    },
    removeItem(item) {
      if (item.rawUrl) URL.revokeObjectURL(item.rawUrl)
      if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl)
      this.items = this.items.filter(i => i.id !== item.id)
    },
    clearAll() {
      this.revokeUrls()
      this.items = []
    },
    revokeUrls() {
      this.items.forEach(item => {
        if (item.rawUrl) URL.revokeObjectURL(item.rawUrl)
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 16px;
}

.options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}

.opt-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opt-label {
  font-size: 13px;
  color: var(--text-2);
  white-space: nowrap;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.item-card {
  width: 220px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .thumb {
    position: relative;
    height: 150px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--bg-hover);

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }

    .state-badge {
      position: absolute;
      left: 6px;
      bottom: 6px;
      font-size: 13px;
    }

    .state-badge.error {
      color: var(--el-color-danger);
    }

    .state-badge.busy {
      color: var(--el-color-primary);
      font-size: 11px;
      background: var(--bg-panel);
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  .info {
    .name {
      font-size: 13px;
      color: var(--text-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .size-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-3);

      .strong {
        color: var(--el-color-success);
        font-weight: 600;
      }
    }
  }

  .ops {
    display: flex;
    align-items: center;
    gap: 8px;

    .remove {
      margin-left: auto;
      cursor: pointer;
      color: var(--text-3);

      &:hover {
        color: var(--el-color-danger);
      }
    }
  }
}
</style>
