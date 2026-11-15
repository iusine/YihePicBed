/**
 * 通过生成DOM节点来复制内容至剪贴板
 * @param {string} 需要复制的内容
 */
export function copy(copyCont) {
	let oInput = document.createElement('textarea')
	oInput.value = copyCont
	oInput.style.position = 'fixed'
	oInput.style.opacity = '0'
	document.body.appendChild(oInput)
	oInput.select()
	document.execCommand('Copy')
	oInput.remove()
}

/**
 * 优先使用 Clipboard API，失败时回退到 execCommand
 * @param {string} text
 */
export async function copyTextAsync(text) {
	try {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text)
			return
		}
	} catch (e) {
		// fall through
	}
	copy(text)
}
