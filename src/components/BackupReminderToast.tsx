import { useEffect } from 'react'
import { useBackupReminder } from '../hooks/useBackupReminder'
import { useStore } from '../store'

interface Props {
  onOpenBackup: () => void
}

export default function BackupReminderToast({ onOpenBackup }: Props) {
  const { updateLastBackupTime } = useStore()
  const { showReminder, minutesSinceBackup, dismiss } = useBackupReminder()

  // Auto-hide after 5 seconds if not dismissed
  useEffect(() => {
    if (showReminder) {
      const timer = setTimeout(() => {
        dismiss()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showReminder])

  if (!showReminder) return null

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      return `${hours}小时`
    }
    return `${mins}分钟`
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4">
        <span className="text-xl">💾</span>
        <div>
          <div className="font-medium">建议备份</div>
          <div className="text-sm text-amber-100">
            已 {formatTime(minutesSinceBackup)} 未备份
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => {
              onOpenBackup()
              dismiss()
            }}
            className="px-3 py-1 bg-white text-amber-600 text-sm font-medium rounded-lg hover:bg-amber-50"
          >
            备份
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1 text-amber-100 text-sm hover:text-white"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  )
}
