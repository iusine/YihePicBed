import { createApp } from 'vue'
import { ElMessage } from 'element-plus'
import App from './App.vue'
import router from './router'

// A modern alternative to CSS resets
import 'normalize.css/normalize.css'
// element-plus (含暗色主题变量)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// global css
import '@/styles/index.scss'
// icon (svg-icon 组件 + 雪碧图注入)
import { setupIcons } from '@/icons'
// v-viewer (Vue 3)
import 'viewerjs/dist/viewer.css'
import Viewer from 'v-viewer'
// directive
import { setupDirectives } from './utils/directive'
// theme
import { initTheme } from './utils/theme'

initTheme()

const app = createApp(App)

app.use(ElementPlus)
app.use(Viewer)
setupIcons(app)
setupDirectives(app)

app.config.globalProperties.msgSuccess = function (msg) {
	ElMessage.success(msg)
}

app.config.globalProperties.msgError = function (msg) {
	ElMessage.error(msg)
}

app.use(router)

app.mount('#app')
