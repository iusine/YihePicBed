import request from '@/utils/request'

// 将目录参数规范化为 contents 后的子路径：'' -> ''，'folder/a' -> '/folder/a'
function joinContentsPath(p) {
	p = (p || '').replace(/^\/+|\/+$/g, '')
	return p ? '/' + p : ''
}

// 获取用户信息
export function getUserInfo(token) {
	return request({
		url: `/user`,
		method: 'GET',
		headers: {
			Authorization: `token ${token}`
		}
	})
}

// 获取用户仓库列表
export function getUserRepos(name) {
	return request({
		url: `/users/${name}/repos`,
		method: 'GET'
	})
}

// 获取用户仓库下指定目录的文件列表
export function getReposContents(name, repos, path) {
	return request({
		url: `/repos/${name}/${repos}/contents${joinContentsPath(path)}`,
		method: 'GET'
	})
}

// 删除文件
export function delFile(name, repos, filePath, data) {
	return request({
		url: `/repos/${name}/${repos}/contents${joinContentsPath(filePath)}`,
		method: 'DELETE',
		data
	})
}

// 上传文件至仓库指定目录下
export function upload(name, repos, path, fileName, data) {
	return request({
		url: `/repos/${name}/${repos}/contents${joinContentsPath(path)}/${fileName}`,
		method: 'PUT',
		data
	})
}
