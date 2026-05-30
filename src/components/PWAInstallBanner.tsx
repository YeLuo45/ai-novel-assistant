import { useState, useEffect } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isInstallable && !isInstalled && !dismissed) {
      // Delay showing banner to not be too intrusive
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, dismissed])

  if (!visible || !isInstallable || dismissed) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-3xl">📱</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-dark-text text-sm">
            安装 AI小说助手
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            添加到主屏幕，随时随地进行创作
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setDismissed(true)}
          className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
        >
          稍后
        </button>
        <button
          onClick={async () => {
            await install()
            setDismissed(true)
          }}
          className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors touch-target font-medium"
        >
          安装
        </button>
      </div>
    </div>
  )
}
