/**
 * 记忆面板
 * V22 Phase 3: 记忆面板组件
 * 
 * 功能：
 * - 角色Tab：显示所有角色记忆，进场次数、一致性评分
 * - 伏笔Tab：显示未回收伏笔
 * - 风格Tab：显示学习到的风格特征
 * - 时间线Tab：显示时间线事件
 */

import { useState, useEffect } from 'react'
import { longTermMemoryManager } from '@/ai/memory/LongTermMemoryManager'
import { consistencyChecker } from '@/ai/memory/consistencyChecker.V22'
import { styleLearner } from '@/ai/memory/StyleLearner'
import type { 
  V22CharacterMemory as CharacterMemory,
  V22PlotMemory as PlotMemory,
  V22StyleMemory as StyleMemory,
  V22TimelineEvent as TimelineEvent,
  Foreshadowing,
  ConsistencyIssue,
} from '@/ai/memory/types'

interface Props {
  projectId: number
  isOpen: boolean
  onClose: () => void
  currentChapter?: number
}

type TabType = 'characters' | 'foreshadowing' | 'style' | 'timeline'

export function MemoryPanel({ projectId, isOpen, onClose, currentChapter = 1 }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('characters')
  const [characters, setCharacters] = useState<CharacterMemory[]>([])
  const [plots, setPlots] = useState<PlotMemory[]>([])
  const [style, setStyle] = useState<StyleMemory | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [unresolvedForeshadowings, setUnresolvedForeshadowings] = useState<Foreshadowing[]>([])
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([])
  const [styleSummary, setStyleSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // 加载数据
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, projectId])

  async function loadData() {
    setIsLoading(true)
    try {
      await longTermMemoryManager.initialize(projectId)
      
      const [chars, plotMems, styleMem, tl, issues, summary] = await Promise.all([
        longTermMemoryManager.getAllCharacterMemories(),
        longTermMemoryManager.getAllPlotMemories(),
        longTermMemoryManager.getStyleMemory(),
        longTermMemoryManager.getTimeline(),
        consistencyChecker.checkAll({ projectId }),
        styleLearner.getStyleSummary(),
      ])

      setCharacters(chars)
      setPlots(plotMems)
      setStyle(styleMem)
      setTimeline(tl)
      setConsistencyIssues([
        ...issues.characterIssues,
        ...issues.relationshipIssues,
        ...issues.plotIssues,
      ])
      setStyleSummary(summary)

      // 收集所有未解决的伏笔
      const unresolved: Foreshadowing[] = []
      for (const plot of plotMems) {
        const plotUnresolved = plot.foreshadowings.filter(f => f.status !== 'resolved')
        unresolved.push(...plotUnresolved)
      }
      unresolved.sort((a, b) => a.chapter - b.chapter)
      setUnresolvedForeshadowings(unresolved)
    } catch (error) {
      console.error('Failed to load memory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取一致性评分颜色
  function getConsistencyColor(score: number): string {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取伏笔状态颜色
  function getForeshadowingStatusColor(status: string): string {
    switch (status) {
      case 'unresolved': return 'bg-blue-100 text-blue-700'
      case 'hinted': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // 获取时间线事件类型颜色
  function getEventTypeColor(type: string): string {
    switch (type) {
      case 'plot': return 'bg-purple-100 text-purple-700'
      case 'character': return 'bg-blue-100 text-blue-700'
      case 'setting': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        style={{ width: '900px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🧠 记忆面板
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'characters' as TabType, label: '👥 角色', count: characters.length },
            { id: 'foreshadowing' as TabType, label: '🔮 伏笔', count: unresolvedForeshadowings.length },
            { id: 'style' as TabType, label: '🎨 风格', count: null },
            { id: 'timeline' as TabType, label: '📅 时间线', count: timeline.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-purple-100' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : (
            <>
              {/* 角色Tab */}
              {activeTab === 'characters' && (
                <div className="space-y-4">
                  {characters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">👥</div>
                      <p>暂无角色记忆</p>
                      <p className="text-sm mt-2">在写作过程中系统会自动学习角色特征</p>
                    </div>
                  ) : (
                    <>
                      {/* 一致性概览 */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">一致性评分</span>
                          <span className={`text-2xl font-bold ${getConsistencyColor(100 - consistencyIssues.length * 5)}`}>
                            {Math.max(0, 100 - consistencyIssues.length * 5)}/100
                          </span>
                        </div>
                        {consistencyIssues.length > 0 && (
                          <p className="text-xs text-red-500 mt-2">
                            ⚠️ 发现 {consistencyIssues.length} 个一致性问题
                          </p>
                        )}
                      </div>

                      {/* 角色列表 */}
                      <div className="grid gap-4">
                        {characters.map(char => (
                          <div key={char.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg">{char.name}</h3>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConsistencyColor(char.consistencyScore)}`}>
                                    一致性: {char.consistencyScore}%
                                  </span>
                                </div>
                                
                                {/* 性格特征 */}
                                {char.personalityTraits.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {char.personalityTraits.slice(0, 5).map((trait, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                        {trait}
                                      </span>
                                    ))}
                                    {char.personalityTraits.length > 5 && (
                                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                                        +{char.personalityTraits.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* 关系 */}
                                <div className="text-sm text-gray-500 mb-2">
                                  关系数: {char.relationships.size}
                                </div>

                                {/* 情感弧 */}
                                <div className="text-sm text-gray-500">
                                  情感变化: {char.emotionalArc.length}次
                                </div>
                              </div>

                              <div className="text-right ml-4">
                                <div className="text-3xl font-bold text-blue-500">
                                  {char.totalAppearances}
                                </div>
                                <div className="text-xs text-gray-500">出场次数</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  第{char.lastAppearance}章/共{char.lastAppearance}章
                                </div>
                              </div>
                            </div>

                            {/* 成长日志摘要 */}
                            {char.growthLog.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-xs text-gray-500 mb-1">最近成长:</div>
                                <div className="text-sm text-gray-700">
                                  {char.growthLog[char.growthLog.length - 1]?.event.slice(0, 50)}
                                  {char.growthLog[char.growthLog.length - 1]?.event.length > 50 && '...'}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 伏笔Tab */}
              {activeTab === 'foreshadowing' && (
                <div className="space-y-4">
                  {unresolvedForeshadowings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">🔮</div>
                      <p>暂无未解决的伏笔</p>
                      <p className="text-sm mt-2">添加伏笔后会在此处显示</p>
                    </div>
                  ) : (
                    <>
                      {/* 伏笔统计 */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {unresolvedForeshadowings.filter(f => f.status === 'unresolved').length}
                          </div>
                          <div className="text-xs text-gray-500">未回收</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {unresolvedForeshadowings.filter(f => f.status === 'hinted').length}
                          </div>
                          <div className="text-xs text-gray-500">已暗示</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {unresolvedForeshadowings.filter(f => f.status === 'resolved').length}
                          </div>
                          <div className="text-xs text-gray-500">已回收</div>
                        </div>
                      </div>

                      {/* 伏笔列表 */}
                      <div className="space-y-3">
                        {unresolvedForeshadowings.map(fs => (
                          <div key={fs.id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getForeshadowingStatusColor(fs.status)}`}>
                                    {fs.status === 'unresolved' ? '未回收' : fs.status === 'hinted' ? '已暗示' : '已回收'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    第{fs.chapter}章
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-2">{fs.hint}</p>
                                {fs.relatedCharacters.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {fs.relatedCharacters.map((char, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-purple-50 rounded text-xs text-purple-600">
                                        {char}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {fs.payoffChapter && (
                                <div className="text-right ml-4">
                                  <div className="text-xs text-gray-500">回收于</div>
                                  <div className="text-sm font-medium text-green-600">
                                    第{fs.payoffChapter}章
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 风格Tab */}
              {activeTab === 'style' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">学习置信度</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {style?.confidence?.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>

                  {style ? (
                    <div className="space-y-6">
                      {/* 句子模式 */}
                      {style.sentencePatterns.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-800 mb-3">📝 常用句式</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {style.sentencePatterns.slice(0, 6).map((p, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-sm text-gray-700">
                                  {p.pattern === 'compound_comma' && '并列句'}
                                  {p.pattern === 'subordinate_clause' && '从句'}
                                  {p.pattern === 'short_sentence' && '短句'}
                                  {p.pattern === 'parallel_structure' && '排比句'}
                                  {p.pattern === 'dialogue_tag' && '对话引导'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  出现 {p.frequency} 次
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 节奏特征 */}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3">⚡ 节奏特征</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">对话比例</span>
                              <span className="text-gray-800">{(style.pacingProfile.dialogueRatio * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${style.pacingProfile.dialogueRatio * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">描写密度</span>
                              <span className="text-gray-800">{(style.pacingProfile.descriptionDensity * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${style.pacingProfile.descriptionDensity * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">动作频率</span>
                              <span className="text-gray-800">{(style.pacingProfile.actionFrequency).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${style.pacingProfile.actionFrequency}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 高频词汇 */}
                      {style.vocabularyPreferences.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-800 mb-3">📚 高频词汇</h3>
                          <div className="flex flex-wrap gap-2">
                            {style.vocabularyPreferences
                              .sort((a, b) => b.frequency - a.frequency)
                              .slice(0, 15)
                              .map((v, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                                  {v.word} <span className="text-gray-400">({v.frequency})</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">🎨</div>
                      <p>尚无风格数据</p>
                      <p className="text-sm mt-2">开始写作后系统将自动学习风格特征</p>
                    </div>
                  )}
                </div>
              )}

              {/* 时间线Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📅</div>
                      <p>暂无时间线事件</p>
                      <p className="text-sm mt-2">时间线事件会在写作过程中自动生成</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* 时间线 */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-4">
                        {timeline.map((event, index) => (
                          <div key={event.id} className="relative flex items-start gap-4">
                            {/* 时间线节点 */}
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${getEventTypeColor(event.type)} shadow`}>
                              {event.type === 'plot' && '📖'}
                              {event.type === 'character' && '👤'}
                              {event.type === 'setting' && '🏠'}
                            </div>
                            
                            {/* 内容 */}
                            <div className="flex-1 bg-white border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                  {event.type === 'plot' && '情节'}
                                  {event.type === 'character' && '角色'}
                                  {event.type === 'setting' && '场景'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  第{event.chapter}章
                                </span>
                              </div>
                              <p className="text-gray-800">{event.description}</p>
                              {event.participants.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {event.participants.map((p, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemoryPanel
