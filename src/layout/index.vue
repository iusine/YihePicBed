<template>
  <div class="app-wrapper">
    <aside class="app-sidebar">
      <div class="sidebar-logo" @click="$router.push('/manage')">
        <img :src="settings.logo" alt="logo"  >
        <span class="logo-text">{{ settings.title }}</span>
      </div>

      <nav class="sidebar-nav">
        <template v-for="group in navGroups" :key="group.title">
          <div v-if="group.title" class="nav-group-title">{{ group.title }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <el-icon class="nav-icon" :size="18"><component :is="item.icon" /></el-icon>
            <span class="nav-text">{{ item.title }}</span>
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="theme-title">主题</div>
        <div class="theme-row">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            class="theme-btn"
            :class="{ active: theme === opt.value }"
            :title="opt.label"
            @click="changeTheme(opt.value)"
          >
            <el-icon :size="15"><component :is="opt.icon" /></el-icon>
            <span class="theme-text">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </aside>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
import { Setting, FolderOpened, Reading, Download, Memo, Brush, Sunny, Moon, Monitor } from '@element-plus/icons-vue'
import defaultSettings from '@/settings'
import { getTheme, setTheme } from '@/utils/theme'

export default {
  name: 'Layout',
  data() {
    return {
      settings: defaultSettings,
      theme: getTheme(),
      themeOptions: [
        { value: 'light', label: '浅色', icon: Sunny },
        { value: 'dark', label: '深色', icon: Moon },
        { value: 'system', label: '自动', icon: Monitor }
      ],
      navGroups: [
        {
          title: '',
          items: [
            { path: '/setting', title: '图床配置', icon: Setting },
            { path: '/manage', title: '图床管理', icon: FolderOpened },
            { path: '/help', title: '使用帮助', icon: Reading }
          ]
        },
        {
          title: '工具箱',
          items: [
            { path: '/toolbox/compress', title: '图片压缩', icon: Download },
            { path: '/toolbox/base64', title: '图片转 Base64', icon: Memo },
            { path: '/toolbox/watermark', title: '图片水印', icon: Brush }
          ]
        }
      ]
    }
  },
  methods: {
    isActive(path) {
      return this.$route.path === path
    },
    changeTheme(value) {
      this.theme = value
      setTheme(value)
    }
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
}

.app-sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  width: 224px;
  flex: 0 0 224px;
  display: flex;
  flex-direction: column;
  padding: 12px 10px 16px;
  background: var(--bg-panel);
  border-right: 1px solid var(--line);
  user-select: none;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: px;
  padding: 4px 1px 5px;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .logo-text {
    font-size: 19px;
    font-weight: 600;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-title {
  padding: 14px 10px 6px;
  font-size: 12px;
  color: var(--text-3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  margin: 1px 0;
  border-radius: 8px;
  color: var(--text-2);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-1);
  }

  &.active {
    background: var(--bg-active);
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.sidebar-footer {
  margin-top: 12px;
  padding: 10px;
  border-top: 1px solid var(--line);

  .theme-title {
    font-size: 12px;
    color: var(--text-3);
    margin-bottom: 8px;
  }

  .theme-row {
    display: flex;
    gap: 6px;
  }

  .theme-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 4px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    transition: all 0.2s ease;

    .theme-text {
      font-size: 11px;
    }

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }

    &.active {
      color: #fff;
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
}

.app-main {
  flex: 1;
  min-width: 0;
  padding: 24px;
  background: var(--bg-page);
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 64px;
    flex-basis: 64px;
    padding: 10px 6px;
  }

  .logo-text,
  .nav-text,
  .nav-group-title,
  .theme-text,
  .theme-title {
    display: none;
  }

  .nav-item,
  .sidebar-logo {
    justify-content: center;
  }
}
</style>
