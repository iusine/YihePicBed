<template>
  <div class="app-wrapper">
    <aside class="app-sidebar">
      <div class="sidebar-glow" aria-hidden="true"></div>
      <div class="sidebar-logo" @click="$router.push('/manage')">
        <img :src="settings.logo" alt="logo">
        <div class="logo-meta">
          <span class="logo-text">{{ settings.brand }}</span>
          <span class="logo-sub">{{ settings.subtitle }}</span>
        </div>
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
  align-items: flex-start;
  gap: 16px;
  min-height: 100vh;
  padding: 16px;
}

.app-sidebar {
  position: sticky;
  top: 16px;
  align-self: flex-start;
  height: calc(100vh - 32px);
  width: 232px;
  flex: 0 0 232px;
  display: flex;
  flex-direction: column;
  padding: 18px 14px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: var(--shadow-card);
  user-select: none;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sidebar-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(420px 240px at 50% -10%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 70%);
}

.sidebar-logo {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 6px 18px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;

  img {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 14px;
    object-fit: cover;
  }

  .logo-meta {
    min-width: 0;
  }

  .logo-text {
    display: block;
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .logo-sub {
    display: block;
    margin-top: 3px;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--text-3);
  }
}

.sidebar-nav {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-title {
  padding: 16px 10px 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--text-3);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--text-2);
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  .nav-icon {
    flex: 0 0 auto;
    transition: color 0.2s ease, filter 0.2s ease;
  }

  &:hover {
    background: var(--bg-hover);
    border-color: var(--line);
    color: var(--text-1);
  }

  &.active {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--brand) 22%, transparent),
      color-mix(in srgb, var(--brand) 6%, transparent)
    );
    border-color: color-mix(in srgb, var(--brand) 45%, transparent);
    color: var(--brand-strong);
    font-weight: 600;

    .nav-icon {
      color: var(--brand);
    }
  }
}

.sidebar-footer {
  position: relative;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);

  .theme-title {
    margin-bottom: 8px;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--text-3);
  }

  .theme-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .theme-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--bg-elevated);
    color: var(--text-3);
    font-family: inherit;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
      transform 0.2s ease;

    .theme-text {
      font-size: 11px;
    }

    &:hover {
      color: var(--brand-strong);
      border-color: color-mix(in srgb, var(--brand) 45%, transparent);
      transform: translateY(-1px);
    }

    &.active {
      background: linear-gradient(135deg, var(--brand), var(--brand-2));
      border-color: transparent;
      color: var(--brand-ink);
      box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--brand) 80%, transparent);
    }
  }
}

.app-main {
  flex: 1;
  min-width: 0;
  padding: 8px 4px 28px 0;
  background: transparent;
  overflow-x: hidden;
}

@media (max-width: 860px) {
  .app-wrapper {
    gap: 10px;
    padding: 10px;
  }

  .app-sidebar {
    top: 10px;
    height: calc(100vh - 20px);
    width: 68px;
    flex-basis: 68px;
    padding: 14px 8px;
    border-radius: 22px;
  }

  .sidebar-logo {
    justify-content: center;
    padding: 2px 0 16px;

    img {
      width: 38px;
      height: 38px;
      flex-basis: 38px;
      border-radius: 12px;
    }
  }

  .logo-meta,
  .nav-text,
  .nav-group-title,
  .theme-text,
  .theme-title {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 11px 0;
  }

  .theme-row {
    grid-template-columns: 1fr;
  }

  .theme-btn {
    padding: 8px 0;
  }

  .app-main {
    padding: 4px 0 20px;
  }
}
</style>
