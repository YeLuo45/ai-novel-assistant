import { useState, useEffect, useMemo } from 'react'
import { db, Character, CharacterRelationship, OutlineNode, MaterialCard } from '../db'

interface CharacterAppearance {
  characterId: number
  characterName: string
  appearances: number[]  // chapter IDs
  lastAppearanceChapterIndex: number
  chaptersSinceLastAppearance: number
}

interface Props {
  projectId: number
  outlineNodes: OutlineNode[]
  isOpen: boolean
  onToggle: () => void
}

const WARNING_THRESHOLD = 5  // chapters

export default function CharacterAppearancePanel({
  projectId,
  outlineNodes,
  isOpen,
  onToggle
}: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [appearances, setAppearances] = useState<CharacterAppearance[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterAppearance | null>(null)
  const [activeTab, setActiveTab] = useState<'character' | 'location'>('character')

  // Load characters from material cards
  useEffect(() => {
    const loadCharacters = async () => {
      const cards = await db.materialCards
        .where({ projectId, type: 'character' })
        .toArray()
      
      const chars: Character[] = cards.map(card => ({
        id: String(card.id),
        name: card.fields.name || card.name,
        role: (card.fields.role as Character['role']) || 'supporting',
        personalityTraits: card.fields.personality?.split(',').filter(Boolean) || [],
        goal: card.fields.goal || '',
        relationships: []
      }))
      
      setCharacters(chars)
    }
    if (isOpen) {
      loadCharacters()
    }
  }, [projectId, isOpen])

  // Calculate appearances based on character names in chapter content
  useEffect(() => {
    if (characters.length === 0 || outlineNodes.length === 0) return

    const chapters = outlineNodes
      .filter(n => n.type === 'chapter' && n.content)
      .sort((a, b) => a.order - b.order)

    const appearanceData: CharacterAppearance[] = characters.map(char => {
      const appearances: number[] = []
      let lastAppearanceChapterIndex = -1

      chapters.forEach((chapter, chapterIdx) => {
        const content = chapter.content || ''
        // Simple name matching (could be enhanced with NLP)
        if (content.includes(char.name)) {
          appearances.push(chapter.id!)
          lastAppearanceChapterIndex = chapterIdx
        }
      })

      const chaptersSinceLastAppearance = lastAppearanceChapterIndex >= 0
        ? chapters.length - 1 - lastAppearanceChapterIndex
        : chapters.length

      return {
        characterId: parseInt(char.id),
        characterName: char.name,
        appearances,
        lastAppearanceChapterIndex,
        chaptersSinceLastAppearance
      }
    })

    setAppearances(appearanceData)
  }, [characters, outlineNodes])

  // Location appearances (from material cards of type 'location')
  const [locationAppearances, setLocationAppearances] = useState<Map<string, number[]>>(new Map())
  useEffect(() => {
    const loadLocations = async () => {
      const cards = await db.materialCards
        .where({ projectId, type: 'location' })
        .toArray()
      
      const chapters = outlineNodes
        .filter(n => n.type === 'chapter' && n.content)
        .sort((a, b) => a.order - b.order)

      const locMap = new Map<string, number[]>()
      cards.forEach(card => {
        const locName = card.fields.name || card.name
        const app: number[] = []
        chapters.forEach(chapter => {
          if ((chapter.content || '').includes(locName)) {
            app.push(chapter.id!)
          }
        })
        if (app.length > 0) {
          locMap.set(locName, app)
        }
      })
      setLocationAppearances(locMap)
    }
    if (isOpen && activeTab === 'location') {
      loadLocations()
    }
  }, [projectId, isOpen, activeTab, outlineNodes])

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
      >
        <span>👤</span>
        <span>人物出场</span>
      </button>
    )
  }

  const sortedAppearances = [...appearances].sort(
    (a, b) => b.chaptersSinceLastAppearance - a.chaptersSinceLastAppearance
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">👤 人物出场</span>
          <span className="text-xs text-gray-500">{characters.length} 个角色</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('character')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'character'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          角色 ({characters.length})
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'location'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          场景 ({locationAppearances.size})
        </button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {activeTab === 'character' ? (
          <div className="space-y-2">
            {sortedAppearances.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂无角色数据</p>
            ) : (
              sortedAppearances.map(char => {
                const isWarning = char.chaptersSinceLastAppearance >= WARNING_THRESHOLD
                const isNeverAppeared = char.lastAppearanceChapterIndex === -1

                return (
                  <div
                    key={char.characterId}
                    onClick={() => setSelectedCharacter(char)}
                    className={`p-2 rounded border cursor-pointer transition-colors ${
                      isWarning
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{char.characterName}</span>
                        {isNeverAppeared ? (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                            未出场
                          </span>
                        ) : isWarning ? (
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                            ❌ 已消失 {char.chaptersSinceLastAppearance} 章
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                            ✅ 第 {char.lastAppearanceChapterIndex + 1} 章
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        出场 {char.appearances.length} 次
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {locationAppearances.size === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂无场景数据</p>
            ) : (
              Array.from(locationAppearances.entries()).map(([name, chapters]) => (
                <div
                  key={name}
                  className="p-2 bg-gray-50 border border-gray-200 rounded"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">📍 {name}</span>
                    <span className="text-xs text-gray-500">
                      出场 {chapters.length} 次
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected character detail */}
      {selectedCharacter && activeTab === 'character' && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{selectedCharacter.characterName}</span>
            <button
              onClick={() => setSelectedCharacter(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              收起
            </button>
          </div>
          <div className="text-xs text-gray-600">
            <p>共出场 <span className="font-medium">{selectedCharacter.appearances.length}</span> 次</p>
            <p className="mt-1">出现在章节：</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedCharacter.appearances.map(chapterId => {
                const chapter = outlineNodes.find(n => n.id === chapterId)
                return (
                  <span
                    key={chapterId}
                    className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs"
                  >
                    {chapter?.title || `章节${chapterId}`}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
