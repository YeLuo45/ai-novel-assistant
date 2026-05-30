import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { MaterialCard } from '../db'

interface Props {
  isOpen: boolean
  onClose: () => void
  onInsert: (text: string) => void
}

export default function MaterialInsertModal({ isOpen, onClose, onInsert }: Props) {
  const { materialCards } = useStore()
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<'all' | 'character' | 'location' | 'item'>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialCard | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const filteredMaterials = materialCards.filter((m: MaterialCard) => {
    const matchesType = activeType === 'all' || m.type === activeType
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleInsert = () => {
    if (selectedMaterial) {
      const insertText = `[[${selectedMaterial.type}:${selectedMaterial.name}]]`
      onInsert(insertText)
      setSelectedMaterial(null)
      setSearch('')
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedMaterial) {
      handleInsert()
    } else if (e.key === 'Escape') {
      onClose()
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">插入素材</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-100">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索素材..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* 类型筛选 */}
        <div className="flex border-b border-gray-200">
          {(['all', 'character', 'location', 'item'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-2 text-sm font-medium ${
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
        <div className="max-h-80 overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">没有找到素材</p>
              <p className="text-xs mt-1">请先在右侧素材库中添加素材</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredMaterials.map((material: MaterialCard) => (
                <div
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${
                    selectedMaterial?.id === material.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(material.type)}`}>
                    {getTypeLabel(material.type)}
                  </span>
                  <span className="font-medium text-gray-800">{material.name}</span>
                  {selectedMaterial?.id === material.id && (
                    <span className="ml-auto text-indigo-600 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 预览和插入 */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {selectedMaterial ? (
                <span className="text-gray-600">
                  将插入: <span className="font-mono text-indigo-600">
                    [[${selectedMaterial.type}:${selectedMaterial.name}]]
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">请选择一个素材</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleInsert}
                disabled={!selectedMaterial}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
