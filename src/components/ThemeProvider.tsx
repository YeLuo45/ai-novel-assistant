import { useEffect } from 'react'
import { useStore } from '../store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore(state => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const storedTheme = localStorage.getItem('ai-novel-theme') as 'light' | 'dark' | 'system' | null
    const currentTheme = storedTheme || 'system'
    
    let isDark = false
    if (currentTheme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
      isDark = currentTheme === 'dark'
    }

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const stored = localStorage.getItem('ai-novel-theme') as 'light' | 'dark' | 'system' | null
      if (!stored || stored === 'system') {
        const root = document.documentElement
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}
