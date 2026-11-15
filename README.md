# YihePicBed

GitHub 图床管理工具

基于 [GitHub API](https://docs.github.com/cn/rest)，使用 GitHub 仓库作为图床 + jsDelivr CDN 加速访问

灵感来自 [imgurl](https://github.com/WishMelz/imgurl)，界面风格参考 [PicX](https://upload.kasuie.cc/#/upload)（KASUIEの图床）进行了简洁化重构。

> 技术栈：Vue 3 + Element Plus + vue-router 4 + Vite（Node 24 兼容）
> 无后端，GitHub Token 与配置仅保存在浏览器 localStorage；三个工具箱工具均为纯本地处理。

## 文档

- [网站开发文档](docs/DEVELOPMENT.md)：技术栈、架构、模块实现、工程配置与扩展指南（面向开发者）
- [用户操作手册](docs/USER-MANUAL.md)：从建仓库、配 Token 到上传图片、使用工具箱的完整图文指引（面向使用者）

## 页面（左侧固定导航，无折叠）

| 菜单 | 路由 | 说明 |
| --- | --- | --- |
| 图床配置 | `#/setting` | GitHub Token / 用户信息 / **CDN 站源**（可保存默认站源） |
| 图床管理 | `#/manage` | 选择仓库与目录，查询 / 上传 / 复制 CDN 链接 / Markdown / 删除 |
| 使用教程 | `#/help` | 三步使用指南 |
| 工具箱 · 图片压缩 | `#/toolbox/compress` | 离线极致压缩（WebP/JPEG/PNG、质量调节、批量下载） |
| 工具箱 · 图片转 Base64 | `#/toolbox/base64` | 批量转 Base64，可复制 / 下载 .txt |
| 工具箱 · 图片水印 | `#/toolbox/watermark` | 文字水印：大小 / 颜色 / 透明度 / 位置，画布预览并导出 PNG/JPEG |

侧边栏底部支持主题切换：浅色 / 深色 / 跟随系统。

## 环境要求

- Node.js `>= 20.19`（已在 Node 24 上验证）

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run dev
# 或兼容旧习惯的别名
npm run serve
```

默认开发端口为 `9001`，会自动打开浏览器；如不需要自动打开，可设置环境变量 `DSH_NO_OPEN=1`。

### Compiles and minifies for production

```
npm run build
```

构建产物输出到 `dist/`。

### Preview production build locally

```
npm run preview
```
