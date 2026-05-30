import { useMemo } from 'react'
import { useStore } from '../store'

interface Props {
  projectId: number
  days?: number // Number of days to show (default: 365)
}

const DAYS_IN_WEEK = 7
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAYS = ['', '一', '二', '三', '四', '五', '六']

// Color levels for the heatmap (GitHub-style)
const COLOR_LEVELS = [
  { level: 0, color: '#ebedf0', label: '无写作' },
  { level: 1, color: '#9be9a8', label: '1-500字' },
  { level: 2, color: '#40c463', label: '500-1500字' },
  { level: 3, color: '#30a14e', label: '1500-3000字' },
  { level: 4, color: '#216e39', label: '3000+字' },
]

function getColorForWordCount(wordCount: number, dailyGoal: number): string {
  if (wordCount === 0) return COLOR_LEVELS[0].color
  const ratio = wordCount / dailyGoal
  if (ratio < 0.17) return COLOR_LEVELS[1].color
  if (ratio < 0.5) return COLOR_LEVELS[2].color
  if (ratio < 1) return COLOR_LEVELS[3].color
  return COLOR_LEVELS[4].color
}

function getLevelForWordCount(wordCount: number, dailyGoal: number): number {
  if (wordCount === 0) return 0
  const ratio = wordCount / dailyGoal
  if (ratio < 0.17) return 1
  if (ratio < 0.5) return 2
  if (ratio < 1) return 3
  return 4
}

export default function WritingHeatmap({ projectId, days = 365 }: Props) {
  const { writingStats, dailyGoal, streak } = useStore()

  // Generate the heatmap data
  const { grid, months, totalWords, averageWords, longestStreak, goalMetDays } = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days + 1)

    // Create a map of date -> wordCount
    const statsMap = new Map<string, number>()
    writingStats.forEach(stat => {
      statsMap.set(stat.date, stat.wordCount)
    })

    // Generate grid data
    const grid: { date: string; wordCount: number; dayOfWeek: number; week: number }[] = []
    const currentDate = new Date(startDate)

    let week = 0
    let totalWords = 0
    let goalMetDays = 0

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const wordCount = statsMap.get(dateStr) || 0
      const dayOfWeek = currentDate.getDay()

      // Adjust for Monday = 0
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      if (adjustedDayOfWeek === 0 && grid.length > 0) {
        week++
      }

      grid.push({
        date: dateStr,
        wordCount,
        dayOfWeek: adjustedDayOfWeek,
        week
      })

      totalWords += wordCount
      if (wordCount >= dailyGoal) goalMetDays++

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate longest streak
    let currentStreak = 0
    let longestStreak = 0
    const sortedStats = [...writingStats]
      .filter(s => s.wordCount >= dailyGoal)
      .sort((a, b) => b.date.localeCompare(a.date))

    for (let i = 0; i < sortedStats.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const prevDate = new Date(sortedStats[i - 1].date)
        const currDate = new Date(sortedStats[i].date)
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak)
    }

    const averageWords = Math.round(totalWords / days)

    // Generate month labels
    const monthLabels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1
    grid.forEach((cell, index) => {
      const date = new Date(cell.date)
      const month = date.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ month: MONTHS[month], weekIndex: cell.week })
        lastMonth = month
      }
    })

    return {
      grid,
      months: monthLabels,
      totalWords,
      averageWords,
      longestStreak,
      goalMetDays
    }
  }, [writingStats, dailyGoal, days])

  // Calculate weeks for rendering
  const weeks = useMemo(() => {
    const weekMap = new Map<number, typeof grid>()
    grid.forEach(cell => {
      if (!weekMap.has(cell.week)) {
        weekMap.set(cell.week, [])
      }
      weekMap.get(cell.week)!.push(cell)
    })
    return Array.from(weekMap.values())
  }, [grid])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">写作热力图</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">连续 {streak} 天 🔥</span>
          <div className="flex items-center gap-1">
            {COLOR_LEVELS.map((l, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: l.color }}
                  title={l.label}
                />
                {i < COLOR_LEVELS.length - 1 && <span className="text-gray-400">/</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-indigo-600">{totalWords.toLocaleString()}</div>
          <div className="text-xs text-gray-500">总字数</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-green-600">{averageWords}</div>
          <div className="text-xs text-gray-500">日均字数</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-orange-600">{longestStreak}</div>
          <div className="text-xs text-gray-500">最长连续</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-purple-600">{goalMetDays}</div>
          <div className="text-xs text-gray-500">达标天数</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {months.map((m, i) => (
              <div
                key={i}
                className="text-xs text-gray-500"
                style={{
                  marginLeft: i === 0 ? m.weekIndex * 14 : (m.weekIndex - months[i - 1].weekIndex - 1) * 14,
                  width: 14
                }}
              >
                {m.month}
              </div>
            ))}
          </div>

          {/* Grid with weekday labels */}
          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col justify-between mr-1 text-xs text-gray-400">
              {WEEKDAYS.map((day, i) => (
                <div key={i} className="h-3 flex items-center" style={{ minWidth: 16 }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {/* Pad the first week if it doesn't start on Monday */}
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                    const cell = week.find(c => c.dayOfWeek === dayOfWeek)
                    if (cell) {
                      return (
                        <div
                          key={dayOfWeek}
                          className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                          style={{ backgroundColor: getColorForWordCount(cell.wordCount, dailyGoal) }}
                          title={`${cell.date}: ${cell.wordCount.toLocaleString()} 字`}
                        />
                      )
                    }
                    return (
                      <div key={dayOfWeek} className="w-3 h-3" />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>少</span>
        {COLOR_LEVELS.map((l, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: l.color }}
            title={l.label}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
