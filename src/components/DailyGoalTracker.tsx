import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { db } from '../db'

interface Props {
  projectId: number
}

export default function DailyGoalTracker({ projectId }: Props) {
  const {
    dailyGoal, totalWordGoal, todayWordCount, streak,
    setDailyGoal, setTotalWordGoal, updateDailyWordCount, outlineNodes,
    writingStats
  } = useStore()

  const [showToast, setShowToast] = useState(false)
  const [prevTodayWordCount, setPrevTodayWordCount] = useState(todayWordCount)
  const [editingDailyGoal, setEditingDailyGoal] = useState(false)
  const [editingTotalGoal, setEditingTotalGoal] = useState(false)
  const [tempDailyGoal, setTempDailyGoal] = useState(dailyGoal.toString())
  const [tempTotalGoal, setTempTotalGoal] = useState(totalWordGoal.toString())
  const [showMiniStats, setShowMiniStats] = useState(false)
  const [goalConfigs, setGoalConfigs] = useState<{ dailyWordGoal: number; totalWordGoal: number } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Calculate total word count from all outline nodes
  const totalWordCount = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)

  // Calculate book progress
  const bookProgress = totalWordGoal > 0 ? Math.round((totalWordCount / totalWordGoal) * 100) : 0

  // Daily progress
  const dailyProgress = dailyGoal > 0 ? Math.round((todayWordCount / dailyGoal) * 100) : 0
  const dailyProgressClamped = Math.min(dailyProgress, 100)

  // Load goal config from DB
  useEffect(() => {
    const loadConfig = async () => {
      const config = await db.dailyGoalConfigs.where('projectId').equals(projectId).first()
      if (config) {
        setGoalConfigs(config)
        setDailyGoal(config.dailyWordGoal)
        setTotalWordGoal(config.totalWordGoal)
      }
    }
    loadConfig()
  }, [projectId])

  // Save goal config to DB
  const saveGoalConfig = async (daily: number, total: number) => {
    const existing = await db.dailyGoalConfigs.where('projectId').equals(projectId).first()
    const now = new Date()

    if (existing) {
      await db.dailyGoalConfigs.update(existing.id!, {
        dailyWordGoal: daily,
        totalWordGoal: total,
        updatedAt: now
      })
    } else {
      await db.dailyGoalConfigs.add({
        projectId,
        dailyWordGoal: daily,
        totalWordGoal: total,
        reminderEnabled: true,
        reminderInterval: 30,
        createdAt: now,
        updatedAt: now
      })
    }
  }

  // Check if goal was just achieved
  useEffect(() => {
    if (todayWordCount >= dailyGoal && prevTodayWordCount < dailyGoal) {
      setShowToast(true)
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 4000)
    }
    setPrevTodayWordCount(todayWordCount)
  }, [todayWordCount, dailyGoal, prevTodayWordCount])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const handleSaveDailyGoal = () => {
    const goal = parseInt(tempDailyGoal) || 3000
    setDailyGoal(goal)
    setEditingDailyGoal(false)
    saveGoalConfig(goal, totalWordGoal)
  }

  const handleSaveTotalGoal = () => {
    const goal = parseInt(tempTotalGoal) || 100000
    setTotalWordGoal(goal)
    setEditingTotalGoal(false)
    saveGoalConfig(dailyGoal, goal)
  }

  const handleQuickSetGoal = (amount: number) => {
    setDailyGoal(amount)
    setTempDailyGoal(amount.toString())
    setEditingDailyGoal(false)
    saveGoalConfig(amount, totalWordGoal)
  }

  // Calculate this week's stats
  const thisWeekStats = (() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday

    let weekTotal = 0
    let daysWithWriting = 0

    writingStats.forEach(stat => {
      const statDate = new Date(stat.date)
      if (statDate >= startOfWeek && statDate <= today) {
        weekTotal += stat.wordCount
        if (stat.wordCount > 0) daysWithWriting++
      }
    })

    return { weekTotal, daysWithWriting }
  })()

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了，注意休息'
    if (hour < 9) return '早安，创作愉快'
    if (hour < 12) return '上午好，继续加油'
    if (hour < 14) return '中午好，适当休息'
    if (hour < 18) return '下午好，灵感不断'
    if (hour < 22) return '晚上好，静心写作'
    return '夜深了，注意休息'
  }

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Header with greeting */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="font-semibold text-gray-800 mb-1">📚 写作目标</h3>
        <p className="text-sm text-gray-500">{getGreeting()}</p>
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
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button onClick={handleSaveDailyGoal} className="text-green-600 hover:text-green-700 font-medium">✓</button>
              <button onClick={() => setEditingDailyGoal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setTempDailyGoal(dailyGoal.toString()); setEditingDailyGoal(true); }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {dailyGoal.toLocaleString()} 字
            </button>
          )}
        </div>

        {/* Quick set buttons */}
        <div className="flex gap-1 mb-2">
          {[1000, 2000, 3000, 5000].map(amount => (
            <button
              key={amount}
              onClick={() => handleQuickSetGoal(amount)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                dailyGoal === amount
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {amount >= 1000 ? `${amount / 1000}K` : amount}
            </button>
          ))}
        </div>

        {/* Daily Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className={todayWordCount >= dailyGoal ? 'text-green-600 font-medium' : ''}>
              {todayWordCount.toLocaleString()} / {dailyGoal.toLocaleString()}
            </span>
            <span className={dailyProgress >= 100 ? 'text-green-600 font-medium' : ''}>
              {dailyProgress}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${dailyProgress >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
              style={{ width: `${dailyProgressClamped}%` }}
            />
          </div>
        </div>

        {/* Streak Badge */}
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-semibold text-orange-600">连续 {streak} 天</span>
          </div>
        )}

        {todayWordCount >= dailyGoal && (
          <div className="flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 mt-2">
            <span className="text-lg">✅</span>
            <span className="text-sm font-semibold text-green-600">今日目标已达成！</span>
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
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button onClick={handleSaveTotalGoal} className="text-green-600 hover:text-green-700 font-medium">✓</button>
            </div>
          ) : (
            <button
              onClick={() => { setTempTotalGoal(totalWordGoal.toString()); setEditingTotalGoal(true); }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {totalWordGoal.toLocaleString()} 字
            </button>
          )}
        </div>

        {/* Book Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{totalWordCount.toLocaleString()}</span>
            <span>{bookProgress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${bookProgress >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${Math.min(bookProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Week Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">本周进度</span>
          <button
            onClick={() => setShowMiniStats(!showMiniStats)}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {showMiniStats ? '收起' : '详情'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-600">{thisWeekStats.weekTotal.toLocaleString()}</div>
            <div className="text-xs text-gray-500">本周字数</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{thisWeekStats.daysWithWriting}</div>
            <div className="text-xs text-gray-500">写作天数</div>
          </div>
        </div>
      </div>

      {/* Mini Stats (Expandable) */}
      {showMiniStats && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-600 mb-2">详细统计</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">章节数</span>
              <span className="font-medium">{outlineNodes.filter(n => n.type === 'chapter').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">已完成</span>
              <span className="font-medium text-green-600">{outlineNodes.filter(n => n.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">进行中</span>
              <span className="font-medium text-indigo-600">{outlineNodes.filter(n => n.status === 'writing').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">规划中</span>
              <span className="font-medium text-gray-600">{outlineNodes.filter(n => n.status === 'planning').length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary (Always visible) */}
      <div className="p-4 flex-1">
        <h4 className="text-sm font-medium text-gray-600 mb-3">项目概览</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">章节数</span>
            <span className="font-medium">{outlineNodes.filter(n => n.type === 'chapter').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">已完成</span>
            <span className="font-medium text-green-600">{outlineNodes.filter(n => n.status === 'completed').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">进行中</span>
            <span className="font-medium text-indigo-600">{outlineNodes.filter(n => n.status === 'writing').length}</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce z-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold">今日目标达成！</div>
              <div className="text-sm opacity-90">连续 {streak} 天 🔥</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
