import { useEffect, useState } from 'react'
import { useStore } from '../store'

interface BackupReminderState {
  showReminder: boolean
  minutesSinceBackup: number
  dismiss: () => void
}

export function useBackupReminder(): BackupReminderState {
  const { checkBackupReminder, lastBackupTime } = useStore()
  const [showReminder, setShowReminder] = useState(false)
  const [minutesSinceBackup, setMinutesSinceBackup] = useState(0)

  useEffect(() => {
    // Check immediately
    const check = checkBackupReminder()
    setMinutesSinceBackup(check.minutesSinceBackup)
    setShowReminder(check.shouldRemind)

    // Check every minute
    const interval = setInterval(() => {
      const result = checkBackupReminder()
      setMinutesSinceBackup(result.minutesSinceBackup)
      if (result.shouldRemind && !showReminder) {
        setShowReminder(true)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [lastBackupTime])

  const dismiss = () => {
    setShowReminder(false)
    // Don't show again for 5 minutes after dismiss
    setTimeout(() => {
      // Re-enable after 5 minutes if still should remind
      const result = checkBackupReminder()
      if (result.shouldRemind) {
        setShowReminder(true)
      }
    }, 5 * 60000)
  }

  return { showReminder, minutesSinceBackup, dismiss }
}
