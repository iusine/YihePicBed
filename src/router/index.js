import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/layout'
import getPageTitle from '@/utils/get-page-title'

export const routes = [
	{
		path: '/404',
		component: () => import('@/views/404'),
		meta: {title: '404 NOT FOUND'},
		hidden: true
	},
	{
		path: '/',
		component: Layout,
		redirect: '/manage',
		children: [
			{
				path: 'setting',
				name: 'Setting',
				component: () => import('@/views/Setting'),
				meta: {title: '图床配置'}
			},
			{
				path: 'manage',
				name: 'Manage',
				component: () => import('@/views/Manage'),
				meta: {title: '图床管理'}
			},
			{
				path: 'help',
				name: 'Help',
				component: () => import('@/views/Help'),
				meta: {title: '使用帮助'}
			},
			{
				path: 'toolbox/compress',
				name: 'ToolCompress',
				component: () => import('@/views/toolbox/Compress'),
				meta: {title: '图片压缩'}
			},
			{
				path: 'toolbox/base64',
				name: 'ToolBase64',
				component: () => import('@/views/toolbox/Base64'),
				meta: {title: '图片转 Base64'}
			},
			{
				path: 'toolbox/watermark',
				name: 'ToolWatermark',
				component: () => import('@/views/toolbox/Watermark'),
				meta: {title: '图片水印'}
			},
		]
	},

	// 404 page must be placed at the end !!!
	{path: '/:pathMatch(.*)*', redirect: '/404', hidden: true}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

router.beforeEach((to, from, next) => {
	document.title = getPageTitle(to.meta.title)
	next()
})

export default router
