import { useStore } from '../store'

export function ThemeToggle({ showLabel = false, className = '' }: { showLabel?: boolean; className?: string }) {
  const theme = useStore(state => state.theme)
  const setTheme = useStore(state => state.setTheme)

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
  }

  const getIcon = () => {
    if (theme === 'light') return '☀️'
    if (theme === 'dark') return '🌙'
    return '💻'
  }

  const getLabel = () => {
    if (theme === 'light') return '浅色'
    if (theme === 'dark') return '深色'
    return '跟随系统'
  }

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm touch-target ${className}`}
      title={`当前: ${getLabel()}`}
    >
      <span className="text-base">{getIcon()}</span>
      {showLabel && <span className="text-gray-700 dark:text-gray-200">{getLabel()}</span>}
    </button>
  )
}
