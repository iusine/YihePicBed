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

// ===== Git Data API：用于一次提交批量移动文件 =====

// 仓库信息（取默认分支）
export function getRepo(name, repos) {
	return request({
		url: `/repos/${name}/${repos}`,
		method: 'GET'
	})
}

// 分支当前指向的提交
export function getRef(name, repos, branch) {
	return request({
		url: `/repos/${name}/${repos}/git/ref/heads/${encodeURIComponent(branch)}`,
		method: 'GET'
	})
}

// 提交详情（取根 tree sha）
export function getCommit(name, repos, sha) {
	return request({
		url: `/repos/${name}/${repos}/git/commits/${sha}`,
		method: 'GET'
	})
}

// 递归读取目录树（用于列出全部目录）
export function getTree(name, repos, sha, recursive = true) {
	return request({
		url: `/repos/${name}/${repos}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`,
		method: 'GET'
	})
}

export function createTree(name, repos, data) {
	return request({
		url: `/repos/${name}/${repos}/git/trees`,
		method: 'POST',
		data
	})
}

export function createCommit(name, repos, data) {
	return request({
		url: `/repos/${name}/${repos}/git/commits`,
		method: 'POST',
		data
	})
}

export function updateRef(name, repos, branch, data) {
	return request({
		url: `/repos/${name}/${repos}/git/refs/heads/${encodeURIComponent(branch)}`,
		method: 'PATCH',
		data
	})
}
