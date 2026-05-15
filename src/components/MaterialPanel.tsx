import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { MaterialCard, MaterialTag, db } from '../db'
import { ImportModal } from './ImportModal'
import { TagManagerModal } from './TagManagerModal'
import { AIGenerateModal } from './AIGenerateModal'
import CharacterAvatar from './CharacterAvatar'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export function MaterialPanel({ isOpen, onToggle }: Props) {
  const { materialCards, createMaterialCard, updateMaterialCard, deleteMaterialCard, currentProject, loadMaterialCards } = useStore()
  const [activeType, setActiveType] = useState<'all' | 'character' | 'location' | 'item'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialCard | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)
  const [showAIGenerate, setShowAIGenerate] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<MaterialTag[]>([])
  const [materialForm, setMaterialForm] = useState({
    type: 'character' as 'character' | 'location' | 'item',
    name: '',
    fields: {} as Record<string, string>,
    tags: [] as string[]
  })

  useEffect(() => {
    loadTags()
  }, [currentProject?.id])

  const loadTags = async () => {
    if (!currentProject?.id) return
    const tags = await db.materialTags.where('projectId').equals(currentProject.id).toArray()
    setAvailableTags(tags)
  }

  const filteredMaterials = activeType === 'all'
    ? materialCards
    : materialCards.filter(m => m.type === activeType)

  // Apply tag filter
  const tagFilteredMaterials = filterTag
    ? filteredMaterials.filter(m => m.tags && m.tags.includes(filterTag))
    : filteredMaterials

  const handleAddMaterial = async () => {
    if (!currentProject?.id || !materialForm.name.trim()) return
    await createMaterialCard({
      projectId: currentProject.id,
      type: materialForm.type,
      name: materialForm.name.trim(),
      fields: materialForm.fields,
      tags: materialForm.tags
    })
    setShowAddModal(false)
    resetForm()
  }

  const handleUpdateMaterial = async () => {
    if (!editingMaterial?.id || !materialForm.name.trim()) return
    await updateMaterialCard(editingMaterial.id, {
      type: materialForm.type,
      name: materialForm.name.trim(),
      fields: materialForm.fields,
      tags: materialForm.tags
    })
    setEditingMaterial(null)
    setShowAddModal(false)
    resetForm()
  }

  const handleDeleteMaterial = async (id: number) => {
    if (confirm('确定要删除这个素材吗？')) {
      await deleteMaterialCard(id)
    }
  }

  const openEditModal = (material: MaterialCard) => {
    setEditingMaterial(material)
    setMaterialForm({
      type: material.type,
      name: material.name,
      fields: material.fields,
      tags: material.tags || []
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setMaterialForm({
      type: 'character',
      name: '',
      fields: {},
      tags: []
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'character': return '角色'
      case 'location': return '地点'
      case 'item': return '物品'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character': return 'bg-blue-100 text-blue-700'
      case 'location': return 'bg-green-100 text-green-700'
      case 'item': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTagName = (tagId: string) => {
    const tag = availableTags.find(t => String(t.id) === tagId)
    return tag?.name || tagId
  }

  const getTagColor = (tagId: string) => {
    const tag = availableTags.find(t => String(t.id) === tagId)
    return tag?.color || '#gray'
  }

  return (
    <>
      {/* 切换按钮 */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-16 transform transition-all duration-300 z-40`}
        style={{ right: isOpen ? '320px' : '0' }}
      >
        <div className="bg-indigo-600 text-white px-2 py-8 rounded-l-lg shadow-lg">
          <span className="writing-mode-vertical text-sm font-medium">
            {isOpen ? '素材库' : '素材库 »'}
          </span>
        </div>
      </button>

      {/* 面板 */}
      <div 
        className={`fixed right-0 top-16 h-[calc(100vh-64px)] bg-white border-l border-gray-200 transform transition-all duration-300 z-30 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="flex flex-col h-full">
          {/* 标题栏 */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">素材库</h3>
            {/* 操作按钮组 */}
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                onClick={() => { setShowAddModal(true); setEditingMaterial(null); resetForm(); }}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded hover:bg-indigo-200"
              >
                + 添加
              </button>
              <button
                onClick={() => setShowAIGenerate(true)}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200"
              >
                🎨 AI生成
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
              >
                导入
              </button>
              <button
                onClick={() => setShowTagManager(true)}
                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200"
              >
                🏷️ 标签
              </button>
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex border-b border-gray-200">
            {(['all', 'character', 'location', 'item'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-1 py-2 text-xs font-medium ${
                  activeType === type
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                {type === 'all' ? '全部' : getTypeLabel(type)}
              </button>
            ))}
          </div>

          {/* 标签筛选 (V30) */}
          {availableTags.length > 0 && (
            <div className="flex border-b border-gray-200 px-2 py-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                  !filterTag ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                全部
              </button>
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTag(String(tag.id))}
                  className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ml-1 ${
                    filterTag === String(tag.id) ? 'ring-1 ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor: (filterTag === String(tag.id) ? tag.color : tag.color + '20'),
                    color: (filterTag === String(tag.id) ? 'white' : tag.color),
                    ringColor: tag.color
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* 素材列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tagFilteredMaterials.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">暂无素材</p>
                <p className="text-xs mt-1">点击下方按钮添加</p>
              </div>
            ) : (
              tagFilteredMaterials.map(material => (
                <div 
                  key={material.id} 
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {material.type === 'character' && material.id ? (
                        <CharacterAvatar characterId={material.id} size="sm" showTooltip />
                      ) : (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(material.type)}`}>
                          {getTypeLabel(material.type)}
                        </span>
                      )}
                      <span className="font-medium text-gray-800 truncate">{material.name}</span>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(material)}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="编辑"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => material.id && handleDeleteMaterial(material.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* 标签展示 (V30) */}
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {material.tags.slice(0, 3).map(tagId => (
                        <span
                          key={tagId}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{ backgroundColor: getTagColor(tagId) + '20', color: getTagColor(tagId) }}
                        >
                          {getTagName(tagId)}
                        </span>
                      ))}
                      {material.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                          +{material.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 添加按钮 */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => { setShowAddModal(true); setEditingMaterial(null); resetForm(); }}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              + 添加素材
            </button>
          </div>
        </div>
      </div>

      {/* 导入弹窗 (V30) */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          loadTags()
          setShowImportModal(false)
        }}
      />

      {/* 标签管理弹窗 (V30) */}
      <TagManagerModal
        isOpen={showTagManager}
        onClose={() => {
          setShowTagManager(false)
          loadTags()
        }}
      />

      {/* AI生成弹窗 (V30) */}
      <AIGenerateModal
        isOpen={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        onGenerated={() => {
          setShowAIGenerate(false)
        }}
      />

      {/* 添加/编辑素材弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingMaterial ? '编辑素材' : '添加素材'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={materialForm.type}
                  onChange={e => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="character">角色</option>
                  <option value="location">地点</option>
                  <option value="item">物品</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="素材名称"
                  autoFocus
                />
              </div>
              {/* 标签选择 (V30) */}
              {availableTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const tagId = String(tag.id)
                          if (materialForm.tags.includes(tagId)) {
                            setMaterialForm({
                              ...materialForm,
                              tags: materialForm.tags.filter(t => t !== tagId)
                            })
                          } else {
                            setMaterialForm({
                              ...materialForm,
                              tags: [...materialForm.tags, tagId]
                            })
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-xs transition ${
                          materialForm.tags.includes(String(tag.id))
                            ? 'ring-2 ring-offset-1'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: materialForm.tags.includes(String(tag.id)) ? tag.color : tag.color + '20',
                          color: materialForm.tags.includes(String(tag.id)) ? 'white' : tag.color,
                          ringColor: tag.color
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setEditingMaterial(null); resetForm(); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  )
}
