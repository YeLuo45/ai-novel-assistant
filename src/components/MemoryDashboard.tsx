/**
 * 记忆仪表盘
 * V14 Phase 6: 综合记忆面板
 */

import { useState, useEffect } from 'react'
import { memoryManager } from '@/ai/memory/memoryManager'
import { ForeshadowingPanel } from './ForeshadowingPanel'
import { CharacterStatePanel } from './CharacterStatePanel'

interface Props {
  projectId: number
}

export function MemoryDashboard({ projectId }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'foreshadowing'>('overview')
  const [stats, setStats] = useState({
    characterCount: 0,
    activeThreadCount: 0,
    resolvedThreadCount: 0,
    chapterCount: 0
  })

  useEffect(() => {
    loadStats()
  }, [projectId])

  async function loadStats() {
    const memory = await memoryManager.getProjectMemory(projectId)
    const allThreads = await memoryManager.getAllPlotThreads(projectId)
    const summaries = await memoryManager.getRecentChapterSummaries(projectId, 100)
    
    setStats({
      characterCount: memory.characters.size,
      activeThreadCount: allThreads.filter(t => t.status === 'active').length,
      resolvedThreadCount: allThreads.filter(t => t.status === 'resolved').length,
      chapterCount: summaries.length
    })
  }

  return (
    <div className="memory-dashboard border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">🧠 记忆仪表盘</h3>
        <button 
          onClick={() => {
            memoryManager.invalidateCache(projectId)
            loadStats()
          }}
          className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          刷新
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{stats.characterCount}</div>
          <div className="text-xs text-gray-500">角色</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="text-2xl font-bold text-purple-600">{stats.activeThreadCount}</div>
          <div className="text-xs text-gray-500">活跃伏笔</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{stats.resolvedThreadCount}</div>
          <div className="text-xs text-gray-500">已回收</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="text-2xl font-bold text-orange-600">{stats.chapterCount}</div>
          <div className="text-xs text-gray-500">章节</div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b mb-4">
        {(['overview', 'characters', 'foreshadowing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm ${
              activeTab === tab 
                ? 'border-b-2 border-purple-500 text-purple-600' 
                : 'text-gray-500'
            }`}
          >
            {tab === 'overview' && '📊 概览'}
            {tab === 'characters' && '👥 角色'}
            {tab === 'foreshadowing' && '🔮 伏笔'}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="text-sm text-gray-600">
            <p>项目已积累 {stats.chapterCount} 章的记忆数据。</p>
            <p className="mt-2">当前有 {stats.activeThreadCount} 个活跃伏笔等待回收。</p>
          </div>
        )}
        {activeTab === 'characters' && (
          <CharacterStatePanel projectId={projectId} />
        )}
        {activeTab === 'foreshadowing' && (
          <ForeshadowingPanel projectId={projectId} currentChapterId={1} />
        )}
      </div>
    </div>
  )
}
