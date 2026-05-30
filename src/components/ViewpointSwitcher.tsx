/**
 * ViewpointSwitcher Component
 * Allows switching narrative viewpoint (first person, third limited, third omniscient)
 * Integrates with the WritingEditor toolbar
 */

import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db, ViewpointType, ProjectViewpoint, MaterialCard } from '../db'

interface Props {
  projectId: number
  onViewpointChange?: (viewpoint: ViewpointType, characterId?: number) => void
}

const VIEWPOINT_OPTIONS: { value: ViewpointType; label: string; description: string }[] = [
  { 
    value: 'first_person', 
    label: '第一人称', 
    description: '我' 
  },
  { 
    value: 'third_person_limited', 
    label: '第三人称限知', 
    description: '他/她（限知）' 
  },
  { 
    value: 'third_person_omniscient', 
    label: '第三人称全知', 
    description: '他/她（全知）' 
  }
]

export default function ViewpointSwitcher({ projectId, onViewpointChange }: Props) {
  const { materialCards } = useStore()
  const [currentViewpoint, setCurrentViewpoint] = useState<ViewpointType>('third_person_limited')
  const [currentCharacterId, setCurrentCharacterId] = useState<number | undefined>()
  const [showCharacterSelect, setShowCharacterSelect] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Load viewpoint settings on mount
  useEffect(() => {
    const loadViewpoint = async () => {
      const viewpoint = await db.projectViewpoint
        .where('projectId').equals(projectId)
        .first()
      
      if (viewpoint) {
        setCurrentViewpoint(viewpoint.viewpoint)
        setCurrentCharacterId(viewpoint.currentCharacterId)
      }
    }
    loadViewpoint()
  }, [projectId])

  // Save viewpoint settings
  const saveViewpoint = async (viewpoint: ViewpointType, characterId?: number) => {
    const existing = await db.projectViewpoint
      .where('projectId').equals(projectId)
      .first()

    if (existing) {
      await db.projectViewpoint.update(existing.id!, {
        viewpoint,
        currentCharacterId: characterId
      })
    } else {
      await db.projectViewpoint.add({
        projectId,
        viewpoint,
        currentCharacterId: characterId
      })
    }
  }

  const handleViewpointChange = async (viewpoint: ViewpointType) => {
    setCurrentViewpoint(viewpoint)
    await saveViewpoint(viewpoint, currentCharacterId)
    onViewpointChange?.(viewpoint, currentCharacterId)
    
    if (viewpoint !== 'first_person') {
      setShowCharacterSelect(false)
    }
  }

  const handleCharacterSelect = async (characterId: number) => {
    setCurrentCharacterId(characterId)
    await saveViewpoint(currentViewpoint, characterId)
    onViewpointChange?.(currentViewpoint, characterId)
    setShowCharacterSelect(false)
  }

  // Get character cards
  const characterCards = materialCards.filter(c => c.type === 'character')
  const selectedCharacter = characterCards.find(c => c.id === currentCharacterId)

  const currentOption = VIEWPOINT_OPTIONS.find(o => o.value === currentViewpoint)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
        title="切换叙事视角"
      >
        <span>👁️</span>
        <span>{currentOption?.label}</span>
        {currentViewpoint === 'first_person' && selectedCharacter && (
          <span className="text-xs text-indigo-500">({selectedCharacter.name})</span>
        )}
      </button>

      {showPanel && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPanel(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">叙事视角</h3>
              <div className="space-y-2">
                {VIEWPOINT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleViewpointChange(option.value)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentViewpoint === option.value 
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>

              {/* Character selection for first person */}
              {currentViewpoint === 'first_person' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">第一人称角色</span>
                    <button
                      onClick={() => setShowCharacterSelect(!showCharacterSelect)}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      {selectedCharacter ? '更换' : '选择'}
                    </button>
                  </div>
                  
                  {selectedCharacter ? (
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <span className="text-sm text-indigo-700">{selectedCharacter.name}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">未选择角色</div>
                  )}

                  {showCharacterSelect && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {characterCards.length === 0 ? (
                        <div className="text-xs text-gray-400 py-2">暂无角色素材卡</div>
                      ) : (
                        characterCards.map(card => (
                          <button
                            key={card.id}
                            onClick={() => handleCharacterSelect(card.id!)}
                            className={`w-full text-left p-2 text-sm rounded ${
                              currentCharacterId === card.id 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            {card.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Viewpoint writing tips */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <h4 className="text-xs font-medium text-gray-500 mb-1">写作提示</h4>
              <p className="text-xs text-gray-400">
                {currentViewpoint === 'first_person' && '使用"我"来叙述，注意内心独白的运用'}
                {currentViewpoint === 'third_person_limited' && '跟随主角视角，只能展示主角所知的信息'}
                {currentViewpoint === 'third_person_omniscient' && '全能视角，可以描述任何角色的思想和事件'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
