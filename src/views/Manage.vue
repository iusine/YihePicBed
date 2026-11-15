<template>
  <div class="manage-page">
    <div class="page-head">
      <div class="page-title">图床管理</div>
      <div class="page-desc">选择仓库与目录，查询图片；支持上传、复制 CDN / Markdown 链接与删除。已选择的仓库与目录会在刷新后自动恢复。</div>
    </div>

    <div class="panel panel-pad block">
      <!-- 第一行：仓库 + 目录 + 查询 -->
      <div class="row1">
        <el-select v-model="activeRepos" placeholder="请选择仓库" filterable style="width: 260px" @change="changeRepos">
          <el-option v-for="item in reposList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
        <el-cascader
          :key="resourceShow"
          v-model="activePath"
          placeholder="请选择目录"
          :options="pathArr"
          :props="pathProps"
          :disabled="!activeRepos"
          style="width: 380px"
        ></el-cascader>
        <el-button type="primary" :icon="Search" :disabled="!activeRepos" @click="search">查询</el-button>
        <el-button class="upload-btn" type="primary" plain :icon="Upload" :disabled="!activeRepos" @click="openDrawer">上传</el-button>
      </div>

      <!-- 第二行：源站/CDN 开关 + 上传 -->
      <div class="row2">
        <el-switch v-model="isCDN" active-text="CDN 加速" inactive-text="GitHub 源站" :disabled="!activeRepos"></el-switch>
        <span class="muted row2-tip">开启后图片直链走 jsDelivr CDN，关闭则使用 GitHub 源站链接</span>
      </div>

      <!-- 第三行：CDN 源站临时切换 -->
         <!-- 
      <div v-if="activeRepos" class="row3">
        <el-input v-model="newCdnBaseUrl" placeholder="输入新的 CDN 站源后点击切换（长期生效请在“图床配置”中保存默认）" size="small" clearable style="width: 420px"></el-input>
        <el-button size="small" type="primary" plain @click="confirmCdnBaseUrl">切换 CDN 源站</el-button>
        <span class="muted">当前：https://{{ cdnBaseUrl }}/gh/{{ (userInfo && userInfo.login) || '...' }}/{{ activeRepos || '...' }}/…</span>
      </div>-->
    </div>
    <div class="warn-row">
      <el-alert
        title="只显示 &lt;img&gt; 标签支持的 apng, avif, bmp, gif, ico, cur, jpg, jpeg, jfif, pjpeg, pjp, png, svg, tif, tiff, webp 格式的图片。"
        type="warning"
        show-icon
        close-text="不再提示"
        v-if="hintShow1"
        @close="noDisplay(1)"
      />
      <el-alert
        title="仅支持获取 1000 个文件内的目录，超出则将请求失败"
        type="warning"
        show-icon
        close-text="不再提示"
        v-if="hintShow2"
        @close="noDisplay(2)"
      />
      <el-alert
        title="不可上传同名文件，否则将收到 422 错误码，如需替换请先删除原文件"
        type="warning"
        show-icon
        close-text="不再提示"
        v-if="hintShow3"
        @close="noDisplay(3)"
      />
    </div>

    <div class="panel panel-pad">
      <el-empty v-if="!fileList.length && !loading" :description="activeRepos ? '当前目录没有可显示的图片，点上方「上传」添加' : '请先选择仓库并查询'" />
      <div v-if="loading" class="loading-tip"><span class="spinner"></span>图片加载中…</div>
      <div v-viewer :key="viewerKey" class="image-grid">
        <div class="image-container hover-lift" v-for="(file, index) in fileList" :key="index">
          <el-image class="img" :src="imgUrl(file)" fit="scale-down"></el-image>
          <div class="image-content">
            <div class="info">
              <span>{{ file.name }}</span>
            </div>
            <div class="icons">
              <el-tooltip content="复制 CDN 链接" placement="top">
                <button type="button" class="op-btn" data-act="cdn" @click="copy(1, file)">
                  <el-icon><Link /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="复制 Markdown 链接" placement="top">
                <button type="button" class="op-btn" data-act="md" @click="copy(2, file)">
                  <SvgIcon icon-class="markdown" />
                </button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <button type="button" class="op-btn danger" data-act="del" @click="delFile(file)">
                  <el-icon><Delete /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer title="上传文件" v-model="isDrawerShow" direction="rtl" size="420px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="drawer-body">
        <div class="toolbar">
          <el-radio v-model="nameType" value="1">使用源文件名</el-radio>
          <el-radio v-model="nameType" value="2">使用UUID文件名</el-radio>
        </div>
        <div class="gap-row drawer-act">
          <span class="muted">当前目录：{{ realPath }}</span>
          <el-button type="primary" size="small" :icon="Upload" v-throttle="[submitUpload, `click`, 3000]">确定上传</el-button>
        </div>
        <div class="custom-path-row">
          <el-switch v-model="isCustomPath" active-text="自定义目录"></el-switch>
          <el-input
            v-if="isCustomPath"
            placeholder="例：oldFolder/newFolder/"
            v-model="customPath"
            size="small"
            style="margin-top: 8px"
          ></el-input>
        </div>
        <el-upload
          ref="uploadRef"
          action=""
          :http-request="upload"
          drag
          multiple
          :file-list="uploadList"
          list-type="picture"
          :auto-upload="false"
          @change="onUploadChange"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, UploadFilled, Link, Delete } from '@element-plus/icons-vue'
import SvgIcon from "@/components/SvgIcon"
import { getUserRepos, getReposContents, delFile, upload } from "@/api/github"
import { isImgExt } from "@/utils/validate"
import { randomUUID } from "@/utils/uuid"
import { copyTextAsync } from "@/utils/copy"
import { taskQueue } from "@/utils/task-queue"

export default {
  name: "Manage",
  components: { SvgIcon, Search, Upload, UploadFilled, Link, Delete },
  data() {
    return {
      reposList: [],
      pathArr: [{ value: '', label: '根目录', leaf: false }],
      activeRepos: '',
      activePath: [''], // 默认选中根目录
      pathProps: {
        lazy: true,
        checkStrictly: true,
        lazyLoad: async (node, resolve) => {
          if (!this.activeRepos) {
            resolve([])
            return
          }
          // element-plus 级联节点通过 pathValues 暴露从根到当前节点的值数组
          const path = this.normalizePath(node.pathValues)
          const nodes = []
          await this.getReposContents(nodes, path)
          resolve(nodes)
        }
      },
      hintShow1: true,
      hintShow2: true,
      hintShow3: true,
      fileList: [],
      loading: false,
      // 每次查询后 +1，强制重建 v-viewer（否则新加载的图片不会绑定到 viewer）
      viewerKey: 0,
      resourceShow: 0,
      isDrawerShow: false,
      nameType: '1',
      uploadList: [],
      isCDN: true,
      isCustomPath: false,
      customPath: '', // 自定义目录（如 oldFolder/newFolder 或 /oldFolder/newFolder/）
      cdnBaseUrl: localStorage.getItem('cdnBaseUrl') || 'jsd.onmicrosoft.cn',
      newCdnBaseUrl: ''
    }
  },
  computed: {
    // 规范化自定义目录：去掉首尾斜杠，'/' 或空串视为仓库根目录
    customDir() {
      const raw = this.isCustomPath ? this.customPath : ''
      return (raw || '').replace(/^\/+|\/+$/g, '')
    },
    realPath() {
      if (!this.userInfo || !this.userInfo.login) return ''
      const base = `/${this.userInfo.login}/${this.activeRepos}`
      if (this.isCustomPath) {
        return this.customDir ? `${base}/${this.customDir}/` : `${base}/`
      }
      const dir = this.currentDirPath()
      return `${base}/${dir ? dir + '/' : ''}`
    }
  },
  watch: {
    // 用户改动目录后自动记忆
    activePath() {
      if (this._restoring || !this.activeRepos) return
      this.persistSelection()
    }
  },
  created() {
    this.hintShow1 = localStorage.getItem('hintShow1') ? false : true
    this.hintShow2 = localStorage.getItem('hintShow2') ? false : true
    this.hintShow3 = localStorage.getItem('hintShow3') ? false : true
    const token = localStorage.getItem('githubToken')
    const userInfo = localStorage.getItem('githubUserInfo')
    if (token && userInfo) {
      this.userInfo = JSON.parse(userInfo)
      this.getRepos()
    } else {
      this.msgError('请先在「图床配置」中配置 Token')
      this.$router.push('/setting')
    }
  },
  methods: {
    // 获取用户仓库，并恢复上次选择的仓库与目录
    getRepos() {
      getUserRepos(this.userInfo.login).then(async res => {
        this.reposList = res || []
        if (!this.reposList.length) return
        const savedRepo = localStorage.getItem('phRepo')
        this.activeRepos =
          savedRepo && this.reposList.some(r => r.name === savedRepo) ? savedRepo : this.reposList[0].name
        this.resourceShow++ // 重新挂载级联选择器
        this.fileList = []
        this._restoring = true
        try {
          await this.restoreSelection()
        } catch (e) {
          console.warn('恢复目录失败，回到根目录', e)
          this.activePath = ['']
        } finally {
          this._restoring = false
        }
      })
    },
    changeRepos() {
      this.resourceShow++ // 改变级联选择器的 key 来重置其中选项内容
      this.activePath = [''] // 默认选中根目录
      this.fileList = []
      this.persistSelection()
    },
    // 当前选中目录（过滤根目录的空值标记）
    currentDirPath() {
      return (this.activePath || [])
        .filter(p => typeof p === 'string' && p !== '')
        .join('/')
    },
    normalizePath(values) {
      return (values || [])
        .filter(p => typeof p === 'string' && p !== '')
        .join('/')
    },
    // ===== 目录选择记忆 =====
    persistSelection() {
      if (!this.activeRepos) return
      try {
        localStorage.setItem('phRepo', this.activeRepos)
        localStorage.setItem('phPath', JSON.stringify(this.activePath || ['']))
      } catch (e) {
        console.warn(e)
      }
    },
    // 读取记忆的目录，并按目录层级预取级联节点，保证回显与后续使用一致
    async restoreSelection() {
      let saved = []
      try {
        saved = JSON.parse(localStorage.getItem('phPath') || '[]')
      } catch (e) {
        saved = []
      }
      const segs = (Array.isArray(saved) ? saved : []).filter(s => typeof s === 'string' && s !== '')
      if (!segs.length) {
        this.activePath = ['']
        this.persistSelection()
        return
      }
      const rootOption = await this.buildCascaderOptions(segs)
      if (!rootOption) {
        // 记忆的目录已不存在，安全回到根目录
        this.activePath = ['']
        this.persistSelection()
        return
      }
      this.pathArr = [rootOption]
      this.activePath = segs
      this.persistSelection()
      await this.$nextTick()
    },
    async buildCascaderOptions(segs) {
      try {
        const rootDirs = []
        await this.getReposContents(rootDirs, '')
        const rootOption = { value: '', label: '根目录', leaf: false, children: rootDirs }
        let current = rootOption
        let prefix = ''
        for (const seg of segs) {
          const dirs = current.children || []
          const found = dirs.find(d => d.value === seg)
          if (!found) return null
          const deeper = []
          await this.getReposContents(deeper, prefix ? `${prefix}/${seg}` : seg)
          found.children = deeper
          current = found
          prefix = prefix ? `${prefix}/${seg}` : seg
        }
        return rootOption
      } catch (e) {
        console.warn(e)
        return null
      }
    },
    async getReposContents(arr, path) {
      await getReposContents(this.userInfo.login, this.activeRepos, path).then(res => {
        res.forEach(item => {
          if (item.type === 'dir') {
            // 让所有节点都是非叶子节点
            arr.push({ value: item.name, label: item.name, leaf: false })
          }
        })
      })
    },
    search() {
      if (!this.activeRepos) return
      this.loading = true
      this.fileList = []
      const path = this.currentDirPath()
      getReposContents(this.userInfo.login, this.activeRepos, path).then(res => {
        res.forEach(item => {
          if (item.type === 'file' && isImgExt(item.name)) {
            this.fileList.push(item)
          }
        })
        this.viewerKey++
      }).finally(() => {
        this.loading = false
      })
    },
    noDisplay(id) {
      localStorage.setItem(`hintShow${id}`, '1')
    },
    imgUrl(file) {
      return this.isCDN
        ? `https://${this.cdnBaseUrl}/gh/${this.userInfo.login}/${this.activeRepos}/${file.path}`
        : file.download_url
    },
    async copy(type, file) {
      // type 1 cdn link  2 Markdown
      const imgUrl = `https://${this.cdnBaseUrl}/gh/${this.userInfo.login}/${this.activeRepos}/${file.path}`
      const copyCont = type === 2 ? `![${file.name}](${imgUrl})` : imgUrl
      try {
        await copyTextAsync(copyCont)
        this.msgSuccess(type === 2 ? '已复制 Markdown 链接' : '已复制 CDN 链接')
      } catch (e) {
        console.error(e)
        this.msgError('复制失败，请手动复制')
      }
    },
    delFile(file) {
      ElMessageBox.confirm("此操作将永久删除该文件, 是否删除?", "提示", {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const data = {
          message: 'Delete file via PictureBed',
          sha: file.sha
        }
        try {
          await delFile(this.userInfo.login, this.activeRepos, file.path, data)
          this.msgSuccess('删除成功')
          this.search()
        } catch (e) {
          console.error(e)
          ElMessage({ type: 'error', message: '删除失败，请稍后重试' })
        }
      }).catch(() => {
        // 用户取消
        ElMessage({ type: 'info', message: '已取消删除' })
      })
    },
    openDrawer() {
      this.isDrawerShow = true
    },
    onUploadChange(file, fileList) {
      // element-plus 上传实例未暴露 uploadFiles，改用 change 事件同步文件列表
      this.uploadList = fileList
    },
    submitUpload() {
      if (this.uploadList.length) {
        // 触发 el-upload 中 http-request 绑定的函数
        this.$refs.uploadRef.submit()
      } else {
        this.msgError('请先选择文件')
      }
    },
    upload(data) {
      const reader = new FileReader()
      reader.readAsDataURL(data.file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        let fileName = data.file.name
        if (this.nameType === '2') {
          fileName = randomUUID() + fileName.substr(fileName.lastIndexOf('.'))
        }
        // 批量上传需要间隔时间，否则可能 commit 版本号冲突，返回 409 错误码
        taskQueue(() => this.push2Github(data, fileName, base64), 1000)
      }
    },
    push2Github(data, fileName, base64) {
      const requestData = {
        message: 'Add files via PictureBed',
        content: base64
      }

      let path = this.isCustomPath ? this.customDir : this.currentDirPath()

      upload(this.userInfo.login, this.activeRepos, path, fileName, requestData).then(() => {
        this.msgSuccess('上传成功')
        data.onSuccess()
      }).catch(err => {
        data.onError && data.onError(err)
      })
    },
    // 切换 CDN 基础 URL（临时生效）
    confirmCdnBaseUrl() {
      const value = (this.newCdnBaseUrl || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
      if (!value) {
        this.msgError('请输入新的 CDN 站源')
        return
      }
      this.cdnBaseUrl = value
      this.msgSuccess(`已切换 CDN 站源：${value}（如需长期生效请在「图床配置」保存）`)
    }
  }
}
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 16px;
}

.row1 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.row2 {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);

  .row2-tip {
    margin-right: auto;
  }

  .upload-btn {
    margin-left: auto;
  }
}

.row3 {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.warn-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  :deep(.el-alert) {
    border-radius: var(--radius-card);
  }
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--text-3);
  font-size: 14px;

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--line);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.image-container {
  position: relative;
  width: 190px;
  height: 190px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);

  .img {
    width: 100%;
    height: 100%;
  }
}

.image-content {
  position: absolute;
  inset: 0;
  z-index: 2; // 操作浮层需盖在图片之上（否则点击会落在图片层上）
  pointer-events: none; // 背景不拦截图片点击（图片可正常进入 v-viewer）

  .info {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    padding: 6px 8px;
    font-size: 12px;
    color: #fff;
    background: linear-gradient(0deg, transparent, rgba(0, 0, 0, 0.55));
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;

    span {
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .icons {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateY(6px);
    opacity: 0;
    transition: all 0.25s ease;
    pointer-events: auto; // 按钮区域允许点击
  }
}

.op-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, color 0.2s ease;

  .el-icon {
    font-size: 16px;
  }

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  &:hover {
    background: var(--el-color-primary);
    transform: scale(1.12);
  }

  &.danger:hover {
    background: var(--el-color-danger);
  }
}

.image-container:hover .image-content .info,
.image-container:hover .image-content .icons {
  opacity: 1;
  transform: translateY(0);
}

.drawer-body {
  .drawer-act {
    margin: 14px 0;
    justify-content: space-between;
  }

  .custom-path-row {
    margin-bottom: 16px;
  }
}
</style>

<style>
.el-drawer__body {
  padding: 0 20px 20px;
  overflow: auto;
}

.el-drawer__body .el-upload {
  margin-top: 16px;
}

.el-drawer__body .el-upload, .el-drawer__body .el-upload-dragger {
  width: 100%;
}
</style>
