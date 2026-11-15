import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = process.cwd()
const srcDir = resolve(projectRoot, 'src')

/**
 * Inline SVG sprite loader.
 * Builds `virtual:svg-icons` module from every .svg file under src/icons/svg
 * and exposes each file as a <symbol id="icon-<name>"> (same convention the old
 * webpack svg-sprite-loader used), so <svg-icon icon-class="dashboard"/> still
 * renders <use href="#icon-dashboard"/>.
 */
function svgSpritePlugin() {
  const iconsDir = resolve(srcDir, 'icons/svg')
  const virtualModuleId = 'virtual:svg-icons'

  return {
    name: 'svg-sprite',
    resolveId(id) {
      return id === virtualModuleId ? virtualModuleId : null
    },
    load(id) {
      if (id !== virtualModuleId) return null

      const files = readdirSync(iconsDir).filter(file => file.endsWith('.svg'))
      const symbols = files.map(file => {
        const raw = readFileSync(resolve(iconsDir, file), 'utf8')
          .replace(/<\?xml[\s\S]*?\?>/g, '')
          .replace(/<!DOCTYPE[\s\S]*?>/g, '')
        const openTag = /<svg([^>]*)>/.exec(raw)
        if (!openTag) return ''
        const attrs = openTag[1]
        const viewBox = /viewBox="([^"]+)"/.exec(attrs)
        const width = /width="([^"]+)"/.exec(attrs)
        const height = /height="([^"]+)"/.exec(attrs)
        const vb = viewBox
          ? viewBox[1]
          : width && height
            ? `0 0 ${width[1]} ${height[1]}`
            : '0 0 1024 1024'
        const inner = raw
          .replace(/^[\s\S]*?<svg[^>]*>/, '')
          .replace(/<\/svg>\s*$/, '')
        const name = file.replace(/\.svg$/, '')
        return `<symbol id="icon-${name}" viewBox="${vb}">${inner}</symbol>`
      }).join('')

      return (
        `const sprite = '<svg xmlns="http://www.w3.org/2000/svg" ` +
        `xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">${symbols}</svg>'\n` +
        `const holder = document.createElement('div')\n` +
        `holder.innerHTML = sprite\n` +
        `document.body.insertBefore(holder.firstChild, document.body.firstChild)\n` +
        `export default {}`
      )
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue(), svgSpritePlugin()],
  resolve: {
    alias: {
      '@': srcDir
    },
    // vue-cli/webpack 默认会解析 .vue；vite 需要显式声明
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import']
      }
    }
  },
  server: {
    port: 9001,
    // DSH_NO_OPEN=1 时(如 CI/无头冒烟测试)不自动打开浏览器
    open: !process.env.DSH_NO_OPEN,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: false
  }
})
