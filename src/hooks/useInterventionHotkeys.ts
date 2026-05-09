import { useEffect } from 'react'
import type { UserAction } from '@/ai/intervention/types'

export function useInterventionHotkeys(
  onAction: (action: UserAction) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return
      }

      switch (e.key) {
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault()
            onAction({ type: 'approve' })
          }
          break
        case 'Escape':
          onAction({ type: 'skip' })
          break
        case 'r':
        case 'R':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onAction({ type: 'rerun' })
          }
          break
        case 'p':
        case 'P':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onAction({ type: 'pause' })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onAction, enabled])
}
