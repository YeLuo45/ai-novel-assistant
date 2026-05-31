import { useState, useEffect } from 'react'
import { ChapterProgress } from '../db'
import { db } from '../db'

interface Props {
  projectId: number
  chapterId: number
  currentWordCount: number
  defaultTarget?: number
  onTargetChange?: (target: number) => void
}

export default function ChapterProgressBar({
  projectId,
  chapterId,
  currentWordCount,
  defaultTarget = 3000,
  onTargetChange
}: Props) {
  const [target, setTarget] = useState(defaultTarget)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(defaultTarget))
  const [progress, setProgress] = useState<ChapterProgress | null>(null)

  // Load saved target from DB
  useEffect(() => {
    const loadProgress = async () => {
      const saved = await db.chapterProgress
        .where({ projectId, chapterId })
        .first()
      if (saved) {
        setTarget(saved.targetWordCount)
        setEditValue(String(saved.targetWordCount))
        setProgress(saved)
      }
    }
    loadProgress()
  }, [projectId, chapterId])

  const percentage = target > 0 ? Math.min(Math.round((currentWordCount / target) * 100), 100) : 0
  const remaining = Math.max(target - currentWordCount, 0)

  // Progress bar color: green -> yellow -> red based on percentage
  const getBarColor = () => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-emerald-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const handleSaveTarget = async () => {
    const newTarget = parseInt(editValue) || defaultTarget
    setTarget(newTarget)
    setIsEditing(false)
    onTargetChange?.(newTarget)

    // Save to DB
    if (progress) {
      await db.chapterProgress.update(progress.id!, {
        targetWordCount: newTarget,
        updatedAt: new Date()
      })
    } else {
      await db.chapterProgress.add({
        projectId,
        chapterId,
        targetWordCount: newTarget,
        updatedAt: new Date()
      })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">
            已完成 <span className="font-semibold text-gray-900">{currentWordCount.toLocaleString()}</span> 字
          </span>
          <span className="text-gray-400">/</span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTarget()}
                className="w-20 px-2 py-0.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleSaveTarget}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditValue(String(target))
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 hover:bg-gray-100 px-1 rounded"
              title="点击修改目标"
            >
              <span className="text-gray-600">
                目标 <span className="font-semibold text-indigo-600">{target.toLocaleString()}</span> 字
              </span>
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {percentage >= 100 && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            ✅ 已完成
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getBarColor()} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{percentage}%</span>
        {remaining > 0 && (
          <span>还差 <span className="font-medium text-gray-700">{remaining.toLocaleString()}</span> 字</span>
        )}
      </div>
    </div>
  )
}
