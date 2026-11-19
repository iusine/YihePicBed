<template>
  <div class="setting-page">
    <div class="page-head">
      <div class="page-title">图床配置</div>
      <div class="page-desc">配置 GitHub Token 与 CDN 站源，保存后即可在图床管理中上传图片、生成链接。</div>
    </div>

    <div class="panel panel-pad block">
      <div class="section-title">
        <el-icon><User /></el-icon>
        GitHub 授权
      </div>
      <div class="gap-row">
        <el-input
          v-model="token"
          type="password"
          show-password
          placeholder="请输入 GitHub Token（需 public_repo 权限）"
          :clearable="true"
          style="width: 440px; max-width: 100%"
          @keyup.enter="searchUser"
        >
          <template #append>
            <el-button :icon="Search" @click="searchUser">查询</el-button>
          </template>
        </el-input>
      </div>

      <div class="gap-row user-row">
        <el-avatar :size="44" :src="userInfo.avatar_url">{{ (userInfo.login || '?').slice(0, 1) }}</el-avatar>
        <div>
          <div class="user-login">{{ userInfo.login || '未配置' }}</div>
          <div class="muted">Token 仅保存在本机浏览器（localStorage），只随请求发往 api.github.com，不会上传到任何第三方服务器</div>
        </div>
      </div>

      <div class="gap-row">
        <el-button type="primary" :icon="Check" :disabled="isSave" @click="saveUser(true)">保存配置</el-button>
        <el-button type="info" :icon="Close" @click="saveUser(false)">清除配置</el-button>
      </div>
    </div>

    <div class="panel panel-pad block">
      <div class="section-title">
        <el-icon><Link /></el-icon>
        CDN 站源
      </div>
      <div class="muted desc">
        上传成功后会使用下方站源拼接图片直链：<code>https://{{ cdnBaseUrl }}/gh/用户名/仓库/路径</code>，jsDelivr 各加速节点可随时切换。
      </div>
      <div class="gap-row">
        <el-input v-model="newCdnBaseUrl" placeholder="输入新的 CDN 站源（如 jsd.onmicrosoft.cn）" style="width: 440px; max-width: 100%">
          <template #prepend>https://</template>
        </el-input>
        <el-button type="primary" :icon="Check" @click="saveCdn">保存为默认站源</el-button>
      </div>
      <el-alert
        class="cdn-alert"
        title="默认站源：jsd.onmicrosoft.cn；推荐可用站源：testingcf.jsdelivr.net、gcore.jsdelivr.net、quantil.jsdelivr.net、fastly.jsdelivr.net、jsd.cdn.zzko.cn、jsdelivr.b-cdn.net；如访问失败可随时换一个节点。"
        type="success"
        :closable="false"
      />
    </div>
  </div>
</template>

<script>
import { Search, Check, Close, User, Link } from '@element-plus/icons-vue'
import { getUserInfo } from '@/api/github'

export default {
  name: 'Setting',
  components: { Search, Check, Close, User, Link },
  data() {
    return {
      token: '',
      userInfo: { login: '' },
      isSave: true,
      cdnBaseUrl: localStorage.getItem('cdnBaseUrl') || 'jsd.onmicrosoft.cn',
      newCdnBaseUrl: ''
    }
  },
  created() {
    this.token = localStorage.getItem('githubToken') || ''
    const userInfo = localStorage.getItem('githubUserInfo')
    if (this.token && userInfo) {
      this.userInfo = JSON.parse(userInfo)
      this.isSave = false
    }
    this.newCdnBaseUrl = this.cdnBaseUrl
  },
  methods: {
    // 获取用户信息
    searchUser() {
      if (!this.token) {
        this.msgError('请先输入 Token')
        return
      }
      getUserInfo(this.token).then(res => {
        this.userInfo = res
        this.isSave = false
      })
    },
    saveUser(save) {
      if (save) {
        localStorage.setItem('githubToken', this.token)
        localStorage.setItem('githubUserInfo', JSON.stringify(this.userInfo))
        this.msgSuccess('保存成功')
      } else {
        localStorage.removeItem('githubToken')
        localStorage.removeItem('githubUserInfo')
        this.token = ''
        this.userInfo = { login: '' }
        this.isSave = true
        this.msgSuccess('清除成功')
      }
    },
    saveCdn() {
      const value = (this.newCdnBaseUrl || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
      if (!value) {
        this.msgError('请输入 CDN 站源')
        return
      }
      this.cdnBaseUrl = value
      this.newCdnBaseUrl = value
      localStorage.setItem('cdnBaseUrl', value)
      this.msgSuccess('CDN 站源已保存')
    }
  }
}
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 14px;
}

.desc {
  margin-bottom: 12px;

  code {
    background: var(--bg-hover);
    padding: 1px 6px;
    border-radius: 4px;
  }
}

.user-row {
  margin: 16px 0;

  .user-login {
    font-size: 15px;
    font-weight: 600;
  }
}

.cdn-alert {
  margin-top: 14px;
}
</style>
