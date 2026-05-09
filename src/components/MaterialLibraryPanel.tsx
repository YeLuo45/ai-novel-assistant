import { useState } from 'react'
import type { MaterialType, BaseMaterial, CharacterMaterial, SceneMaterial, PlotMaterial } from '@/ai/materials/types'
import { materialLibrary } from '@/ai/materials/MaterialLibrary'
import { materialContextBuilder } from '@/ai/materials/MaterialContextBuilder'

interface Props {
  onApplyContext: (context: string) => void
}

type TabType = MaterialType | 'all'

export function MaterialLibraryPanel({ onApplyContext }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<BaseMaterial | null>(null)
  
  const getMaterials = () => {
    let materials: BaseMaterial[]
    
    if (activeTab === 'all') {
      materials = materialLibrary.getAll()
    } else {
      materials = materialLibrary.getByType(activeTab)
    }
    
    if (searchQuery) {
      materials = materials.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return materials
  }
  
  const materials = getMaterials()
  const stats = materialLibrary.getStats()
  
  const toggleMaterial = (id: string) => {
    const next = new Set(selectedMaterials)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedMaterials(next)
  }
  
  const applySelected = () => {
    const selected = Array.from(selectedMaterials)
      .map(id => materialLibrary.getById(id))
      .filter(Boolean) as BaseMaterial[]
    
    const characters = selected.filter(m => m.type === 'character') as CharacterMaterial[]
    const scenes = selected.filter(m => m.type === 'scene') as SceneMaterial[]
    const plots = selected.filter(m => m.type === 'plot') as PlotMaterial[]
    
    const context = materialContextBuilder.buildFullContext({ characters, scenes, plots })
    onApplyContext(context)
    setSelectedMaterials(new Set())
  }
  
  const deleteMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定删除此素材？')) {
      materialLibrary.delete(id)
      setSelectedMaterials(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }
  
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: Object.values(stats).reduce((a, b) => a + b, 0) },
    { id: 'character', label: '角色', count: stats.character },
    { id: 'scene', label: '场景', count: stats.scene },
    { id: 'plot', label: '情节', count: stats.plot },
  ]
  
  const getTypeLabel = (type: MaterialType) => {
    switch (type) {
      case 'character': return '角色'
      case 'scene': return '场景'
      case 'plot': return '情节'
      case 'item': return '道具'
      case 'location': return '地点'
      case 'world': return '世界观'
    }
  }
  
  const getTypeColor = (type: MaterialType) => {
    switch (type) {
      case 'character': return 'bg-blue-100 text-blue-700'
      case 'scene': return 'bg-green-100 text-green-700'
      case 'plot': return 'bg-orange-100 text-orange-700'
      case 'item': return 'bg-purple-100 text-purple-700'
      case 'location': return 'bg-teal-100 text-teal-700'
      case 'world': return 'bg-gray-100 text-gray-700'
    }
  }
  
  return (
    <div className="material-library-panel h-full flex flex-col bg-white border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">📚 素材库</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            + 添加素材
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索素材..."
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>
      
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
                ? 'border-purple-500 text-purple-600' 
                : 'border-transparent text-gray-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      
      {/* Material List */}
      <div className="flex-1 overflow-y-auto p-2">
        {materials.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无素材
            <br />
            <button
              onClick={() => setShowAddModal(true)}
              className="text-purple-500 hover:underline text-sm"
            >
              添加第一个素材
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map(m => (
              <div
                key={m.id}
                onClick={() => toggleMaterial(m.id)}
                className={`p-3 border rounded cursor-pointer transition ${
                  selectedMaterials.has(m.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getTypeColor(m.type)}`}>
                        {getTypeLabel(m.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.description}</p>
                    {m.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingMaterial(m)
                      }}
                      className="p-1 text-gray-500 hover:text-blue-500"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => deleteMaterial(m.id, e)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      {selectedMaterials.size > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              已选择 {selectedMaterials.size} 个素材
            </span>
            <button
              onClick={applySelected}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              应用到写作上下文
            </button>
          </div>
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {(showAddModal || editingMaterial) && (
        <MaterialEditModal
          material={editingMaterial}
          onSave={(data) => {
            if (editingMaterial) {
              materialLibrary.update(editingMaterial.id, data)
            } else {
              materialLibrary.add({
                ...data,
                id: `material_${Date.now()}`,
                createdAt: Date.now(),
                updatedAt: Date.now()
              } as BaseMaterial)
            }
            setShowAddModal(false)
            setEditingMaterial(null)
          }}
          onClose={() => {
            setShowAddModal(false)
            setEditingMaterial(null)
          }}
        />
      )}
    </div>
  )
}

interface ModalProps {
  material: BaseMaterial | null
  onSave: (m: Partial<BaseMaterial>) => void
  onClose: () => void
}

function MaterialEditModal({ material, onSave, onClose }: ModalProps) {
  const [type, setType] = useState<MaterialType>(material?.type || 'character')
  const [name, setName] = useState(material?.name || '')
  const [description, setDescription] = useState(material?.description || '')
  const [tags, setTags] = useState(material?.tags.join(', ') || '')
  const [backstory, setBackstory] = useState(
    (material as any)?.metadata?.backstory || ''
  )
  
  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入素材名称')
      return
    }
    
    const metadata: Record<string, any> = {}
    
    if (type === 'character' && backstory) {
      metadata.backstory = backstory
      metadata.personality = []
      metadata.strengths = []
      metadata.weaknesses = []
      metadata.goals = []
      metadata.fears = []
      metadata.relationships = []
    }
    
    onSave({
      type,
      name: name.trim(),
      description: description.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      metadata
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">{material ? '编辑素材' : '添加素材'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MaterialType)}
              disabled={!!material}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="character">角色</option>
              <option value="scene">场景</option>
              <option value="plot">情节</option>
              <option value="item">道具</option>
              <option value="location">地点</option>
              <option value="world">世界观</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="素材名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded h-20"
              placeholder="简要描述"
            />
          </div>
          
          {type === 'character' && (
            <div>
              <label className="block text-sm font-medium mb-1">背景故事</label>
              <textarea
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                className="w-full px-3 py-2 border rounded h-32"
                placeholder="角色的背景故事..."
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="标签1, 标签2, 标签3"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">取消</button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
