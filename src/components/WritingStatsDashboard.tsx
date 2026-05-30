import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts'
import { useStore } from '../store'
import { db } from '../db'
import WritingHeatmap from './WritingHeatmap'

interface Props {
  projectId: number
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6']

export default function WritingStatsDashboard({ projectId }: Props) {
  const { outlineNodes, writingStats, dailyGoal, totalWordGoal, storylines, chapterStorylineLinks, materialCards, characterRelationships, streak } = useStore()
  
  const [last7Days, setLast7Days] = useState<{ date: string; wordCount: number; dayName: string }[]>([])
  const [chapterStats, setChapterStats] = useState<{ title: string; wordCount: number; progress: number }[]>([])
  const [radarData, setRadarData] = useState<{ chapter: string; words: number }[]>([])
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'characters' | 'heatmap'>('overview')

  // Character statistics for the new Characters tab
  const [characterStats, setCharacterStats] = useState<{
    totalCharacters: number
    activeCharacters: number
    characterWordCounts: { name: string; wordCount: number }[]
  }>({ totalCharacters: 0, activeCharacters: 0, characterWordCounts: [] })

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

    // Calculate character statistics
    const characterCards = materialCards.filter(c => c.type === 'character')
    const totalChars = characterCards.length
    // Active characters = characters with any relationships or mentioned in recent chapters
    const activeChars = characterCards.filter(c => {
      // Simple heuristic: characters with avatar or detailed fields are "active"
      return c.fields && (c.fields.avatar || Object.keys(c.fields).length > 2)
    }).length
    
    setCharacterStats({
      totalCharacters: totalChars,
      activeCharacters: activeChars,
      characterWordCounts: characterCards.slice(0, 5).map(c => ({
        name: c.name,
        wordCount: 0 // Placeholder - would need content analysis to calculate
      }))
    })

    // Save stats to IndexedDB on unmount
    return () => {
      // Stats are saved via updateDailyWordCount in WritingEditor
    }
  }, [outlineNodes, writingStats, projectId, materialCards])

  // Donut chart data
  const donutData = [
    { name: '已完成', value: totalWordCount, color: '#10b981' },
    { name: '剩余', value: Math.max(0, totalWordGoal - totalWordCount), color: '#e5e7eb' }
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">写作统计</h1>
          
          {/* View Mode Tabs */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              总览
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'detailed' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              详细分析
            </button>
            <button
              onClick={() => setViewMode('characters')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'characters' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              角色统计
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'heatmap' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              热力图
            </button>
          </div>
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <>
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
          </>
        )}

        {/* Detailed Mode */}
        {viewMode === 'detailed' && (
          <>
            {/* Additional detailed statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">连续写作天数</div>
                <div className="text-2xl font-bold text-orange-600">{streak}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">章节总数</div>
                <div className="text-2xl font-bold text-blue-600">{outlineNodes.filter(n => n.type === 'chapter').length}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">已完成章节</div>
                <div className="text-2xl font-bold text-green-600">{outlineNodes.filter(n => n.type === 'chapter' && n.status === 'completed').length}</div>
              </div>
            </div>

            {/* Area Chart for writing trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">30天写作趋势</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} 字`, '写作字数']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Area type="monotone" dataKey="wordCount" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Project structure overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">项目结构</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {outlineNodes.filter(n => n.type === 'volume').length}
                  </div>
                  <div className="text-sm text-gray-500">卷</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {outlineNodes.filter(n => n.type === 'chapter').length}
                  </div>
                  <div className="text-sm text-gray-500">章</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {outlineNodes.filter(n => n.type === 'section').length}
                  </div>
                  <div className="text-sm text-gray-500">节</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {outlineNodes.filter(n => n.type === 'scene').length}
                  </div>
                  <div className="text-sm text-gray-500">场景</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Characters Mode */}
        {viewMode === 'characters' && (
          <>
            {/* Character summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">角色总数</div>
                <div className="text-2xl font-bold text-indigo-600">{characterStats.totalCharacters}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">活跃角色</div>
                <div className="text-2xl font-bold text-green-600">{characterStats.activeCharacters}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">角色关系数</div>
                <div className="text-2xl font-bold text-purple-600">{characterRelationships.length}</div>
              </div>
            </div>

            {/* Character cards list */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">角色列表</h3>
              <div className="grid grid-cols-3 gap-4">
                {materialCards.filter(c => c.type === 'character').map(card => (
                  <div key={card.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: `hsl(${card.name.charCodeAt(0) * 10 % 360}, 70%, 50%)` }}
                      >
                        {card.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{card.name}</div>
                        {card.fields?.role && (
                          <div className="text-xs text-gray-500">{card.fields.role}</div>
                        )}
                      </div>
                    </div>
                    {card.fields?.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{card.fields.description}</p>
                    )}
                  </div>
                ))}
                {materialCards.filter(c => c.type === 'character').length === 0 && (
                  <div className="col-span-3 py-8 text-center text-gray-400">
                    暂无角色素材卡
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Heatmap Mode */}
        {viewMode === 'heatmap' && (
          <WritingHeatmap projectId={projectId} days={365} />
        )}
      </div>
    </div>
  )
}
