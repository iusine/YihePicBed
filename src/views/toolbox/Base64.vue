<template>
  <div class="base64-page">
    <div class="page-head">
      <div class="page-title">图片转 Base64</div>
      <div class="page-desc">不限制图片大小和数量，在线转换成 Base64 编码；图片仅在本地浏览器处理。</div>
    </div>

    <div class="panel panel-pad block">
      <DropZone @files="addFiles">
        <div class="dz-icon"><el-icon><DocumentCopy /></el-icon></div>
        <div class="dz-tip">拖拽 / 粘贴 / 点击此处选择图片</div>
        <div class="dz-sub">支持多张，转换结果可直接复制</div>
      </DropZone>

      <div v-if="items.length" class="gap-row top-bar">
        <el-switch v-model="withPrefix" active-text="包含 data:image 前缀" inactive-text="仅纯 Base64"></el-switch>
        <el-button v-if="items.length" text type="danger" @click="clearAll">清空</el-button>
      </div>
    </div>

    <div v-if="items.length" class="list">
      <div v-for="item in items" :key="item.id" class="panel item-row">
        <el-image class="thumb" :src="item.dataUrl" fit="contain"></el-image>
        <div class="content">
          <div class="row1">
            <span class="name" :title="item.name">{{ item.name }}</span>
            <span class="muted">{{ formatSize(item.size) }} · {{ item.charLen }} 字符</span>
          </div>
          <el-input
            class="code"
            type="textarea"
            :model-value="display(item)"
            :rows="3"
            readonly
            resize="none"
          ></el-input>
        </div>
        <div class="ops">
          <el-button size="small" type="primary" :icon="CopyDocument" @click="copyItem(item)">复制</el-button>
          <el-button size="small" :icon="Download" @click="downloadItem(item)">下载 .txt</el-button>
          <el-icon class="remove" @click="removeItem(item)"><Close /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DocumentCopy, CopyDocument, Download, Close } from '@element-plus/icons-vue'
import DropZone from '@/components/DropZone'
import { readFileAsDataURL, formatSize, onPasteImages, downloadBlob } from '@/utils/image'
import { copyTextAsync } from '@/utils/copy'

let uid = 0

export default {
  name: 'ToolBase64',
  components: { DropZone, DocumentCopy, CopyDocument, Download, Close },
  data() {
    return {
      items: [],
      withPrefix: true
    }
  },
  mounted() {
    this._offPaste = onPasteImages(files => this.addFiles(files))
  },
  beforeUnmount() {
    this._offPaste && this._offPaste()
  },
  methods: {
    async addFiles(files) {
      for (const file of files) {
        try {
          const dataUrl = await readFileAsDataURL(file)
          const pure = dataUrl.slice(dataUrl.indexOf(',') + 1)
          this.items.push({
            id: ++uid,
            file,
            name: file.name,
            size: file.size,
            dataUrl,
            pure,
            charLen: pure.length
          })
        } catch (e) {
          console.error(e)
          this.msgError(`读取 ${file.name} 失败`)
        }
      }
    },
    display(item) {
      return this.withPrefix ? item.dataUrl : item.pure
    },
    async copyItem(item) {
      try {
        await copyTextAsync(this.display(item))
        this.msgSuccess('复制成功')
      } catch (e) {
        this.msgError('复制失败，请手动复制')
      }
    },
    downloadItem(item) {
      const blob = new Blob([this.display(item)], { type: 'text/plain;charset=utf-8' })
      const base = item.name.replace(/\.[^.]+$/, '')
      downloadBlob(blob, `${base}.base64.txt`)
    },
    removeItem(item) {
      this.items = this.items.filter(i => i.id !== item.id)
    },
    clearAll() {
      this.items = []
    }
  }
}
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 16px;
}

.top-bar {
  margin-top: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;

  .thumb {
    width: 72px;
    height: 72px;
    flex: 0 0 72px;
    border-radius: var(--radius-sm);
    background: var(--bg-hover);
  }

  .content {
    flex: 1;
    min-width: 0;

    .row1 {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;

      .name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .code {
      :deep(textarea) {
        font-family: Consolas, Menlo, monospace;
        font-size: 12px;
        word-break: break-all;
      }
    }
  }

  .ops {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;

    .remove {
      cursor: pointer;
      color: var(--text-3);

      &:hover {
        color: var(--el-color-danger);
      }
    }
  }
}
</style>
