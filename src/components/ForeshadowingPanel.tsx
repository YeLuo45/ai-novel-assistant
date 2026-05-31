/**
 * 伏笔追踪面板
 * V14 Phase 2: 伏笔追踪系统 UI
 */

import { useState, useEffect } from 'react'
import { memoryManager } from '@/ai/memory/memoryManager'
import type { PlotThread } from '@/ai/memory/types'

interface Props {
  projectId: number
  currentChapterId: number
}

export function ForeshadowingPanel({ projectId, currentChapterId }: Props) {
  const [activeThreads, setActiveThreads] = useState<PlotThread[]>([])
  const [resolvedThreads, setResolvedThreads] = useState<PlotThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadThreads()
  }, [projectId])

  async function loadThreads() {
    setLoading(true)
    try {
      const all = await memoryManager.getAllPlotThreads(projectId)
      setActiveThreads(all.filter(t => t.status === 'active'))
      setResolvedThreads(all.filter(t => t.status === 'resolved').slice(-5)) // 最近5个
    } finally {
      setLoading(false)
    }
  }

  async function resolveThread(threadId: string) {
    await memoryManager.resolvePlotThread(
      projectId,
      threadId,
      currentChapterId,
      `在第${currentChapterId}章回收`
    )
    loadThreads()
  }

  if (loading) {
    return <div className="p-4 text-gray-500">加载中...</div>
  }

  return (
    <div className="foreshadowing-panel border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">🔮 伏笔追踪</h3>
        <span className="text-sm text-gray-500">
          {activeThreads.length} 个活跃
        </span>
      </div>

      {/* 活跃伏笔 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">活跃伏笔</h4>
        {activeThreads.length === 0 ? (
          <p className="text-sm text-gray-400">暂无活跃伏笔</p>
        ) : (
          <div className="space-y-2">
            {activeThreads.map(thread => (
              <div key={thread.id} className="p-2 bg-purple-50 border border-purple-200 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-purple-700">{thread.tag}</span>
                    <p className="text-sm text-gray-600 mt-1">{thread.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      埋设于：第{thread.plantedInChapter}章
                      {thread.relatedCharacters.length > 0 && 
                        ` | 涉及：${thread.relatedCharacters.join(', ')}`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => resolveThread(thread.id)}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    标记回收
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最近回收 */}
      {resolvedThreads.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">最近回收</h4>
          <div className="space-y-1">
            {resolvedThreads.map(thread => (
              <div key={thread.id} className="text-sm text-gray-500 pl-2 border-l-2 border-gray-200">
                <span className="line-through">{thread.tag}</span>
                <span className="text-xs ml-2">第{thread.resolvedInChapter}章</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}