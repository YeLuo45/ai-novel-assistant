import { useState, useEffect } from 'react'
import { useStore } from '../store'

interface Props {
  projectId: number
}

export default function WordGoalTracker({ projectId }: Props) {
  const { 
    dailyGoal, totalWordGoal, todayWordCount, streak, 
    setDailyGoal, setTotalWordGoal, updateDailyWordCount, outlineNodes 
  } = useStore()
  
  const [showToast, setShowToast] = useState(false)
  const [prevTodayWordCount, setPrevTodayWordCount] = useState(todayWordCount)
  const [editingDailyGoal, setEditingDailyGoal] = useState(false)
  const [editingTotalGoal, setEditingTotalGoal] = useState(false)
  const [tempDailyGoal, setTempDailyGoal] = useState(dailyGoal.toString())
  const [tempTotalGoal, setTempTotalGoal] = useState(totalWordGoal.toString())

  // Calculate total word count from all outline nodes
  const totalWordCount = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)

  // Calculate book progress
  const bookProgress = totalWordGoal > 0 ? Math.round((totalWordCount / totalWordGoal) * 100) : 0
  
  // Daily progress
  const dailyProgress = dailyGoal > 0 ? Math.round((todayWordCount / dailyGoal) * 100) : 0
  const dailyProgressClamped = Math.min(dailyProgress, 100)

  // Check if goal was just achieved
  useEffect(() => {
    if (todayWordCount >= dailyGoal && prevTodayWordCount < dailyGoal) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
    setPrevTodayWordCount(todayWordCount)
  }, [todayWordCount, dailyGoal, prevTodayWordCount])

  const handleSaveDailyGoal = () => {
    const goal = parseInt(tempDailyGoal) || DEFAULT_DAILY_GOAL
    setDailyGoal(goal)
    setEditingDailyGoal(false)
  }

  const handleSaveTotalGoal = () => {
    const goal = parseInt(tempTotalGoal) || DEFAULT_TOTAL_WORD_GOAL
    setTotalWordGoal(goal)
    setEditingTotalGoal(false)
  }

  const DEFAULT_DAILY_GOAL = 3000
  const DEFAULT_TOTAL_WORD_GOAL = 100000

  return (
    <div className="bg-white border-l border-gray-200 w-72 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">写作目标</h3>
      </div>

      {/* Daily Goal Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">今日目标</span>
          {editingDailyGoal ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempDailyGoal}
                onChange={(e) => setTempDailyGoal(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button onClick={handleSaveDailyGoal} className="text-green-600 text-sm">✓</button>
            </div>
          ) : (
            <button 
              onClick={() => { setTempDailyGoal(dailyGoal.toString()); setEditingDailyGoal(true); }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {dailyGoal.toLocaleString()} 字
            </button>
          )}
        </div>
        
        {/* Daily Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{todayWordCount.toLocaleString()} / {dailyGoal.toLocaleString()}</span>
            <span>{dailyProgress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${dailyProgress >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${dailyProgressClamped}%` }}
            />
          </div>
        </div>

        {/* Streak Badge */}
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1 py-2 bg-orange-50 rounded-lg">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm font-medium text-orange-600">连续 {streak} 天</span>
          </div>
        )}
      </div>

      {/* Book Goal Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">全书目标</span>
          {editingTotalGoal ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempTotalGoal}
                onChange={(e) => setTempTotalGoal(e.target.value)}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button onClick={handleSaveTotalGoal} className="text-green-600 text-sm">✓</button>
            </div>
          ) : (
            <button 
              onClick={() => { setTempTotalGoal(totalWordGoal.toString()); setEditingTotalGoal(true); }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {totalWordGoal.toLocaleString()} 字
            </button>
          )}
        </div>

        {/* Book Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{totalWordCount.toLocaleString()} / {totalWordGoal.toLocaleString()}</span>
            <span>{bookProgress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${bookProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min(bookProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-4 flex-1">
        <h4 className="text-sm font-medium text-gray-600 mb-3">统计概览</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">章节数</span>
            <span className="font-medium">{outlineNodes.filter(n => n.type === 'chapter').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">已完成</span>
            <span className="font-medium">{outlineNodes.filter(n => n.status === 'completed').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">进行中</span>
            <span className="font-medium">{outlineNodes.filter(n => n.status === 'writing').length}</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse z-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <span className="font-medium">今日目标达成！</span>
          </div>
        </div>
      )}
    </div>
  )
}
