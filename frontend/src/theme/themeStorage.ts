import type { ThemeMode } from './themeContext'

export const THEME_STORAGE_KEY = 'wesleyLedger.theme.v1'

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  try {
    const t = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* private mode */
  }
  return 'dark'
}

export function writeStoredTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export function applyThemeToDocument(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode === 'light' ? 'light' : 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', mode === 'light' ? '#f4f6fb' : '#0a1628')
  }
}
