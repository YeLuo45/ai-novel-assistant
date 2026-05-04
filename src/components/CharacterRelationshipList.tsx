/**
 * CharacterRelationshipList Component
 * Displays and manages character relationships visually
 * Shows a relationship diagram/list for the current project
 */

import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { db, CharacterRelationship, MaterialCard } from '../db'
import CharacterAvatar from './CharacterAvatar'

interface Props {
  projectId: number
}

interface RelationshipDisplay {
  id?: number
  fromCharacter: MaterialCard
  toCharacter: MaterialCard
  relationshipType: string
  description: string
}

const RELATIONSHIP_TYPES = [
  { value: 'family', label: '家人', color: '#10b981' },
  { value: 'friend', label: '朋友', color: '#3b82f6' },
  { value: 'enemy', label: '敌人', color: '#ef4444' },
  { value: 'rival', label: '对手', color: '#f97316' },
  { value: 'lover', label: '恋人', color: '#ec4899' },
  { value: 'mentor', label: '导师', color: '#8b5cf6' },
  { value: 'colleague', label: '同事', color: '#6366f1' },
  { value: 'stranger', label: '陌生人', color: '#6b7280' }
]

const getRelationshipStyle = (type: string) => {
  const rel = RELATIONSHIP_TYPES.find(r => r.value === type)
  return {
    color: rel?.color || '#6b7280',
    label: rel?.label || type
  }
}

export default function CharacterRelationshipList({ projectId }: Props) {
  const { materialCards } = useStore()
  const [relationships, setRelationships] = useState<RelationshipDisplay[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'diagram'>('list')

  // New relationship form
  const [newRel, setNewRel] = useState({
    fromCharacterId: '',
    toCharacterId: '',
    relationshipType: 'friend',
    description: ''
  })

  // Load relationships
  const loadRelationships = async () => {
    const rels = await db.characterRelationships
      .where('projectId').equals(projectId)
      .toArray()

    const characterMap = new Map(materialCards.filter(c => c.type === 'character').map(c => [c.id, c]))

    const displayRels: RelationshipDisplay[] = []
    for (const rel of rels) {
      const fromChar = characterMap.get(rel.fromCharacterId)
      const toChar = characterMap.get(rel.toCharacterId)
      if (fromChar && toChar) {
        displayRels.push({
          id: rel.id,
          fromCharacter: fromChar,
          toCharacter: toChar,
          relationshipType: rel.relationshipType,
          description: rel.description
        })
      }
    }
    setRelationships(displayRels)
  }

  useEffect(() => {
    loadRelationships()
  }, [projectId, materialCards])

  const handleAddRelationship = async () => {
    if (!newRel.fromCharacterId || !newRel.toCharacterId) return

    await db.characterRelationships.add({
      projectId,
      fromCharacterId: parseInt(newRel.fromCharacterId),
      toCharacterId: parseInt(newRel.toCharacterId),
      relationshipType: newRel.relationshipType,
      description: newRel.description
    })

    setNewRel({ fromCharacterId: '', toCharacterId: '', relationshipType: 'friend', description: '' })
    setShowAddModal(false)
    loadRelationships()
  }

  const handleDeleteRelationship = async (id: number) => {
    if (confirm('确定要删除这个关系吗？')) {
      await db.characterRelationships.delete(id)
      loadRelationships()
    }
  }

  const characterCards = materialCards.filter(c => c.type === 'character')
  const filteredRelationships = filterType 
    ? relationships.filter(r => r.relationshipType === filterType)
    : relationships

  // Get unique character connections count per character
  const getCharacterConnectionCount = (characterId: number) => {
    return relationships.filter(
      r => r.fromCharacter.id === characterId || r.toCharacter.id === characterId
    ).length
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">角色关系图</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-3 py-1 text-xs rounded ${viewMode === 'diagram' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
            >
              关系图
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterType(null)}
            className={`px-2 py-1 text-xs rounded-full ${!filterType ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            全部
          </button>
          {RELATIONSHIP_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value === filterType ? null : type.value)}
              className={`px-2 py-1 text-xs rounded-full ${filterType === type.value ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
              style={filterType === type.value ? { backgroundColor: type.color } : {}}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredRelationships.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">暂无角色关系</p>
            <p className="text-xs mt-1">点击下方按钮添加第一个角色关系</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredRelationships.map((rel, index) => {
              const style = getRelationshipStyle(rel.relationshipType)
              return (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CharacterAvatar characterId={rel.fromCharacter.id!} size="md" showTooltip />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {rel.fromCharacter.name}
                        </span>
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: style.color }}
                        >
                          {style.label}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {rel.toCharacter.name}
                        </span>
                      </div>
                      {rel.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{rel.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => rel.id && handleDeleteRelationship(rel.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Diagram view - simplified visual representation */
          <div className="relative min-h-[400px]">
            <div className="flex flex-wrap gap-4 justify-center">
              {characterCards.map(char => {
                const connections = getCharacterConnectionCount(char.id!)
                return (
                  <div 
                    key={char.id}
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-xl min-w-[100px]"
                  >
                    <CharacterAvatar characterId={char.id!} size="lg" showTooltip />
                    <div className="mt-2 text-sm font-medium text-gray-700 text-center">{char.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {connections} 个关系
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Relationship lines overlay - simplified */}
            <svg className="absolute inset-0 pointer-events-none opacity-30">
              {filteredRelationships.slice(0, 10).map((rel, i) => {
                // This is a simplified representation
                // In a full implementation, you'd calculate actual positions
                return (
                  <line
                    key={i}
                    x1="20%" y1={`${30 + (i * 10)}%`}
                    x2="80%" y2={`${30 + ((i * 10) % 60)}%`}
                    stroke={getRelationshipStyle(rel.relationshipType).color}
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + 添加角色关系
        </button>
      </div>

      {/* Add Relationship Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">添加角色关系</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色1</label>
                <select
                  value={newRel.fromCharacterId}
                  onChange={e => setNewRel({ ...newRel, fromCharacterId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">选择角色</option>
                  {characterCards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关系类型</label>
                <select
                  value={newRel.relationshipType}
                  onChange={e => setNewRel({ ...newRel, relationshipType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {RELATIONSHIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色2</label>
                <select
                  value={newRel.toCharacterId}
                  onChange={e => setNewRel({ ...newRel, toCharacterId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">选择角色</option>
                  {characterCards.filter(c => c.id !== parseInt(newRel.fromCharacterId)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={newRel.description}
                  onChange={e => setNewRel({ ...newRel, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                  placeholder="描述这段关系..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddRelationship}
                disabled={!newRel.fromCharacterId || !newRel.toCharacterId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
