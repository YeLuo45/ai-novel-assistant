import { useState } from 'react'
import { useStore } from '../store'
import { MaterialCard } from '../db'
import CharacterAvatar from './CharacterAvatar'

interface Props {
  isOpen: boolean
  onToggle: () => void
}

export function MaterialPanel({ isOpen, onToggle }: Props) {
  const { materialCards, createMaterialCard, updateMaterialCard, deleteMaterialCard, currentProject } = useStore()
  const [activeType, setActiveType] = useState<'all' | 'character' | 'location' | 'item'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialCard | null>(null)
  const [materialForm, setMaterialForm] = useState({
    type: 'character' as 'character' | 'location' | 'item',
    name: '',
    fields: {} as Record<string, string>
  })

  const filteredMaterials = activeType === 'all' 
    ? materialCards 
    : materialCards.filter(m => m.type === activeType)

  const handleAddMaterial = async () => {
    if (!currentProject?.id || !materialForm.name.trim()) return
    await createMaterialCard({
      projectId: currentProject.id,
      type: materialForm.type,
      name: materialForm.name.trim(),
      fields: materialForm.fields
    })
    setShowAddModal(false)
    resetForm()
  }

  const handleUpdateMaterial = async () => {
    if (!editingMaterial?.id || !materialForm.name.trim()) return
    await updateMaterialCard(editingMaterial.id, {
      type: materialForm.type,
      name: materialForm.name.trim(),
      fields: materialForm.fields
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
      fields: material.fields
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setMaterialForm({
      type: 'character',
      name: '',
      fields: {}
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

          {/* 素材列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredMaterials.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">暂无素材</p>
                <p className="text-xs mt-1">点击下方按钮添加</p>
              </div>
            ) : (
              filteredMaterials.map(material => (
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

      {/* 添加/编辑素材弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
