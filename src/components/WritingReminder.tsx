import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { reminderService, ReminderMessage } from '../services/ReminderService'

interface Props {
  onOpenMilestonePanel?: () => void
}

export default function WritingReminder({ onOpenMilestonePanel }: Props) {
  const { currentProject } = useStore()
  const [showReminder, setShowReminder] = useState(false)
  const [reminderMessage, setReminderMessage] = useState<ReminderMessage | null>(null)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!currentProject?.id) return

    // Set callback then start with settings
    reminderService.setCallback((message: ReminderMessage) => {
      // Check if we've already dismissed this reminder today
      const dismissKey = `reminder_dismissed_${message.projectId}_${new Date().toISOString().split('T')[0]}`
      if (localStorage.getItem(dismissKey) === 'true') return
      
      setReminderMessage(message)
      setShowReminder(true)
      setDismissedKey(dismissKey)
    })
    reminderService.start({
      projectId: currentProject.id,
      enabled: true,
      dailyReminderTime: '20:00',
      reminderDays: [1, 2, 3, 4, 5, 6, 0],
      autoRemindMilestones: true,
      minWordCountForReminder: 500
    })

    return () => {
      reminderService.stop()
    }
  }, [currentProject?.id])

  const handleDismiss = () => {
    setShowReminder(false)
    if (dismissedKey) {
      localStorage.setItem(dismissedKey, 'true')
    }
  }

  const handleSnooze = () => {
    setShowReminder(false)
    // Snooze for 30 minutes
    const snoozeKey = `reminder_snoozed_${reminderMessage?.projectId}_${new Date().toISOString().split('T')[0]}`
    const snoozeUntil = Date.now() + 30 * 60 * 1000
    localStorage.setItem(snoozeKey, String(snoozeUntil))
  }

  // Don't show if no reminder or reminder is dismissed
  if (!showReminder || !reminderMessage) return null

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="font-semibold text-white">{reminderMessage.title}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-700 mb-3 whitespace-pre-line">
          {reminderMessage.body}
        </p>

        {/* Milestone Preview */}
        {reminderMessage.overdueMilestones.length > 0 && (
          <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-xs font-medium text-red-600 mb-1">⚠️ 逾期里程碑</div>
            {reminderMessage.overdueMilestones.slice(0, 2).map((m, i) => (
              <div key={i} className="text-xs text-red-500">{m.title}</div>
            ))}
          </div>
        )}

        {reminderMessage.upcomingMilestones.length > 0 && (
          <div className="mb-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-xs font-medium text-yellow-600 mb-1">📅 即将到期</div>
            {reminderMessage.upcomingMilestones.slice(0, 2).map((m, i) => (
              <div key={i} className="text-xs text-yellow-600">{m.title}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSnooze}
            className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            稍后提醒
          </button>
          {onOpenMilestonePanel && (
            <button
              onClick={() => {
                handleDismiss()
                onOpenMilestonePanel()
              }}
              className="flex-1 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              查看里程碑
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
        >
          今天不再提醒
        </button>
      </div>
    </div>
  )
}

// CSS animation (add to index.css if not present)
// @keyframes slide-up {
//   from { transform: translateY(100%); opacity: 0; }
//   to { transform: translateY(0); opacity: 1; }
// }
// .animate-slide-up { animation: slide-up 0.3s ease-out; }
