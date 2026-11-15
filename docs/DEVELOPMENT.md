# PictureBed 网站开发文档

> GitHub 图床管理工具（纯前端 Web 应用）
>
> 本文档面向**开发者 / 维护者**，系统性地描述项目的技术选型、架构设计、模块实现、工程配置与扩展方法。
> 普通使用流程请参阅《用户操作手册》：`docs/USER-MANUAL.md`。

| 项目信息 | 内容 |
| --- | --- |
| 项目名称 | PictureBed（页面标题：图床工具） |
| 项目版本 | v0.2.0 |
| 项目形态 | 纯前端单页应用（SPA），**无后端服务** |
| 主要用途 | 以 GitHub 仓库作为图床存储图片，通过 jsDelivr CDN 加速访问图片直链 |
| 文档适用范围 | 二次开发、代码维护、部署运维 |
| 编写日期 | 2026 年 2 月 |

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与环境要求](#2-技术栈与环境要求)
3. [开发环境快速开始](#3-开发环境快速开始)
4. [项目目录结构](#4-项目目录结构)
5. [总体架构与数据流](#5-总体架构与数据流)
6. [应用装配与全局基础设施](#6-应用装配与全局基础设施)
7. [网络请求与 GitHub API 层](#7-网络请求与-github-api-层)
8. [布局与导航系统](#8-布局与导航系统)
9. [页面模块详解](#9-页面模块详解)
10. [公共组件](#10-公共组件)
11. [工具函数库](#11-工具函数库)
12. [样式体系与主题](#12-样式体系与主题)
13. [构建与工程配置](#13-构建与工程配置)
14. [部署与发布](#14-部署与发布)
15. [二次开发与扩展指南](#15-二次开发与扩展指南)
16. [已知限制与遗留事项](#16-已知限制与遗留事项)
17. [版本记录](#17-版本记录)

---

## 1. 项目概述

### 1.1 项目简介

PictureBed 是一个**浏览器端图片托管管理工具**：

- 基于 [GitHub REST API](https://docs.github.com/cn/rest) 与用户的 GitHub 仓库交互，把仓库当作图片存储空间（图床）；
- 图片访问链接由 **jsDelivr CDN**（`https://{站源}/gh/{用户名}/{仓库}/{路径}`）加速分发，解决 GitHub 原始地址访问慢 / 不稳定问题；
- 内置三个**纯本地处理**的工具箱功能：图片压缩、图片转 Base64、图片加水印；
- 无后端、无数据库，所有配置（GitHub Token、用户信息、CDN 站源等）只保存在浏览器 `localStorage` 中。

界面风格参考 [PicX](https://upload.kasuie.cc/#/upload)（KASUIE 图床）并做了简洁化重构，灵感来自 [imgurl](https://github.com/WishMelz/imgurl)。代码许可为 MIT（见 `LICENSE`）。

### 1.2 功能清单

| 功能 | 说明 | 是否需要 GitHub Token |
| --- | --- | --- |
| 图床配置 | 配置 GitHub Token、查询并展示用户信息、保存/清除配置、设置默认 CDN 站源 | 是（仅查询用户） |
| 图床管理 | 选择仓库与目录、浏览图片、上传、复制 CDN / Markdown 链接、删除图片 | 是 |
| 使用帮助 | 内置三步图文教程（建仓库 → 生成 Token → 使用） | 否 |
| 图片压缩 | 离线压缩为 WebP / JPEG / PNG，支持质量调节、批量下载 | 否 |
| 图片转 Base64 | 批量将图片转为 Base64，可复制或下载为 `.txt` | 否 |
| 图片水印 | 文字水印（大小 / 颜色 / 透明度 / 位置），画布实时预览，导出 PNG / JPEG | 否 |
| 主题切换 | 侧边栏底部浅色 / 深色 / 跟随系统 | 否 |

### 1.3 工作原理

```text
┌─────────────────────────────── 浏览器（纯前端 SPA） ───────────────────────────────┐
│                                                                                    │
│   图床配置 / 图床管理                                                                 │
│        │  ① axios 请求（自动携带 Authorization: token）                               │
│        ▼                                                                             │
│   GitHub REST API  https://api.github.com                                            │
│   （/user、/users/{name}/repos、/repos/{owner}/{repo}/contents/...）                  │
│                                                                                      │
│   图片访问（浏览器 / 博客 / Markdown 直接引用）：                                       │
│   https://{CDN站源}/gh/{用户名}/{仓库}/{路径}  ──►  jsDelivr CDN  ──►  GitHub 文件       │
│   或 GitHub 源站直链（接口返回的 download_url）                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- **上传链路**：前端把图片文件读为 Base64（去掉 `data:image/...;base64,` 前缀）→ `PUT /repos/{owner}/{repo}/contents/{path}`，GitHub 仓库内新增一个文件（一个 commit）。
- **删除链路**：携带该文件的 `sha` 调用 `DELETE /repos/{owner}/{repo}/contents/{path}` 完成删除（GitHub 要求提供 sha 以确认版本）。
- **数据存储**：Token 与配置全部存于浏览器 `localStorage`，换浏览器 / 清缓存即失效，刷新页面不丢失。

### 1.4 设计约定

- 纯前端 **Options API**（Vue 3 风格）编写，未引入 Pinia/Vuex 与 TypeScript，组件内维护状态 + `localStorage` 持久化；
- 页面级样式使用 `scoped` SCSS，颜色、圆角、阴影一律取自 `index.scss` 中的 CSS 变量（支持暗色主题）；
- 全局轻提示统一走 `this.msgSuccess() / this.msgError()`（见 6.2）；
- 图片处理类功能强调“**不上传服务器、本地处理**”，符合隐私预期。

---

## 2. 技术栈与环境要求

### 2.1 技术栈

| 类别 | 技术 | 版本 | 用途 |
| --- | --- | --- | --- |
| 框架 | Vue 3（Options API） | ^3.5.13 | 视图层 |
| 构建工具 | Vite | ^8.0.0 | 开发服务器 / 打包（`@vitejs/plugin-vue` ^6.0.8） |
| 路由 | vue-router | ^4.5.0 | 前端路由（**Hash 模式**） |
| UI 组件库 | Element Plus | ^2.9.0 | 表单、抽屉、上传、级联选择器、消息提示等 |
| 图标 | @element-plus/icons-vue | ^2.3.1 | Element 风格图标（含侧边栏导航图标） |
| HTTP | axios | ^1.7.0 | 请求 GitHub REST API |
| 图片查看 | v-viewer + viewerjs | ^3.0.0 / ^1.11.0 | 图片点击放大预览（旋转 / 缩放 / 翻页） |
| 样式 | sass | ^1.77.8 | SCSS 编译（`modern-compiler` API） |
| CSS 重置 | normalize.css | ^8.0.1 | 统一浏览器默认样式 |
| 进度条 | nprogress | ^0.2.0 | 顶部请求进度条 |
| 其他 | path-to-regexp | ^6.3.0 | 依赖中存在但**当前未被引用**（历史遗留，见 16 节） |

### 2.2 环境要求

| 项 | 要求 |
| --- | --- |
| Node.js | `>= 20.19.0`（`package.json` engines 声明；已在 Node 24 上验证） |
| 包管理器 | npm（项目提供 `package-lock.json`） |
| 浏览器 | 支持 ES2020+ 的现代浏览器；工具箱依赖 `FileReader`、`Canvas`、`URL.createObjectURL`、WebP 编码、`navigator.clipboard` |

### 2.3 脚本命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` / `npm run serve` | 启动开发服务器（别名），默认端口 **9001**，自动打开浏览器 |
| `npm run build` | 生产构建，产物输出到 `dist/`（静态资源在 `dist/static/`） |
| `npm run preview` | 本地预览生产构建产物 |

---

## 3. 开发环境快速开始

```bash
# 1. 安装依赖（Node >= 20.19）
npm install

# 2. 启动开发服务器（默认 http://localhost:9001，自动打开浏览器）
npm run dev

# 3. 生产构建
npm run build

# 4. 本地预览构建产物
npm run preview
```

> **提示**：如不希望启动时自动打开浏览器（例如 CI、无头环境），设置环境变量 `DSH_NO_OPEN=1` 后启动：
>
> ```powershell
> # PowerShell
> $env:DSH_NO_OPEN = 1; npm run dev
> ```

开发服务器配置见 `vite.config.js` 的 `server` 字段（固定端口 9001，`overlay` 只对编译错误弹出全屏遮罩）。

---

## 4. 项目目录结构

```text
PictureBed/
├── index.html                    # HTML 入口：标题、外链 favicon、主题防闪脚本
├── package.json                  # 依赖与脚本（engines: node >= 20.19）
├── package-lock.json
├── vite.config.js                # Vite 配置 + 自定义 SVG 雪碧图插件
├── .gitignore                    # 忽略 node_modules / dist / .env.local 等
├── LICENSE                       # MIT 许可（Copyright (c) 2021 Naccl）
├── README.md                     # 项目说明与快速开始
├── public/                       # 静态资源原样拷贝
│   ├── favicon.ico               # 本地图标（index.html 实际使用外链 ico，见 16 节）
│   └── 905.png                   # 疑似遗留文件，代码中未被引用
├── docs/
│   ├── DEVELOPMENT.md            # 本文档（网站开发文档）
│   └── USER-MANUAL.md            # 用户操作手册
└── src/
    ├── main.js                   # 应用入口：注册插件/组件/指令、初始化主题、挂载
    ├── App.vue                   # 根组件（仅 router-view）
    ├── settings.js               # 站点级配置（标题 / logo / 头部固定等）
    ├── api/
    │   └── github.js             # GitHub REST API 封装（与 axios 实例解耦）
    ├── assets/
    │   ├── 404_images/           # 404 页素材（404.png + 云朵动画素材）
    │   └── help_images/          # “使用帮助”页步骤截图
    ├── components/
    │   ├── DropZone/…            # 拖拽/粘贴/点击选择图片的上传区组件
    │   │   └── DropZone.vue
    │   └── SvgIcon/
    │       └── index.vue         # SVG 图标组件（雪碧图 <use> 或外链 mask）
    ├── icons/
    │   ├── index.js              # 注册 svg-icon 全局组件（并引入雪碧图副作用）
    │   └── svg/                  # 图标源文件 → 由 Vite 插件打成 <symbol> 雪碧图
    │       ├── dashboard.svg     # （当前未被页面引用）
    │       ├── link.svg          # （当前未被页面引用）
    │       └── markdown.svg      # 图床管理页“复制 Markdown”按钮图标
    ├── layout/
    │   └── index.vue             # 整体布局：左侧固定导航 + 右侧内容区（router-view）
    ├── router/
    │   └── index.js              # 路由表（Hash 模式）+ 标题守卫
    ├── styles/
    │   └── index.scss            # 全局样式：主题 CSS 变量 / 通用类 / 拖放区 / 滚动条
    ├── utils/
    │   ├── request.js            # axios 实例 + 请求/响应拦截器（进度条、Token、缓存规避）
    │   ├── theme.js              # 主题存取与切换（localStorage: ph-theme）
    │   ├── directive.js          # v-debounce / v-throttle 自定义指令
    │   ├── get-page-title.js     # 页面标题拼接
    │   ├── image.js              # 图片工具：DataURL/加载/压缩/下载/粘贴监听/格式化
    │   ├── copy.js               # 复制到剪贴板（Clipboard API + 降级）
    │   ├── task-queue.js         # 时间间隔任务队列（上传串行化）
    │   ├── uuid.js               # UUID v4 生成（上传命名）
    │   ├── validate.js           # 外链判断、图片扩展名白名单
    │   └── index.js              # parseTime / formatTime / param2Obj
    └── views/
        ├── 404.vue               # 404 页（独立于 Layout）
        ├── Setting.vue           # 图床配置页（#/setting）
        ├── Manage.vue            # 图床管理页（#/manage，核心页面）
        ├── Help.vue              # 使用帮助页（#/help）
        └── toolbox/
            ├── Compress.vue      # 工具箱 · 图片压缩（#/toolbox/compress）
            ├── Base64.vue        # 工具箱 · 图片转 Base64（#/toolbox/base64）
            └── Watermark.vue     # 工具箱 · 图片水印（#/toolbox/watermark）
```

---

## 5. 总体架构与数据流

### 5.1 页面与路由

应用采用 **Layout（左侧导航）包裹子页面** 的结构，路由为 **Hash 模式**（`createWebHashHistory`，兼容任意静态托管，无需服务端重写）。

| 菜单（导航） | 路由 path | 组件 | meta.title | 说明 |
| --- | --- | --- | --- | --- |
| （根路径） | `/` | Layout | — | 重定向到 `/manage` |
| 图床配置 | `/setting` | `views/Setting.vue` | 图床配置 | Token / 用户信息 / CDN 默认站源 |
| 图床管理 | `/manage` | `views/Manage.vue` | 图床管理 | 仓库目录浏览、上传、复制、删除（默认首页） |
| 使用帮助 | `/help` | `views/Help.vue` | 使用帮助 | 三步图文教程 |
| 工具箱 · 图片压缩 | `/toolbox/compress` | `views/toolbox/Compress.vue` | 图片压缩 | 本地压缩 |
| 工具箱 · 图片转 Base64 | `/toolbox/base64` | `views/toolbox/Base64.vue` | 图片转 Base64 | 本地转码 |
| 工具箱 · 图片水印 | `/toolbox/watermark` | `views/toolbox/Watermark.vue` | 图片水印 | 本地加水印 |
| 404 | `/404` | `views/404.vue` | 404 NOT FOUND | `hidden`，不在导航出现 |
| 兜底 | `/:pathMatch(.*)*` | — | — | 任意未匹配路径重定向到 `/404`（必须放在路由最后） |

> 除 404 外所有页面都是 `Layout` 的子路由，通过 `<router-view />` 渲染在右侧内容区。

### 5.2 本地存储键位（localStorage）

全站没有后端，状态记忆完全依赖 `localStorage`。下表是**全部键位**，调试 / 清除数据时可直接对照：

| 键名 | 写入方 | 读取方 | 内容说明 |
| --- | --- | --- | --- |
| `githubToken` | Setting.vue（保存配置） | request.js 拦截器；Setting / Manage created | GitHub Personal Access Token（明文） |
| `githubUserInfo` | Setting.vue（保存配置） | Setting / Manage created | GitHub `/user` 接口返回的 JSON 字符串 |
| `cdnBaseUrl` | Setting.vue（保存默认站源） | Setting / Manage | 默认 CDN 站源主机名，如 `jsd.onmicrosoft.cn` |
| `phRepo` | Manage.vue（选择记忆） | Manage.vue | 上次选择的仓库名 |
| `phPath` | Manage.vue（选择记忆） | Manage.vue | 上次选择的目录路径（JSON 数组，如 `["folder"]`） |
| `ph-theme` | theme.js（切换主题） | theme.js；index.html 内联脚本 | `light` / `dark` / `system` |
| `hintShow1` ~ `hintShow3` | Manage.vue（点击“不再提示”） | Manage.vue | 三条提示条是否已关闭 |

### 5.3 核心业务链路

1. **授权链路**：`Setting.vue` 输入 Token → 调 `getUserInfo` 验证 → 用户头像 / 昵称回显 → “保存配置”写入 `githubToken`、`githubUserInfo`。
2. **进入管理页守卫**：`Manage.vue created` 若本地无 Token / 用户信息 → 提示并在 `#/setting` 引导配置。
3. **浏览链路**：`getUserRepos` 取仓库列表 → 级联选择器懒加载目录树（只列 `dir` 类型）→ “查询”调 `getReposContents` 过滤出图片扩展名 → 网格渲染，点击图片进入 viewer 大图预览。
4. **上传链路**：抽屉选择文件 → 读为 Base64 → `taskQueue` 以 1 秒间隔逐个 `PUT` 上传（规避 GitHub 并发提交 409）→ 逐文件提示成功。
5. **链接生成**：`https://{cdnBaseUrl}/gh/{login}/{repo}/{file.path}`（jsDelivr 约定），页面内 CDN / Markdown 复制均使用该拼接地址。

---

## 6. 应用装配与全局基础设施

### 6.1 main.js 装配顺序

`src/main.js` 承担全局初始化，顺序如下：

1. 引入 CSS：`normalize.css` → Element Plus 基础样式 → **Element Plus 暗色变量**（`theme-chalk/dark/css-vars.css`）→ 全局 `index.scss` → `viewer.css`；
2. `initTheme()`：在创建应用前先根据 `ph-theme` 设置 `<html>` 的 `dark` class（配合 `index.html` 内联脚本做到“首屏无闪烁”，见 6.4）；
3. `createApp(App)` 后依次 `use(ElementPlus)`、`use(Viewer)`（v-viewer 指令）、`setupIcons(app)`（注册 `<svg-icon>`）、`setupDirectives(app)`（注册 `v-debounce` / `v-throttle`）；
4. 挂载全局方法：`app.config.globalProperties.msgSuccess / msgError`（封装 `ElMessage`）；
5. `use(router)` 并 `mount('#app')`。

### 6.2 全局消息与自定义指令

- 全局属性 `this.msgSuccess(msg)` / `this.msgError(msg)`：组件内直接调用即可弹出轻提示，组件模板中也可使用（如 Setting 页按钮）。
- `v-debounce`（防抖）：`[fn, event='click', time=300]`，单位时间只触发最后一次。
- `v-throttle`（节流）：`[fn, event='click', time=300]`，单位时间最多触发一次。**图床管理“确定上传”按钮使用 `v-throttle="[submitUpload, 'click', 3000]"` 防止重复提交。**
- 指令在元素卸载时移除监听（`unmounted` 钩子），不会造成内存泄漏。

### 6.3 页面标题与站点配置

- `router.beforeEach` 中统一 `document.title = getPageTitle(to.meta.title)`，规则为 `${pageTitle} - ${title}`。
- 站点级常量在 `src/settings.js`：

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `title` | `图床工具` | 页面标题后缀、侧边栏文字 |
| `logo` | jsDelivr 上的 PNG 地址 | 侧边栏 Logo 图片 URL |
| `fixedHeader` | `true` | 兼容性配置（当前布局为整体固定侧栏） |
| `sidebarLogo` | `true` | 是否显示侧边栏 Logo |
| `defaultOpeneds` | `['/PictureBed']` | 历史遗留，当前导航无折叠逻辑，实际未使用 |

### 6.4 主题系统

主题实现分为三层：

1. **状态层** `src/utils/theme.js`：键 `ph-theme`，取值 `light` / `dark` / `system`；`applyTheme` 通过给 `<html>` 添加 / 移除 `dark` class 生效；`system` 模式监听 `prefers-color-scheme` 媒体查询，系统切换时自动跟随。
2. **防闪层** `index.html` 内联脚本：在 `<body>` 渲染前读取 `localStorage` 并提前加 `dark` class，避免刷新时深色模式闪白。
3. **样式层**：全局变量定义于 `styles/index.scss`（见 12 节），Element Plus 暗色由 `css-vars.css` 提供，二者以同一 `html.dark` class 联动。

切换入口：侧边栏底部“主题”一排三个按钮（浅色 / 深色 / 自动），见 8 节。

---

## 7. 网络请求与 GitHub API 层

### 7.1 axios 实例封装（src/utils/request.js）

```js
const request = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000, // 大文件上传场景预留更长超时
})
```

**请求拦截器**：

- 每次请求开始调用 `NProgress.start()`（顶部进度条）；
- **GET 请求自动追加时间戳参数 `t`**，防止浏览器 / CDN 响应缓存导致目录与文件列表不刷新；
- 从 `localStorage.githubToken` 读取 Token，存在则统一注入 `Authorization: token <token>`（因此 `api/github.js` 中除 `getUserInfo` 外无需显式传 Token）。

**响应拦截器**：

- 成功：`NProgress.done()` 后**直接返回 `response.data`**（调用方拿到的是接口数据本体）；
- 失败：`NProgress.done()` 并 `ElMessage.error(error.message)`（GitHub 错误信息对用户可见），随后 `reject` 交由调用方 `.catch` 继续处理（部分页面会二次提示）。

### 7.2 API 封装与 GitHub REST 端点对照（src/api/github.js）

| 封装函数 | 方法 / GitHub REST 端点 | 说明 |
| --- | --- | --- |
| `getUserInfo(token)` | `GET /user` | 校验 Token 并获取当前用户（头像、login 等），显式携带 `Authorization` |
| `getUserRepos(name)` | `GET /users/{name}/repos` | 获取用户仓库列表（登录用户视角，返回含可见仓库） |
| `getReposContents(name, repos, path)` | `GET /repos/{name}/{repos}/contents{path}` | 列出指定目录内容；`path` 经 `joinContentsPath` 规范化（空→`''`，`folder/a`→`/folder/a`） |
| `delFile(name, repos, filePath, data)` | `DELETE /repos/{name}/{repos}/contents{filePath}` | 删除文件，`data` 需携带 `{ message, sha }` |
| `upload(name, repos, path, fileName, data)` | `PUT /repos/{name}/{repos}/contents{path}/{fileName}` | 上传 / 新建文件，`data` 需携带 `{ message, content }`（**content 为纯 Base64，不含 dataURL 前缀**） |

要点：

- 所有请求由拦截器自动带 Token，因此实际调用方（Manage.vue）只需传业务参数；
- 上传与删除的 commit message 固定为 `Add files via PictureBed` / `Delete file via PictureBed`（见 Manage.vue）；
- GitHub contents API 返回的目录项带 `type`（`file` / `dir`）、`name`、`path`、`sha`、`download_url` 等字段，页面按需取用。

### 7.3 常见错误码与处理策略

| 错误码 | 常见场景 | 当前处理 |
| --- | --- | --- |
| 401 | Token 无效、被撤销或过期 | 拦截器弹出错误信息；页面引导回“图床配置”重新配置 |
| 403 | 权限不足（Token 缺少 `public_repo`）、触发限流 | 弹出错误信息 |
| 404 | 仓库不存在 / 是私有仓库且 Token 无权访问 / 路径不存在 | 弹出错误信息；目录恢复失败时回退根目录 |
| 409 | 同一仓库并发提交冲突（批量快速上传时出现） | 上传使用 1 秒间隔任务队列串行化，从源头规避 |
| 422 | 上传同名文件、提交内容不合法 | 页面有明确提示：“不可上传同名文件…请先删除原文件” |
| 超时 | 大文件 / 弱网（30s 上限） | 拦截器弹出错误信息 |
| 目录过大 | 单目录超过 GitHub 允许返回的 1000 个文件 | 页面提示“仅支持获取 1000 个文件内的目录”，建议建子目录分桶 |

---

## 8. 布局与导航系统

`src/layout/index.vue` 提供应用外壳：

**结构**：左侧 224px 固定侧边栏（sticky，不折叠）+ 右侧内容区 `<router-view>`。

- **Logo 区**：点击跳回 `/manage`；`settings.logo` 为图片，`settings.title` 为文字。
- **导航区**：两级分组 `navGroups`——

  | 分组 | 项 |
  | --- | --- |
  | （无分组标题） | 图床配置（Setting 图标）/ 图床管理（FolderOpened）/ 使用帮助（Reading） |
  | 工具箱 | 图片压缩（Download）/ 图片转 Base64（Memo）/ 图片水印（Brush） |

  当前路由与导航 path 完全相等时高亮（`isActive` 精确匹配）。
- **底部主题区**：浅色（Sunny）/ 深色（Moon）/ 自动（Monitor）三按钮，切换调用 `theme.js` 的 `setTheme`。
- **响应式**：`max-width: 768px` 时侧边栏收窄为 64px 图标条，隐藏所有文字（Logo、分组标题、主题文字）。

导航数据在组件内静态声明（非路由表生成），新增页面需**同时改路由与 `navGroups`**（见 15 节）。

---

## 9. 页面模块详解

### 9.1 图床配置页（views/Setting.vue，`#/setting`）

**区块一：GitHub 授权**

- 密码框输入 Token（占位符提示需 `public_repo` 权限），回车或点“查询”触发 `searchUser()` → 调 `getUserInfo(token)`；
- 成功后展示用户头像（`el-avatar`，无头像时显示首字符）+ `login` 昵称；`isSave` 变为 `false` 解锁“保存配置”按钮；
- “保存配置”`saveUser(true)`：写入 `githubToken` + `githubUserInfo`（用户信息序列化 JSON）；
- “清除配置”`saveUser(false)`：移除这两个键并清空界面回显；
- `created` 时若已有 Token 与用户信息，自动回显并允许直接保存（`isSave=false`）。

**区块二：CDN 站源**

- `cdnBaseUrl` 默认 `jsd.onmicrosoft.cn`（可被 `localStorage` 覆盖）；
- 输入框带 `https://` 前缀，保存时 `saveCdn()` 会剥离协议与首尾斜杠并写入 `cdnBaseUrl`；
- 提示文案明确直链格式：`https://{cdnBaseUrl}/gh/{用户名}/{仓库}/{路径}`，并列出了若干可用 jsDelivr 节点供参考。

### 9.2 图床管理页（views/Manage.vue，`#/manage`，核心页面）

该页是业务最复杂的页面，按模块拆解如下。

**（1）进入守卫与初始化**

- `created`：无 `githubToken` / `githubUserInfo` → 报错并 `$router.push('/setting')`；有则解析用户信息并 `getRepos()`。

**（2）仓库与目录选择（含记忆恢复）**

- 仓库下拉（`el-select filterable`）列出 `getUserRepos` 结果，变更时 `changeRepos()` 重置目录与列表；
- 目录使用 `el-cascader` **懒加载**（`lazyLoad`），逐层调用 `getReposContents` 只返回 `dir` 类型节点；所有节点 `leaf: false`，保证可继续下钻；
- 记忆机制：
  - 变更即 `persistSelection()` 写 `phRepo` / `phPath`；
  - 加载时 `restoreSelection()` 读取记忆，并用 `buildCascaderOptions()` **逐层预取**目录节点（保证级联回显与后续使用一致）；记忆目录若已不存在则安全回退根目录；
  - `resourceShow` 作为级联组件 `:key`，切换仓库时强制重建；
  - 恢复过程中通过 `_restoring` 标志避免 watch 触发重复持久化。

**（3）查询与图片列表**

- “查询”`search()`：调 `getReposContents`，过滤 `type === 'file'` 且扩展名命中白名单（见 11 节 `isImgExt`）的项；
- 图片网格：每张 190×190 卡片，`el-image` 以 CDN 或 GitHub 源站 URL 渲染缩略图（`fit="scale-down"`）；
- 悬浮操作层：文件名渐变条 + 三个圆形按钮——复制 CDN 链接（Link 图标）、复制 Markdown 链接（markdown.svg 图标）、删除（Delete 图标，红色悬停）；
- `v-viewer` 绑定在网格容器上，点击图片即可进入大图预览（缩放 / 旋转 / 全屏等）；
- **`viewerKey` 技巧**：每次查询成功 `viewerKey++` 并作为 `v-viewer` 容器的 `:key`，强制重建实例，否则新加载图片无法被 viewer 识别。

**（4）源站切换与提示条**

- `el-switch isCDN`：开 = jsDelivr CDN 直链，关 = GitHub 源站 `file.download_url`（仅影响**展示**，复制功能始终生成 CDN 链接，见 16 节注意事项）；
- 三条 `el-alert`（warning）顶部提示，可点“不再提示”，以 `hintShow1/2/3` 持久化：① 仅显示 `<img>` 支持格式；② 目录限 1000 文件；③ 同名上传返回 422。

**（5）上传（右侧抽屉）**

- 命名策略单选：**源文件名** / **UUID 文件名**（`randomUUID() + 原扩展名`，避免重名冲突）；
- “当前目录”实时显示将写入的仓库路径 `/{login}/{repo}/{dir}/`（`realPath` computed）；
- “自定义目录”开关：开启后可输入相对目录（如 `oldFolder/newFolder/`），上传时优先使用（`customDir` 规范化：去首尾斜杠，空视为根目录）；
- `el-upload`（drag、multiple、picture 列表、`auto-upload=false`）收集文件到 `uploadList`；
- “确定上传”`submitUpload()`：无文件则提示，有文件则调用 `uploadRef.submit()`，逐文件进入 `upload(data)`（自定义 `http-request`）：
  1. `FileReader` 读取为 DataURL，截取 `,` 之后的纯 Base64；
  2. 组装 `{ message: 'Add files via PictureBed', content: base64 }`；
  3. `taskQueue(fn, 1000)` **串行 + 1 秒间隔**提交，规避 GitHub commit 冲突（409）；
  4. 每个文件独立成功 / 失败回调（`onSuccess` / `onError`），成功弹“上传成功”。
- 按钮 3 秒节流防连点；上传完成后列表不会自动刷新，需再次“查询”。

**（6）删除与复制**

- 复制：`copy(type, file)` —— type 1 复制 CDN 直链；type 2 复制 `![文件名](URL)`；走 `copyTextAsync`（优先 Clipboard API，失败降级 `execCommand`），成功 / 失败分别轻提示；
- 删除：`ElMessageBox.confirm` 二次确认 → 携带 `{ message, sha: file.sha }` 调 `delFile` → 成功后自动重新 `search()` 刷新；取消则提示“已取消删除”。

### 9.3 使用帮助页（views/Help.vue，`#/help`）

- `el-steps` 分步教程（3 步 + 完成态），底部“上一步 / 下一步”切换；
- 步骤内容为图文说明：① 创建仓库（外链 `https://github.com/new`）；② 生成 Token（外链 `https://github.com/settings/tokens`，勾选 `public_repo`，强调“Token 只显示一次，记得保存”）；③ 使用（配置页填 Token 查询、管理页查询与上传截图）；
- 教程配图在 `src/assets/help_images/`；步骤完成时 `msgSuccess('恭喜你完成教程')`。

### 9.4 工具箱页面

三个工具箱页面**共用约定**：引入 `DropZone` 接收图片、`mounted` 时注册全局 `paste` 监听（`onPasteImages`，离开页面注销）、全部处理在浏览器本地完成、结果卡片可单独移除 / 清空。

**图片压缩（views/toolbox/Compress.vue）**

- 选项：输出格式（WebP 推荐 / JPEG / PNG 无损），质量滑杆 10–100（PNG 时禁用——无损格式忽略质量参数）；
- 处理：逐张 `readFileAsDataURL → loadImage → reEncodeImage(canvas 重编码)`，结果以 Blob 存于内存，展示压缩前后大小与节省百分比（变大时显示灰色“变大 x%”标签）；
- 命名：输出扩展名按格式改写（jpeg → `.jpg`），保留原文件主名；
- 下载：单张下载（`downloadBlob`）或“下载全部”；状态机：`wait → busy → done / error`，失败可重试（重新点开始压缩）；
- 说明：采用浏览器原生 `canvas.toBlob` 编码，非 wasm 类压缩器，PNG 转 PNG 通常不会变小。

**图片转 Base64（views/toolbox/Base64.vue）**

- 每张图片读取为 DataURL 后同时保存纯 Base64 与字符数；
- 顶部开关“包含 data:image 前缀 / 仅纯 Base64”控制文本展示与复制内容（实时切换）；
- 每项提供：复制、下载 `.txt`（文件名为 `原名.base64.txt`）、移除；支持清空；
- 应用场景提示：Data URL 可内嵌进 HTML / CSS / JSON 使用。

**图片水印（views/toolbox/Watermark.vue）**

- 两栏布局：左侧画布实时预览（带缩放 / 滚动），右侧参数面板；
- 参数：
  - 添加水印总开关（`wmEnabled`）；
  - 水印文字（≤ 20 字，默认 `Picture Hosting`）；
  - 水印大小（1–12，步进 0.5；实际字号 = `max(10, min(宽,高) × pct%)`，滑杆旁实时显示像素值）；
  - 颜色（`el-color-picker`，6 个预置色：白 / 黑 / Element 四主色）；
  - 透明度（5–100%，默认 85）；
  - 位置（左上 / 右上 / 左下 / 右下 / 居中）；
- 实时渲染：参数变更防抖 120ms 后重绘 canvas（`renderSoon`），文字带轻微阴影（黑色 35% 透明度、模糊与偏移随字号缩放）提升可读性；
- 导出：PNG（保留透明）/ JPEG（白底，`toBlob` 质量 0.92），文件名 `原名_watermark.{ext}`；
- “更换图片”按钮走隐藏 `<input type="file" accept="image/*">`；粘贴、拖拽同样支持（取第一张）。

### 9.5 404 页（views/404.vue）

- 不在 Layout 内，独立渲染（路由 `/404` + 未匹配路径兜底重定向）；
- 素材来自 `src/assets/404_images/`（404.png + 三朵动画云），文案与版权归属为英文模板遗留（见 16 节）。

---

## 10. 公共组件

### 10.1 DropZone（src/components/DropZone.vue）

通用图片接收组件，被三个工具箱页面复用：

| Props | 类型 / 默认 | 说明 |
| --- | --- | --- |
| `accept` | String / `'image/*'` | 文件选择器 accept |
| `multiple` | Boolean / `true` | 是否允许多选 |

- Emits：`files`（事件名小写，值为 `File[]`）；
- 交互：整块区域可点击弹出文件选择；支持拖拽（`dragover/drop`，只接收 `image/*`）；悬停/拖入高亮（`focus` class）；
- 内部隐藏 `<input type="file">`，每次点击前清空 `value` 保证同一文件可重复选择。

### 10.2 SvgIcon 与 SVG 雪碧图（src/components/SvgIcon/index.vue + src/icons/）

- **雪碧图注入插件**（见 vite.config.js 13.2 节）：构建时将 `src/icons/svg/*.svg` 读取并合并为一个注入 `document.body` 首部的 `<svg style="display:none">` 雪碧图，每个文件生成 `<symbol id="icon-{文件名}">`；
- **组件行为**：`iconClass` 为外链（`http(s)/mailto/tel` 开头）时用 CSS `mask` 渲染外部图标；否则渲染 `<svg><use :href="#icon-{name}"/></svg>`；
- 全局注册：`icons/index.js` 的 `setupIcons(app)` 注册为 `<svg-icon>`；
- 当前图标文件：`dashboard.svg`、`link.svg`（未被引用）、`markdown.svg`（管理页 Markdown 复制按钮）。

---

## 11. 工具函数库

| 文件 | 导出 | 说明 |
| --- | --- | --- |
| `utils/request.js` | `default request` | axios 实例（见 7.1） |
| `utils/theme.js` | `getTheme / applyTheme / initTheme / setTheme` | 主题读写（见 6.4） |
| `utils/directive.js` | `setupDirectives(app)` | 注册 `v-debounce` / `v-throttle`（见 6.2） |
| `utils/get-page-title.js` | `default getPageTitle(pageTitle)` | 标题拼接 `${title} - 图床工具` |
| `utils/image.js` | 见下 | 图片处理工具集 |
| `utils/copy.js` | `copy / copyTextAsync` | 复制文本：优先 `navigator.clipboard`（需安全上下文），失败降级隐藏 textarea + `execCommand('Copy')` |
| `utils/task-queue.js` | `taskQueue(fn, timeout)` | 定时串行队列（仅首个任务的 timeout 生效并启动定时器），用于上传错峰 |
| `utils/uuid.js` | `randomUUID()` | 生成 v4 风格 UUID（上传 UUID 命名） |
| `utils/validate.js` | `isExternal / isImgExt` | 外链正则 / 图片扩展名白名单 |
| `utils/index.js` | `parseTime / formatTime / param2Obj` | 时间格式化（含 Safari 兼容的 `/` 替换）、相对时间、query string 解析 |

`utils/image.js` 重点函数：

| 函数 | 说明 |
| --- | --- |
| `readFileAsDataURL(file)` | File → DataURL Promise |
| `loadImage(src)` | 按 src 加载 `Image`，失败抛“图片加载失败” |
| `downloadBlob(blob, filename)` | 创建 objectURL 触发下载，2s 后释放 |
| `formatSize(bytes)` | B / KB（1 位）/ MB（2 位）人类可读格式化 |
| `extOf(name)` | 提取小写扩展名 |
| `onPasteImages(callback)` | 注册全局 `paste` 监听，回调收到剪贴板中的图片 `File[]`，返回取消监听函数（组件卸载时调用） |
| `reEncodeImage(img, {format, quality})` | Canvas 重编码为 WebP/JPEG/PNG Blob；JPEG 前先铺白底；PNG 忽略质量 |

图片扩展名白名单（`validate.js`）：

```text
apng avif bmp gif ico cur jpg jpeg jfif pjpeg pjp png svg tif tiff webp
```

---

## 12. 样式体系与主题

### 12.1 全局样式（src/styles/index.scss）

- **CSS 变量**定义于 `:root` 与 `html.dark`，页面所有颜色 / 阴影 / 圆角均引用变量，改主题只需切换 class：

| 变量组 | 变量 |
| --- | --- |
| 背景 | `--bg-page`、`--bg-panel`、`--bg-elevated`、`--bg-hover`、`--bg-active` |
| 描边 / 文字 | `--line`、`--text-1`（主）、`--text-2`（次）、`--text-3`（弱化/说明） |
| 阴影 | `--shadow-card`、`--shadow-hover` |
| 圆角 | `--radius-card`（10px，卡片）、`--radius-sm`（8px） |

- Element Plus 主色直接使用其内置 `--el-color-primary` / `--el-color-danger` 等（如导航激活态、悬停按钮、删除危险色）；
- 通用骨架类（各页面复用）：`.page-head / .page-title / .page-desc`、`.panel / .panel-pad`（白卡片）、`.hover-lift`（悬停浮起）、`.toolbar / .gap-row`（弹性行）、`.muted`（弱化文字）；
- 上传/工具箱拖放区 `.dropzone`（虚线框、hover/focus 主色高亮）；
- 自定义滚动条（8px，浅色下灰色、跟随变量自动适配暗色）；
- `body` 字体栈：`Helvetica Neue / PingFang SC / Hiragino Sans GB / Microsoft YaHei / Arial / sans-serif`。

### 12.2 深浅两套变量对照

| 变量 | 浅色 `:root` | 深色 `html.dark` |
| --- | --- | --- |
| `--bg-page` | `#f2f3f5` | `#0c0d0f` |
| `--bg-panel` | `#ffffff` | `#16181a` |
| `--bg-elevated` | `#ffffff` | `#1d1f22` |
| `--bg-hover` | `#eef0f4` | `#232629` |
| `--bg-active` | `rgba(64,158,255,.12)` | `rgba(64,158,255,.18)` |
| `--line` | `#e4e7ed` | `#2a2d31` |
| `--text-1/2/3` | `#303133 / #50505c / #909399` | `#e5eaf3 / #cfd3dc / #a3a6ad` |
| `--shadow-card` | 浅阴影 | 深色重阴影 |

> 组件内的 scoped 样式只做布局与动效（定位、hover 过渡、动画），**颜色一律引用 CSS 变量**，是暗色主题正确的关键约定。

---

## 13. 构建与工程配置

### 13.1 package.json

- `type: "module"`（ESM）；`engines.node >= 20.19.0`；
- 脚本：`dev` / `serve`（vite）、`build`（vite build）、`preview`（vite preview）；
- `private: true`，无发布配置。

### 13.2 vite.config.js

| 配置项 | 内容 |
| --- | --- |
| `base` | `'/'`（部署于域名根路径；子路径部署需修改） |
| 插件 | `vue()` + 自研 `svgSpritePlugin()`（见下） |
| `resolve.alias` | `@` → `src`；extensions 显式补 `.vue` 等（沿袭 webpack 习惯） |
| `css.preprocessorOptions.scss` | `api: 'modern-compiler'`，静默 `legacy-js-api` / `import` 弃用告警 |
| `server` | 端口 9001；`open: !process.env.DSH_NO_OPEN`；overlay 仅错误 |
| `build` | `outDir: 'dist'`、`assetsDir: 'static'`、`sourcemap: false` |

**svgSpritePlugin（内联雪碧图插件）**要点：

- 暴露虚拟模块 `virtual:svg-icons`；`load()` 时读取 `src/icons/svg/` 下全部 `.svg`；
- 剥离 XML 声明 / DOCTYPE，解析 `<svg>` 的 `viewBox`（缺失时回退 width/height，再回退 `0 0 1024 1024`）；
- 生成模块代码：运行时创建 div 注入完整雪碧图到 `document.body` 首部（与旧 vue-element-admin webpack `svg-sprite-loader` 约定一致：`<symbol id="icon-{name}">`）；
- 该代码由 `src/icons/index.js` 的 `import 'virtual:svg-icons'` 触发副作用执行。

### 13.3 index.html

- `lang="zh-CN"`；标题“图床工具”；`<link rel="icon">` 指向 jsDelivr 外链 ico（原作者仓库）；
- 内联主题防闪脚本（6.4）；
- `<noscript>` 提示需启用 JavaScript；`#app` 挂载点 + `/src/main.js` 模块入口。

### 13.4 .gitignore

忽略 `node_modules`、`/dist`、`.env.local` / `.env.*.local`、日志、编辑器目录等。项目未使用任何 `.env` 变量（配置全在 localStorage）。

---

## 14. 部署与发布

1. 构建：
   ```bash
   npm run build
   ```
   产物在 `dist/`（JS/CSS 位于 `dist/static/`）。
2. 托管：由于是纯静态 SPA 且路由为 **Hash 模式**，任意静态服务器 / 对象存储 / Pages 均可直接托管，无需 rewrite 规则。示例 nginx：
   ```nginx
   server {
     listen 80;
     server_name example.com;
     root /var/www/picturebed/dist;
     index index.html;
     # Hash 路由，无需 try_files 回退；按需补 gzip/缓存策略即可
   }
   ```
3. 品牌自定制（如自建站）：
   - 页面标题 / Logo：修改 `src/settings.js` 的 `title` / `logo` 与 `index.html` 的 `<title>`、favicon；
   - 默认 CDN 站源建议：修改 `Setting.vue` / `Manage.vue` 中 `localStorage.getItem('cdnBaseUrl') || 'jsd.onmicrosoft.cn'` 的兜底值。
4. 注意：`index.html` 的 favicon 与 `settings.js` 的 logo 目前指向原作者仓库（`iusine/Image-bed`）的 jsDelivr 外链，正式商用 / 自部署建议替换为本地资源。

---

## 15. 二次开发与扩展指南

### 15.1 新增一个页面（三步）

1. **加路由**：在 `src/router/index.js` 的 Layout children 中追加：
   ```js
   { path: 'xxx', name: 'Xxx', component: () => import('@/views/Xxx.vue'), meta: { title: '页面标题' } }
   ```
2. **建页面**：在 `src/views/` 创建组件，遵循“页面骨架 = `.page-head`（标题 + 描述）+ `.panel` 卡片”的结构，样式写 `scoped` SCSS 并引用 CSS 变量。
3. **加导航**：在 `src/layout/index.vue` 的 `navGroups` 对应分组 items 中追加 `{ path, title, icon }`（icon 从 `@element-plus/icons-vue` 引入）。

### 15.2 新增一个 SVG 图标

将 `.svg` 放入 `src/icons/svg/`，即可用 `<svg-icon icon-class="文件名" />`（自动进入雪碧图，无需其它注册步骤）；组件同时支持传 `http(s)` 外链图标。

### 15.3 新增一个纯本地工具

参考 Compress / Base64 页写法：复用 `DropZone` + `onPasteImages`，结果用卡片列表管理，注意在 `beforeUnmount` 中释放 `URL.createObjectURL` 并注销 paste 监听；然后在路由与侧边栏“工具箱”分组登记。

### 15.4 代码约定（便于保持一致）

- 统一 **Options API**：`data / computed / watch / methods / created / mounted / beforeUnmount`；
- 异步反馈用 `this.msgSuccess / this.msgError`；危险操作确认用 `ElMessageBox.confirm`；
- 防连点：短操作用 `v-throttle` / `v-debounce`（按钮传 `[方法名, 'click', 毫秒]`）；
- 任何向 GitHub 提交的写操作注意频率（批量走 `taskQueue` 错峰）；
- 颜色 / 阴影 / 圆角不要写死，用 `var(--...)` 或 Element Plus 的 `--el-color-*`；
- 新增 localStorage 键建议统一登记到 5.2 节的键位表。

---

## 16. 已知限制与遗留事项

| 项 | 说明 | 建议 |
| --- | --- | --- |
| 单目录上限 | GitHub contents API 单目录最多返回 1000 项，超出会失败（页面已有提示） | 图床建子目录分桶 |
| 同名文件 | 上传同名文件返回 422，不支持覆盖更新 | 用 UUID 命名或先删后传 |
| 批量写冲突 | 并发提交可能返回 409 | 已用 1 秒间隔队列缓解 |
| 复制链接恒为 CDN | 管理页即使关闭“CDN 加速”（展示 GitHub 源站缩略图），复制 CDN / Markdown 仍拼接 jsDelivr 地址 | 属既定行为，注意在文档中向用户说明 |
| 上传后不自动刷新 | 上传成功需手动再次“查询”查看新图 | 可做增强：上传完成后自动刷新当前目录 |
| 临时切换 CDN 站源 UI 被注释 | `Manage.vue` 中 `row3`（临时切换 CDN 输入框）整段被注释，`confirmCdnBaseUrl` 方法保留但不可达 | 长期站源请在“图床配置”中修改 |
| 遗留依赖 | `path-to-regexp` 声明但未被引用 | 可移除 |
| 遗留文件 | `public/905.png`、`public/favicon.ico`（index.html 用的是外链 ico）、`icons/svg/dashboard.svg`、`icons/svg/link.svg`、`settings.js` 的 `defaultOpeneds` | 可按需清理 |
| 英文遗留文案 | 404 页文案、wallstreetcn 版权链接、无 JS 提示等为模板遗留 | 可按需本地化 |
| Token 安全 | Token 明文存于 localStorage，可被同源 XSS 读取 | 部署时加强 CSP；尽量在可信环境使用，可申请最小权限 Token |
| 大文件内存 | 上传 / 压缩 / 转码均经 FileReader 全量读入内存 + canvas，超大图可能吃内存 | 未设文件大小上限（产品有意为之） |
| 工具箱能力边界 | 压缩为浏览器原生编码器，WebP 有损/PNG 无损 | 别宣传为“极致算法压缩” |

---

## 17. 版本记录

| 版本 | 日期 | 变更要点 |
| --- | --- | --- |
| v0.2.0 | 当前版本 | 路由 / 管理页记忆、CDN 站源配置、三工具箱、主题切换、v-viewer 预览等（以 git 历史为准） |

---

*本文档基于代码仓库当前状态编写。修改代码时，请同步更新本文档与《用户操作手册》中受影响的章节。*
