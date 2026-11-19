<template>
  <div class="manage-page" @dragover="onRootDragOver" @drop.prevent="onDragEnd">
    <div class="page-head">
      <div class="page-title">图床管理</div>
      <div class="page-desc">选择仓库后单击文件夹即可进入目录，内容自动刷新；图片可拖到文件夹或面包屑路径上移动，也支持新建目录、上传、多选移动、复制 CDN / Markdown 链接与删除，最近上传的图片排在最前。已选择的仓库与目录会在刷新后自动恢复。</div>
    </div>

    <div class="panel panel-pad block">
      <!-- 第一行：仓库 + 操作 -->
      <div class="row1">
        <el-select v-model="activeRepos" placeholder="请选择仓库" filterable style="width: 260px" @change="changeRepos">
          <el-option v-for="item in reposList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
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
      <div class="crumb-bar">
        <el-icon class="crumb-leaf"><Folder /></el-icon>
        <span
          class="crumb"
          :class="{ current: !pathSegs.length, 'drop-active': dropTarget === '' }"
          @click="goToDir([])"
          @dragover="onDirDragOver($event, '')"
          @dragleave="onDirDragLeave($event, '')"
          @drop.prevent="onDropTo('')"
        >根目录</span>
        <template v-for="(seg, i) in pathSegs" :key="seg + i">
          <el-icon class="crumb-sep"><ArrowRight /></el-icon>
          <span
            class="crumb"
            :class="{ current: i === pathSegs.length - 1, 'drop-active': dropTarget === pathSegs.slice(0, i + 1).join('/') }"
            @click="goToDir(pathSegs.slice(0, i + 1))"
            @dragover="onDirDragOver($event, pathSegs.slice(0, i + 1).join('/'))"
            @dragleave="onDirDragLeave($event, pathSegs.slice(0, i + 1).join('/'))"
            @drop.prevent="onDropTo(pathSegs.slice(0, i + 1).join('/'))"
          >{{ seg }}</span>
        </template>
        <el-button class="crumb-new" size="small" :icon="FolderAdd" :disabled="!activeRepos" @click="createDirectory">新建目录</el-button>
      </div>
      <div v-if="fileList.length" class="select-bar">
        <el-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @change="toggleSelectAll"
        >全选</el-checkbox>
        <span class="count">已选 {{ selectedPaths.length }} / {{ fileList.length }} 张</span>
        <el-button type="primary" size="small" :icon="Rank" :disabled="!selectedPaths.length" @click="openMoveDialog">移动到…</el-button>
        <el-button size="small" text :disabled="!selectedPaths.length" @click="clearSelection">取消选择</el-button>
      </div>
      <el-empty
        v-if="!fileList.length && !dirList.length && !loading"
        :description="activeRepos ? '当前目录没有可显示的图片，点上方「上传」添加' : '请先选择仓库'"
      />
      <div v-if="loading" class="loading-tip"><span class="spinner"></span>图片加载中…</div>
      <div v-viewer :key="viewerKey" class="image-grid">
        <div
          class="folder-card hover-lift"
          :class="{ 'drop-active': dropTarget === dir.path }"
          v-for="dir in dirList"
          :key="'dir-' + dir.path"
          :title="`进入 ${dir.name}`"
          @click="enterDir(dir)"
          @dragover="onDirDragOver($event, dir.path)"
          @dragleave="onDirDragLeave($event, dir.path)"
          @drop.prevent="onDropTo(dir.path)"
        >
          <el-icon class="folder-icon" :size="40"><Folder /></el-icon>
          <span class="folder-name">{{ dir.name }}</span>
        </div>
        <div
          class="image-container hover-lift"
          :class="{ selected: selectedPaths.includes(file.path) }"
          v-for="(file, index) in fileList"
          :key="index"
          draggable="true"
          @dragstart="onDragStart($event, file)"
          @dragend="onDragEnd"
        >
          <div class="select-box" @click.stop>
            <el-checkbox :model-value="selectedPaths.includes(file.path)" @change="toggleSelect(file)" />
          </div>
          <el-image class="img" :src="imgUrl(file)" fit="scale-down" lazy></el-image>
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
              <el-tooltip content="移动到其它目录" placement="top">
                <button type="button" class="op-btn" data-act="move" @click="moveOne(file)">
                  <el-icon><Rank /></el-icon>
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

    <el-dialog v-model="isMoveShow" title="移动图片" width="440px" append-to-body :close-on-click-modal="false">
      <div class="muted">已选择 {{ selectedPaths.length }} 张图片，请选择目标目录（重名文件会拒绝移动）。</div>
      <el-select
        v-model="moveTarget"
        filterable
        :loading="dirLoading"
        placeholder="选择目标目录"
        style="width: 100%; margin-top: 12px"
      >
        <el-option label="根目录" value="__root__"></el-option>
        <el-option v-for="dir in dirOptions" :key="dir" :label="dir" :value="dir"></el-option>
      </el-select>
      <template #footer>
        <el-button @click="isMoveShow = false">取消</el-button>
        <el-button type="primary" :loading="moving" @click="confirmMove">开始移动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled, Link, Delete, FolderAdd, Folder, Rank, ArrowRight } from '@element-plus/icons-vue'
import SvgIcon from "@/components/SvgIcon"
import {
  getUserRepos,
  getReposContents,
  delFile,
  upload,
  getRepo,
  getRef,
  getCommit,
  getTree,
  createTree,
  createCommit,
  updateRef
} from "@/api/github"
import { isImgExt } from "@/utils/validate"
import { randomUUID } from "@/utils/uuid"
import { copyTextAsync } from "@/utils/copy"
import { taskQueue } from "@/utils/task-queue"

export default {
  name: "Manage",
  components: { SvgIcon, Upload, UploadFilled, Link, Delete, FolderAdd, Folder, Rank, ArrowRight },
  data() {
    return {
      reposList: [],
      activeRepos: '',
      activePath: [''], // 默认选中根目录
      hintShow1: true,
      hintShow2: true,
      hintShow3: true,
      fileList: [],
      dirList: [],
      loading: false,
      // 每次查询后 +1，强制重建 v-viewer（否则新加载的图片不会绑定到 viewer）
      viewerKey: 0,
      isDrawerShow: false,
      nameType: '1',
      uploadList: [],
      isCDN: true,
      isCustomPath: false,
      customPath: '', // 自定义目录（如 oldFolder/newFolder 或 /oldFolder/newFolder/）
      cdnBaseUrl: localStorage.getItem('cdnBaseUrl') || 'jsd.onmicrosoft.cn',
      newCdnBaseUrl: '',
      selectedPaths: [],
      draggingPaths: [],
      dropTarget: null,
      isMoveShow: false,
      moveTarget: '__root__',
      dirOptions: [],
      dirLoading: false,
      moving: false,
      uploadPending: 0,
      uploadRefreshTimer: null
    }
  },
  computed: {
    // 当前目录路径分段（不含根节点空值）
    pathSegs() {
      return (this.activePath || []).filter(p => typeof p === 'string' && p !== '')
    },
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
    },
    allSelected() {
      return this.fileList.length > 0 && this.selectedPaths.length === this.fileList.length
    },
    someSelected() {
      return this.selectedPaths.length > 0 && !this.allSelected
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
    // 获取用户仓库，并恢复上次选择的仓库与目录，随后自动加载内容
    getRepos() {
      getUserRepos(this.userInfo.login).then(res => {
        this.reposList = res || []
        if (!this.reposList.length) return
        const savedRepo = localStorage.getItem('phRepo')
        this.activeRepos =
          savedRepo && this.reposList.some(r => r.name === savedRepo) ? savedRepo : this.reposList[0].name
        this.restoreSelection()
        this.search()
      })
    },
    changeRepos() {
      this.activePath = [''] // 默认选中根目录
      this.persistSelection()
      this.search()
    },
    // 当前选中目录（过滤根目录的空值标记）
    currentDirPath() {
      return this.pathSegs.join('/')
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
    restoreSelection() {
      let saved = []
      try {
        saved = JSON.parse(localStorage.getItem('phPath') || '[]')
      } catch (e) {
        saved = []
      }
      const segs = (Array.isArray(saved) ? saved : []).filter(s => typeof s === 'string' && s !== '')
      this.activePath = ['', ...segs]
      this.persistSelection()
    },
    search() {
      if (!this.activeRepos) return
      this.loading = true
      this.fileList = []
      this.dirList = []
      this.clearSelection()
      const path = this.currentDirPath()
      getReposContents(this.userInfo.login, this.activeRepos, path).then(res => {
        const files = []
        const dirs = []
        res.forEach(item => {
          if (item.type === 'dir') dirs.push(item)
          else if (item.type === 'file' && isImgExt(item.name)) files.push(item)
        })
        this.dirList = dirs.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        this.fileList = this.sortByUploadTime(files)
        this.viewerKey++
      }).catch(() => {
        if (path) {
          this.msgError('该目录已不存在，已返回根目录')
          this.goToDir([])
        } else {
          this.msgError('目录加载失败，请稍后重试')
        }
      }).finally(() => {
        this.loading = false
      })
    },
    // 跳转到指定目录（[] 表示根目录），路径变化后自动刷新
    goToDir(segs) {
      if (!this.activeRepos) return
      const target = segs.join('/')
      if (target === this.currentDirPath()) return
      this.activePath = ['', ...segs]
      this.persistSelection()
      this.search()
    },
    // 单击文件夹进入该目录
    enterDir(dir) {
      this.goToDir([...this.pathSegs, dir.name])
    },
    // ===== 上传时间排序（记录在本机 localStorage，不上传任何服务器）=====
    uploadTimeKey(path) {
      return `${this.userInfo.login}/${this.activeRepos}/${path}`
    },
    readUploadTimes() {
      try {
        return JSON.parse(localStorage.getItem('phUploadTimes') || '{}')
      } catch (e) {
        return {}
      }
    },
    recordUploadTime(path) {
      const map = this.readUploadTimes()
      map[this.uploadTimeKey(path)] = Date.now()
      const keys = Object.keys(map)
      if (keys.length > 3000) {
        keys
          .sort((a, b) => map[a] - map[b])
          .slice(0, keys.length - 3000)
          .forEach(k => delete map[k])
      }
      localStorage.setItem('phUploadTimes', JSON.stringify(map))
    },
    sortByUploadTime(files) {
      const map = this.readUploadTimes()
      return files
        .map((file, index) => ({ file, time: map[this.uploadTimeKey(file.path)] || 0, index }))
        .sort((a, b) => b.time - a.time || a.index - b.index)
        .map(item => item.file)
    },
    // ===== 选择 / 移动 =====
    toggleSelect(file) {
      const index = this.selectedPaths.indexOf(file.path)
      if (index >= 0) this.selectedPaths.splice(index, 1)
      else this.selectedPaths.push(file.path)
    },
    toggleSelectAll(value) {
      this.selectedPaths = value ? this.fileList.map(file => file.path) : []
    },
    clearSelection() {
      this.selectedPaths = []
    },
    // ===== 拖拽移动（把图片拖到文件夹或面包屑目录上）=====
    onDragStart(event, file) {
      const paths = this.selectedPaths.includes(file.path) ? [...this.selectedPaths] : [file.path]
      this.draggingPaths = paths
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', paths.join('\n'))
    },
    onDragEnd() {
      this.draggingPaths = []
      this.dropTarget = null
    },
    onRootDragOver(event) {
      if (this.draggingPaths.length) event.preventDefault()
    },
    onDirDragOver(event, targetDir) {
      if (!this.draggingPaths.length || targetDir === this.currentDirPath()) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (this.dropTarget !== targetDir) this.dropTarget = targetDir
    },
    onDirDragLeave(event, targetDir) {
      if (this.dropTarget !== targetDir) return
      const to = event.relatedTarget
      if (to && event.currentTarget.contains(to)) return
      this.dropTarget = null
    },
    onDropTo(targetDir) {
      const paths = this.draggingPaths
      this.draggingPaths = []
      this.dropTarget = null
      if (!paths.length || targetDir === this.currentDirPath()) return
      this.movePathsTo(paths, targetDir)
    },
    // 单张图片直接移动到其它目录
    moveOne(file) {
      this.selectedPaths = [file.path]
      this.openMoveDialog()
    },
    openMoveDialog() {
      if (!this.selectedPaths.length || !this.activeRepos) return
      this.moveTarget = '__root__'
      this.dirOptions = []
      this.isMoveShow = true
      this.loadDirOptions()
    },
    async loadDirOptions() {
      this.dirLoading = true
      try {
        const repoInfo = await getRepo(this.userInfo.login, this.activeRepos)
        const ref = await getRef(this.userInfo.login, this.activeRepos, repoInfo.default_branch)
        const commitInfo = await getCommit(this.userInfo.login, this.activeRepos, ref.object.sha)
        const tree = await getTree(this.userInfo.login, this.activeRepos, commitInfo.tree.sha)
        this.dirOptions = (tree.tree || []).filter(item => item.type === 'tree').map(item => item.path)
      } catch (e) {
        console.error(e)
        this.msgError('目录列表加载失败')
      } finally {
        this.dirLoading = false
      }
    },
    async confirmMove() {
      const targetDir = this.moveTarget === '__root__' ? '' : String(this.moveTarget || '')
      if (await this.movePathsTo(this.selectedPaths, targetDir)) this.isMoveShow = false
    },
    // 把指定图片移动到目标目录（弹窗与拖拽共用）
    async movePathsTo(paths, targetDir) {
      if (!this.activeRepos || !paths.length) return false
      const files = this.fileList.filter(f => paths.includes(f.path))
      const moves = files.filter(f => f.path !== (targetDir ? `${targetDir}/${f.name}` : f.name))
      if (!moves.length) {
        this.msgError('所选图片已经在该目录中')
        return false
      }
      this.moving = true
      try {
        const targetList = await getReposContents(this.userInfo.login, this.activeRepos, targetDir)
        const existNames = new Set((targetList || []).map(item => item.name))
        const conflicts = moves.filter(f => existNames.has(f.name))
        if (conflicts.length) {
          this.msgError(`目标目录已存在同名文件：${conflicts.map(f => f.name).join('、')}`)
          return false
        }
        const repoInfo = await getRepo(this.userInfo.login, this.activeRepos)
        const branch = repoInfo.default_branch
        const ref = await getRef(this.userInfo.login, this.activeRepos, branch)
        const headSha = ref.object.sha
        const commitInfo = await getCommit(this.userInfo.login, this.activeRepos, headSha)
        const treeEntries = []
        moves.forEach(f => {
          treeEntries.push({
            path: targetDir ? `${targetDir}/${f.name}` : f.name,
            mode: '100644',
            type: 'blob',
            sha: f.sha
          })
          treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: null })
        })
        const tree = await createTree(this.userInfo.login, this.activeRepos, {
          base_tree: commitInfo.tree.sha,
          tree: treeEntries
        })
        const commit = await createCommit(this.userInfo.login, this.activeRepos, {
          message: `Move ${moves.length} file(s) via YihePicBed`,
          tree: tree.sha,
          parents: [headSha]
        })
        await updateRef(this.userInfo.login, this.activeRepos, branch, { sha: commit.sha })
        this.msgSuccess(`已移动 ${moves.length} 张图片`)
        this.clearSelection()
        // GitHub 内容接口有短暂缓存，稍等再刷新
        setTimeout(() => this.search(), 600)
        return true
      } catch (e) {
        console.error(e)
        this.msgError('移动失败，请确认 Token 具有写入权限')
        return false
      } finally {
        this.moving = false
      }
    },
    // ===== 新建目录（Windows 规则：在当前目录中创建文件夹）=====
    createDirectory() {
      if (!this.activeRepos) return
      const base = this.currentDirPath()
      const names = new Set([...this.dirList.map(d => d.name), ...this.fileList.map(f => f.name)])
      let defaultName = '新建文件夹'
      for (let i = 2; names.has(defaultName); i++) defaultName = `新建文件夹 (${i})`
      ElMessageBox.prompt(`在${base ? `「${base}」` : '根目录'}中新建文件夹`, '新建目录', {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputValue: defaultName,
        inputPlaceholder: '文件夹名称',
        inputValidator(value) {
          const name = (value || '').trim()
          if (!name) return '文件夹名称不能为空'
          if (name === '.' || name === '..') return '文件夹名称不合法'
          if (/[\\/:*?"<>|]/.test(name)) return '文件夹名称不能包含 \\ / : * ? " < > |'
          if (/[. ]$/.test(name)) return '文件夹名称不能以空格或点结尾'
          if (names.has(name)) return '当前目录已存在同名文件或文件夹'
          return true
        }
      })
        .then(async ({ value }) => {
          const name = value.trim()
          const dir = base ? `${base}/${name}` : name
          try {
            await upload(this.userInfo.login, this.activeRepos, dir, '.gitkeep', {
              message: `Create folder ${dir} via YihePicBed`,
              content: 'Cg==' // 单个换行，留空文件无法提交
            })
            this.msgSuccess(`已创建文件夹：${name}`)
            // GitHub 内容接口有短暂缓存，稍等再刷新列表
            setTimeout(() => this.search(), 600)
          } catch (e) {
            console.error(e)
            this.msgError('创建失败：当前目录可能已存在同名文件或文件夹')
          }
        })
        .catch(() => {})
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
      this.uploadPending++
      const reader = new FileReader()
      reader.onerror = () => this.afterUpload()
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
        this.recordUploadTime(path ? `${path}/${fileName}` : fileName)
        this.msgSuccess('上传成功')
        data.onSuccess()
      }).catch(err => {
        data.onError && data.onError(err)
      }).finally(() => {
        this.afterUpload()
      })
    },
    // 全部上传完成后自动刷新一次当前目录
    afterUpload() {
      this.uploadPending = Math.max(0, this.uploadPending - 1)
      if (this.uploadPending > 0) return
      clearTimeout(this.uploadRefreshTimer)
      this.uploadRefreshTimer = setTimeout(() => this.search(), 700)
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

.crumb-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 12px;
  min-height: 28px;
  font-size: 14px;

  .crumb-leaf {
    margin-right: 4px;
    color: var(--brand);
  }

  .crumb {
    padding: 2px 8px;
    border-radius: 8px;
    color: var(--text-2);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background: var(--bg-hover);
      color: var(--brand-strong);
    }

    &.current {
      color: var(--text-1);
      font-weight: 600;
      cursor: default;

      &:hover {
        background: transparent;
        color: var(--text-1);
      }
    }

    &.drop-active {
      background: color-mix(in srgb, var(--brand) 20%, transparent);
      color: var(--brand-strong);
      box-shadow: inset 0 0 0 1px var(--brand);
    }
  }

  .crumb-sep {
    font-size: 12px;
    color: var(--text-3);
  }

  .crumb-new {
    margin-left: auto;
  }
}

.select-bar {
  position: sticky;
  top: 8px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--line));
  border-radius: 14px;
  background: color-mix(in srgb, var(--brand) 8%, var(--bg-elevated));
  color: var(--text-2);
  font-size: 13px;

  .count {
    margin-right: auto;
  }

  :deep(.el-checkbox) {
    margin-right: 0;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.select-box {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: inline-flex;
  padding: 2px 5px;
  border-radius: 9px;
  background: rgba(8, 15, 26, 0.55);
  opacity: 0;
  transition: opacity 0.2s ease;

  :deep(.el-checkbox) {
    height: auto;
    margin-right: 0;
  }

  :deep(.el-checkbox__inner) {
    border-color: rgba(255, 255, 255, 0.75);
    background: transparent;
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    border-color: var(--brand);
    background: var(--brand);
  }
}

.image-container:hover .select-box,
.image-container.selected .select-box {
  opacity: 1;
}

.image-container.selected {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand);
}

@media (hover: none) {
  .select-box {
    opacity: 1;
  }
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

.folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 190px;
  height: 190px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg-elevated);
  color: var(--text-2);
  cursor: pointer;
  user-select: none;
  content-visibility: auto;
  contain-intrinsic-size: 190px 190px;

  .folder-icon {
    color: var(--brand);
  }

  .folder-name {
    max-width: 160px;
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--line));
    background: color-mix(in srgb, var(--brand) 7%, var(--bg-elevated));
    color: var(--text-1);
  }

  &.drop-active {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand) 18%, var(--bg-elevated));
    color: var(--brand-strong);
  }
}

.image-container {
  position: relative;
  width: 190px;
  height: 190px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--bg-elevated);
  transition: border-color 0.25s ease;
  content-visibility: auto;
  contain-intrinsic-size: 190px 190px;

  &:hover {
    border-color: color-mix(in srgb, var(--brand) 45%, transparent);
  }

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
    padding: 8px 10px 14px;
    font-size: 12px;
    color: #fff;
    background: linear-gradient(0deg, transparent, rgba(2, 6, 23, 0.72));
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
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: auto; // 按钮区域允许点击
  }
}

.op-btn {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 15, 26, 0.55);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  .el-icon {
    font-size: 16px;
  }

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  &:hover {
    border-color: transparent;
    background: linear-gradient(135deg, var(--brand), var(--brand-2));
    color: var(--brand-ink);
    transform: scale(1.12);
  }

  &.danger:hover {
    background: var(--el-color-danger);
    color: #fff;
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
