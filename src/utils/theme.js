const THEME_KEY = 'ph-theme'

function systemDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'system'
}

export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}

let mediaQuery = null

export function initTheme() {
  applyTheme(getTheme())
  if (window.matchMedia && !mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (getTheme() === 'system') applyTheme('system')
    }
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onChange)
    }
  }
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}
