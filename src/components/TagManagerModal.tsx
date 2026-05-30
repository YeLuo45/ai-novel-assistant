import { useState, useEffect } from 'react'
import { db, MaterialTag } from '../db'
import { useStore } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF4500'
]

export function TagManagerModal({ isOpen, onClose }: Props) {
  const { currentProject, loadMaterialCards } = useStore()
  const [tags, setTags] = useState<MaterialTag[]>([])
  const [editingTag, setEditingTag] = useState<MaterialTag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen && currentProject?.id) {
      loadTags()
    }
  }, [isOpen, currentProject?.id])

  const loadTags = async () => {
    if (!currentProject?.id) return
    const projectTags = await db.materialTags.where('projectId').equals(currentProject.id).toArray()
    setTags(projectTags)
  }

  const handleCreateTag = async () => {
    if (!currentProject?.id || !newTagName.trim()) return

    const existing = tags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())
    if (existing) {
      alert('标签已存在')
      return
    }

    const newTag: Omit<MaterialTag, 'id'> = {
      projectId: currentProject.id,
      name: newTagName.trim(),
      color: newTagColor
    }

    const id = await db.materialTags.add(newTag)
    setTags([...tags, { ...newTag, id: id as number }])
    setNewTagName('')
    setIsCreating(false)
  }

  const handleUpdateTag = async () => {
    if (!editingTag?.id || !editingTag.name.trim()) return

    await db.materialTags.update(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color
    })

    setTags(tags.map(t => t.id === editingTag.id ? editingTag : t))
    setEditingTag(null)
  }

  const handleDeleteTag = async (id: number) => {
    if (!confirm('确定删除此标签？素材中的该标签引用也会被移除。')) return

    await db.materialTags.delete(id)

    // 从所有素材中移除该标签
    const allCards = await db.materialCards.where('projectId').equals(currentProject!.id).toArray()
    for (const card of allCards) {
      if (card.tags && card.tags.includes(String(id))) {
        await db.materialCards.update(card.id!, {
          tags: card.tags.filter(t => t !== String(id))
        })
      }
    }

    setTags(tags.filter(t => t.id !== id))
    await loadMaterialCards(currentProject!.id)
  }

  const handleClose = () => {
    setTags([])
    setEditingTag(null)
    setNewTagName('')
    setIsCreating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">标签管理</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Tag List */}
          <div className="space-y-2 mb-4">
            {tags.length === 0 && !isCreating && (
              <p className="text-center text-gray-500 py-4">暂无标签，点击下方按钮创建</p>
            )}
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                {editingTag?.id === tag.id ? (
                  // Editing mode
                  <>
                    <input
                      type="color"
                      value={editingTag.color}
                      onChange={e => setEditingTag({ ...editingTag, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingTag.name}
                      onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateTag}
                      className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingTag(null)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  // View mode
                  <>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1">{tag.name}</span>
                    <button
                      onClick={() => setEditingTag({ ...tag })}
                      className="px-2 py-1 text-blue-500 text-sm hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => tag.id && handleDeleteTag(tag.id)}
                      className="px-2 py-1 text-red-500 text-sm hover:underline"
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create New Tag */}
          {isCreating ? (
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium mb-2">创建新标签</h4>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={e => setNewTagColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1 px-2 py-1 border rounded"
                  autoFocus
                />
              </div>
              {/* Color presets */}
              <div className="flex flex-wrap gap-1 mb-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-6 h-6 rounded ${newTagColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTag}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  创建
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewTagName('') }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500"
            >
              + 创建新标签
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
