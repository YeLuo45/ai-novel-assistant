/**
 * 角色状态面板
 * V14 Phase 3: 角色状态管理 UI
 */

import { useState, useEffect } from 'react'
import { memoryManager } from '@/ai/memory/memoryManager'
import type { CharacterMemory } from '@/ai/memory/types'

interface Props {
  projectId: number
}

export function CharacterStatePanel({ projectId }: Props) {
  const [characters, setCharacters] = useState<Map<string, CharacterMemory>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  async function loadCharacters() {
    setLoading(true)
    try {
      const memory = await memoryManager.getProjectMemory(projectId)
      setCharacters(memory.characters)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">加载中...</div>
  }

  const characterList = Array.from(characters.values())

  return (
    <div className="character-state-panel border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">👥 角色状态</h3>
        <span className="text-sm text-gray-500">
          {characterList.length} 个角色
        </span>
      </div>

      {characterList.length === 0 ? (
        <p className="text-sm text-gray-400">暂无角色数据</p>
      ) : (
        <div className="space-y-3">
          {characterList.map(char => (
            <div key={char.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-blue-700">{char.name}</span>
                {char.arcHistory.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                    {char.arcHistory.length} 次变化
                  </span>
                )}
              </div>
              
              <div className="text-sm">
                <span className="text-gray-500">当前状态：</span>
                <span className="text-gray-800">{char.currentState}</span>
              </div>

              {char.keyEvents.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">关键事件：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {char.keyEvents.slice(0, 3).map((event, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}