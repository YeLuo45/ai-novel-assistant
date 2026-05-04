import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useStore } from '../store'
import { db } from '../db'

interface Props {
  projectId: number
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6']

export default function WritingStatsDashboard({ projectId }: Props) {
  const { outlineNodes, writingStats, dailyGoal, totalWordGoal, storylines, chapterStorylineLinks } = useStore()
  
  const [last7Days, setLast7Days] = useState<{ date: string; wordCount: number; dayName: string }[]>([])
  const [chapterStats, setChapterStats] = useState<{ title: string; wordCount: number; progress: number }[]>([])
  const [radarData, setRadarData] = useState<{ chapter: string; words: number }[]>([])

  // Calculate total word count
  const totalWordCount = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)

  // Book completion percentage
  const bookCompletion = totalWordGoal > 0 ? Math.round((totalWordCount / totalWordGoal) * 100) : 0

  // Load and calculate stats
  useEffect(() => {
    // Calculate last 7 days data
    const days: { date: string; wordCount: number; dayName: string }[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' })
      
      const dayStat = writingStats.find(s => s.date === dateStr)
      days.push({
        date: dateStr,
        wordCount: dayStat?.wordCount || 0,
        dayName
      })
    }
    setLast7Days(days)

    // Calculate chapter stats
    const chapters = outlineNodes.filter(n => n.type === 'chapter')
    const stats = chapters.map(chapter => {
      const wordCount = chapter.content?.replace(/\s/g, '').length || 0
      const progress = 3000 > 0 ? Math.round((wordCount / 3000) * 100) : 0
      return {
        title: chapter.title || '未命名章节',
        wordCount,
        progress: Math.min(progress, 100)
      }
    })
    setChapterStats(stats)

    // Calculate radar data (top 6 chapters by word count)
    const sortedChapters = [...stats].sort((a, b) => b.wordCount - a.wordCount).slice(0, 6)
    setRadarData(sortedChapters.map(s => ({
      chapter: s.title.length > 8 ? s.title.substring(0, 8) + '...' : s.title,
      words: s.wordCount
    })))

    // Save stats to IndexedDB on unmount
    return () => {
      // Stats are saved via updateDailyWordCount in WritingEditor
    }
  }, [outlineNodes, writingStats, projectId])

  // Donut chart data
  const donutData = [
    { name: '已完成', value: totalWordCount, color: '#10b981' },
    { name: '剩余', value: Math.max(0, totalWordGoal - totalWordCount), color: '#e5e7eb' }
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">写作统计</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">今日字数</div>
            <div className="text-2xl font-bold text-indigo-600">
              {writingStats.length > 0 ? writingStats[writingStats.length - 1].wordCount.toLocaleString() : 0}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">今日目标</div>
            <div className="text-2xl font-bold text-gray-800">{dailyGoal.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">全书字数</div>
            <div className="text-2xl font-bold text-purple-600">{totalWordCount.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">完成进度</div>
            <div className="text-2xl font-bold text-green-600">{bookCompletion}%</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Bar Chart - Last 7 Days */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">近7天写作字数</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()} 字`, '写作字数']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="wordCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart - Book Completion */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">全书完成度</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold text-gray-800">{bookCompletion}%</span>
              <p className="text-sm text-gray-500">全书完成度</p>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Radar Chart - Word Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">章节字数分布</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="chapter" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar name="字数" dataKey="words" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Chapter Details Table */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">章节详情</h3>
            <div className="overflow-y-auto max-h-56">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">章节</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">字数</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">进度</th>
                  </tr>
                </thead>
                <tbody>
                  {chapterStats.map((stat, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="py-2 px-2 text-gray-800 truncate max-w-[150px]">{stat.title}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{stat.wordCount.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500"
                              style={{ width: `${stat.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{stat.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {chapterStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-400">暂无章节数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
