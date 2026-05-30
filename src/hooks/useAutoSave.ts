/**
 * useAutoSave - V31 自动存档 Hook
 * - 编辑后 30 秒无操作触发存档
 * - 切换章节时强制存档
 * - 返回 hasUnsavedChanges 状态
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoSaveOptions {
  content: string
  title: string
  chapterId: number
  projectId: number
  onSave: (content: string, title: string) => Promise<void>
  onCreateVersion?: (content: string, title: string) => Promise<void>
  delay?: number  // debounce delay in ms, default 30000 (30s)
}

interface UseAutoSaveReturn {
  hasUnsavedChanges: boolean
  isSaving: boolean
  forceSave: () => Promise<void>
  lastSavedTime: Date | null
}

export function useAutoSave({
  content,
  title,
  chapterId,
  projectId,
  onSave,
  onCreateVersion,
  delay = 30000
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
  
  const lastSavedContentRef = useRef(content)
  const lastSavedTitleRef = useRef(title)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitializedRef = useRef(false)

  // Track changes
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      lastSavedContentRef.current = content
      lastSavedTitleRef.current = title
      return
    }
    
    const contentChanged = content !== lastSavedContentRef.current
    const titleChanged = title !== lastSavedTitleRef.current
    
    if (contentChanged || titleChanged) {
      setHasUnsavedChanges(true)
    }
  }, [content, title])

  // Clear existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Save function
  const performSave = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return
    
    setIsSaving(true)
    try {
      // Save current content
      await onSave(content, title)
      
      // Create version snapshot if callback provided
      if (onCreateVersion && projectId && chapterId) {
        const currentWordCount = content.replace(/\s/g, '').length
        // Only create version if content has meaningful changes (>50 chars difference)
        const lastWordCount = lastSavedContentRef.current.replace(/\s/g, '').length
        if (Math.abs(currentWordCount - lastWordCount) > 50 || !lastSavedTime) {
          await onCreateVersion(content, title)
        }
      }
      
      lastSavedContentRef.current = content
      lastSavedTitleRef.current = title
      setLastSavedTime(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, title, hasUnsavedChanges, isSaving, onSave, onCreateVersion, projectId, chapterId, lastSavedTime])

  // Auto-save timer effect (30s debounce)
  useEffect(() => {
    if (!hasUnsavedChanges) return

    clearTimer()
    
    timerRef.current = setTimeout(() => {
      performSave()
    }, delay)

    return () => clearTimer()
  }, [hasUnsavedChanges, delay, clearTimer, performSave])

  // Force save function (e.g., on chapter switch)
  const forceSave = useCallback(async () => {
    clearTimer()
    await performSave()
  }, [clearTimer, performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    hasUnsavedChanges,
    isSaving,
    forceSave,
    lastSavedTime
  }
}

export default useAutoSave