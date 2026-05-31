/**
 * FillProjectPage.tsx - V24
 * 细化填充页面：世界观 | 故事线 | 关系图 | 时间线
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, Project, TimelineEvent, Storyline, OutlineNode } from '../db'
import { useStore } from '../store'
import { generateWorldbuilding } from '../ai/fill'
import Timeline from '../components/Timeline'
import RelationshipGraph from '../components/RelationshipGraph'

type TabType = 'worldbuilding' | 'storyline' | 'relationship' | 'timeline'

export default function FillProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = useMemo(() => id ? parseInt(id) : null, [id])
  
  const { currentProject, updateProject, storylines, loadStorylines, createStoryline, deleteStoryline, outlineNodes } = useStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('worldbuilding')
  const [project, setProject] = useState<Project | null>(null)
  const [worldbuilding, setWorldbuilding] = useState('')
  const [isGeneratingWB, setIsGeneratingWB] = useState(false)
  
  // Timeline state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  
  // Storyline editing state
  const [editingStoryline, setEditingStoryline] = useState<number | null>(null)
  const [newStorylineName, setNewStorylineName] = useState('')

  // Load project data
  useEffect(() => {
    if (!projectId) {
      navigate('/projects')
      return
    }
    
    const loadData = async () => {
      const proj = await db.projects.get(projectId)
      if (!proj) {
        navigate('/projects')
        return
      }
      
      setProject(proj)
      setWorldbuilding(proj.worldbuilding || '')
      
      // Load storylines
      loadStorylines(projectId)
      
      // Load outline nodes (chapters)
      const nodes = await db.outlineNodes.where('projectId').equals(projectId).sortBy('order')
      // outlineNodes are already loaded via store
    }
    
    loadData()
  }, [projectId])

  // Get characters from material cards
  const characters = useMemo(() => {
    return outlineNodes
      .filter(n => n.type === 'chapter')
      .map(() => null) // Placeholder - we need to get characters from material cards
  }, [])

  // Get selected version characters
  const versionCharacters = useMemo(async () => {
    if (!projectId) return []
    const version = await db.projectVersions
      .where('projectId').equals(projectId)
      .and(v => v.isSelected)
      .first()
    return version?.characters || []
  }, [projectId])

  // Tab configuration
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'worldbuilding', label: '世界观', icon: '🌍' },
    { key: 'storyline', label: '故事线', icon: '📖' },
    { key: 'relationship', label: '关系图', icon: '👥' },
    { key: 'timeline', label: '时间线', icon: '📅' }
  ]

  // Handle worldbuilding auto-save
  const handleWorldbuildingChange = async (value: string) => {
    setWorldbuilding(value)
    if (projectId) {
      await updateProject(projectId, { worldbuilding: value })
    }
  }

  // Handle AI generate worldbuilding
  const handleAIGenerateWorldbuilding = async () => {
    if (!project) return
    
    setIsGeneratingWB(true)
    try {
      const chars = await versionCharacters
      const generated = await generateWorldbuilding(project, chars)
      setWorldbuilding(generated)
      if (projectId) {
        await updateProject(projectId, { worldbuilding: generated })
      }
    } catch (error) {
      console.error('AI生成世界观失败:', error)
    } finally {
      setIsGeneratingWB(false)
    }
  }

  // Add storyline
  const handleAddStoryline = async () => {
    if (!projectId || !newStorylineName.trim()) return
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']
    const color = colors[storylines.length % colors.length]
    
    await createStoryline({
      projectId,
      name: newStorylineName.trim(),
      color
    })
    
    setNewStorylineName('')
    loadStorylines(projectId)
  }

  // Delete storyline
  const handleDeleteStoryline = async (id: number) => {
    await deleteStoryline(id)
  }

  // Get chapters for storyline
  const getChapterTitles = (storylineId: number) => {
    const links = useStore.getState().chapterStorylineLinks.filter(l => l.storylineId === storylineId)
    return links.map(link => {
      const node = outlineNodes.find(n => n.id === link.chapterId)
      return node?.title || ''
    }).filter(Boolean)
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg-secondary">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="text-indigo-600 hover:text-indigo-800 text-sm mb-1"
              >
                ← 返回项目
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                📝 {project.title} - 细化填充
              </h1>
            </div>
            <button
              onClick={() => navigate(`/projects/${projectId}?tab=worldbuilding`)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              完成填充 →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-center transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mr-2">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* 世界观 Tab */}
            {activeTab === 'worldbuilding' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">🌍 世界观设定</h2>
                    <p className="text-sm text-gray-500">描述故事发生的时代背景、社会环境、世界规则等</p>
                  </div>
                  <button
                    onClick={handleAIGenerateWorldbuilding}
                    disabled={isGeneratingWB}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    {isGeneratingWB ? '🤖 AI生成中...' : '✨ AI生成初稿'}
                  </button>
                </div>
                <textarea
                  value={worldbuilding}
                  onChange={(e) => handleWorldbuildingChange(e.target.value)}
                  placeholder="在这里描述世界观设定...

例如：
- 时代背景：故事发生在什么时代？
- 地理环境：有哪些重要的地点？
- 社会结构：社会是如何组织的？
- 世界规则：有什么特殊的规则或设定？
- 故事氛围：整体是什么风格？"
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-gray-700 leading-relaxed"
                />
                <p className="text-xs text-gray-400 text-right">
                  自动保存中...（输入后自动保存）
                </p>
              </div>
            )}

            {/* 故事线 Tab */}
            {activeTab === 'storyline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">📖 故事线</h2>
                    <p className="text-sm text-gray-500">主线和支线故事的规划</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStorylineName}
                      onChange={(e) => setNewStorylineName(e.target.value)}
                      placeholder="新支线名称..."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStoryline()}
                    />
                    <button
                      onClick={handleAddStoryline}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      + 添加支线
                    </button>
                  </div>
                </div>

                {/* Main storyline (auto from version) */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-bold">主线</span>
                    <span className="font-bold text-gray-800">主线剧情</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    主线故事从版本大纲自动提取，贯穿整个故事的核心冲突与发展
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {outlineNodes.filter(n => n.type === 'chapter').slice(0, 5).map(node => (
                      <span key={node.id} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                        {node.title}
                      </span>
                    ))}
                    {outlineNodes.filter(n => n.type === 'chapter').length > 5 && (
                      <span className="px-2 py-1 text-xs text-gray-400">
                        +{outlineNodes.filter(n => n.type === 'chapter').length - 5} 更多
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub storylines */}
                <div className="space-y-3">
                  {storylines.map(storyline => (
                    <div
                      key={storyline.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                      style={{ borderLeftColor: storyline.color, borderLeftWidth: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-1 text-white rounded text-xs font-bold"
                            style={{ backgroundColor: storyline.color }}
                          >
                            支线
                          </span>
                          <span className="font-medium text-gray-800">{storyline.name}</span>
                        </div>
                        <button
                          onClick={() => storyline.id && handleDeleteStoryline(storyline.id)}
                          className="text-gray-400 hover:text-red-500 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getChapterTitles(storyline.id!).map((title, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            {title}
                          </span>
                        ))}
                        {getChapterTitles(storyline.id!).length === 0 && (
                          <span className="text-xs text-gray-400">暂无关联章节</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {storylines.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📖</div>
                      <p>暂无支线</p>
                      <p className="text-sm">点击"添加支线"创建新的故事线</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 关系图 Tab */}
            {activeTab === 'relationship' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">👥 角色关系图</h2>
                    <p className="text-sm text-gray-500">展示角色之间的关系网络</p>
                  </div>
                </div>
                
                {/* Get characters from version */}
                {(() => {
                  const chars = versionCharacters
                  return (
                    <RelationshipGraph 
                      characters={chars} 
                      compact={false}
                    />
                  )
                })()}
              </div>
            )}

            {/* 时间线 Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">📅 时间线</h2>
                  <p className="text-sm text-gray-500">故事重大事件的时间顺序，可拖拽排序</p>
                </div>
                
                <Timeline
                  projectId={projectId!}
                  events={timelineEvents}
                  onEventsChange={setTimelineEvents}
                  chapters={outlineNodes}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
