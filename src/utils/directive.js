/**
 * 防抖 单位时间只触发最后一次
 * 例：<el-button v-debounce="[reset,`click`,300]">刷新</el-button>
 * 简写：<el-button v-debounce="[reset]">刷新</el-button>
 */
function debounceDirective(app) {
	app.directive('debounce', {
		mounted(el, binding) {
			let [fn, event = "click", time = 300] = binding.value
			let timer
			const handler = () => {
				timer && clearTimeout(timer)
				timer = setTimeout(() => fn(), time)
			}
			el.addEventListener(event, handler)
			el._debounceHandler = handler
			el._debounceEvent = event
		},
		unmounted(el) {
			el.removeEventListener(el._debounceEvent, el._debounceHandler)
		}
	})
}

/**
 * 节流 每单位时间可触发一次
 * 例：<el-button v-throttle="[reset,`click`,300]">刷新</el-button>
 * 传递参数：<el-button v-throttle="[()=>reset(param),`click`,300]">刷新</el-button>
 */
function throttleDirective(app) {
	app.directive('throttle', {
		mounted(el, binding) {
			let [fn, event = "click", time = 300] = binding.value
			let now, preTime
			const handler = () => {
				now = new Date()
				if (!preTime || now - preTime > time) {
					preTime = now
					fn()
				}
			}
			el.addEventListener(event, handler)
			el._throttleHandler = handler
			el._throttleEvent = event
		},
		unmounted(el) {
			el.removeEventListener(el._throttleEvent, el._throttleHandler)
		}
	})
}

export function setupDirectives(app) {
	debounceDirective(app)
	throttleDirective(app)
}
