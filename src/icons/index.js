import SvgIcon from '@/components/SvgIcon'

// side effect: inject the <symbol> sprite produced by the vite svg-sprite plugin
import 'virtual:svg-icons'

// register globally
export function setupIcons(app) {
	app.component('svg-icon', SvgIcon)
}
