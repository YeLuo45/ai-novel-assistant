import { useEffect, useCallback } from 'react'
import { useStore } from '../store'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'ai-novel-theme'

export function useTheme() {
  const theme = useStore(state => (state as any).theme || 'system')
  const setTheme = (state: any) => state.setTheme

  const applyTheme = useCallback((themeValue: Theme) => {
    const root = document.documentElement
    let isDark = false

    if (themeValue === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDark = themeValue === 'dark'
    }

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  const handleSetTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(THEME_KEY, newTheme)
    setTheme(newTheme)
    applyTheme(newTheme)
  }, [setTheme, applyTheme])

  useEffect(() => {
    // Get initial theme from localStorage or default to system
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
    const initialTheme = savedTheme || 'system'
    
    // Initialize theme state in store if not present
    if (!(useStore.getState() as any).theme) {
      useStore.setState({ theme: initialTheme })
    }
    
    applyTheme(initialTheme)

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem(THEME_KEY) as Theme | null
      if (!currentTheme || currentTheme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [applyTheme])

  return {
    theme,
    setTheme: handleSetTheme,
    isDark: theme === 'dark' || (theme === 'system' && window.matchMedia('prefers-color-scheme: dark').matches)
  }
}
