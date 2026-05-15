import { useState } from 'react'
import { callLLM } from '../ai/llm'
import { useStore } from '../store'
import type { MaterialCard } from '../db'

interface Props {
  isOpen: boolean
  onClose: () => void
  onGenerated: () => void
}

type MaterialType = 'character' | 'location' | 'item'

interface GeneratedMaterial {
  type: MaterialType
  name: string
  fields: Record<string, string>
}

export function AIGenerateModal({ isOpen, onClose, onGenerated }: Props) {
  const { currentProject, createMaterialCard, loadMaterialCards } = useStore()
  const [materialType, setMaterialType] = useState<MaterialType>('character')
  const [count, setCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterial[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(new Set())
  const [savedCount, setSavedCount] = useState(0)

  const fieldLabels = {
    character: ['姓名', '性别', '年龄', '身份', '性格', '外貌'],
    location: ['名称', '类型', '时代', '氛围', '特色'],
    item: ['名称', '类型', '材质', '来历', '特殊能力']
  }

  const handleGenerate = async () => {
    if (!currentProject?.id) return

    setIsGenerating(true)
    setGeneratedMaterials([])
    setSavedCount(0)

    try {
      // 构建prompt
      const genre = currentProject.genre || '通用'
      const typeLabel = materialType === 'character' ? '角色' : materialType === 'location' ? '地点' : '物品'

      const prompt = `你是一个创意写作助手。请为一部${genre}题材的小说生成${count}个独特的${typeLabel}素材。

要求：
1. 每个${typeLabel}需要有完整的设定，包括：
   - 名称
   - ${materialType === 'character' ? '性别、年龄、身份、性格、外貌特征' : materialType === 'location' ? '类型、时代背景、氛围、特色' : '类型、材质、来历、特殊能力'}
2. ${typeLabel}设定要有创意性，避免俗套
3. 符合${genre}题材的风格

请以JSON数组格式输出，每个元素包含：
- name: 名称
- fields: 对象，包含所有字段

只输出JSON，不要其他文字。`

      const result = await callLLM('MiniMax-M2.7', [
        { role: 'user' as const, content: prompt }
      ])

      // 解析结果
      let jsonStr = result.trim()
      // 尝试提取JSON
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const materials = JSON.parse(jsonStr) as GeneratedMaterial[]
      setGeneratedMaterials(materials)
      setSelectedMaterials(new Set(materials.map((_, i) => i)))
    } catch (err) {
      console.error('生成失败:', err)
      alert('生成失败: ' + err)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMaterial = (idx: number) => {
    const next = new Set(selectedMaterials)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
    }
    setSelectedMaterials(next)
  }

  const handleSaveSelected = async () => {
    if (!currentProject?.id) return

    let saved = 0
    for (const idx of selectedMaterials) {
      const mat = generatedMaterials[idx]
      try {
        await createMaterialCard({
          projectId: currentProject.id,
          type: mat.type,
          name: mat.name,
          fields: mat.fields,
          tags: []
        })
        saved++
      } catch (err) {
        console.error(`保存 "${mat.name}" 失败:`, err)
      }
    }

    setSavedCount(saved)
    await loadMaterialCards(currentProject.id)
    onGenerated()
  }

  const handleClose = () => {
    setGeneratedMaterials([])
    setSelectedMaterials(new Set())
    setSavedCount(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">🎨 AI生成素材</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Generation Settings */}
          {generatedMaterials.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">素材类型</label>
                <div className="flex gap-2">
                  {(['character', 'location', 'item'] as MaterialType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setMaterialType(type)}
                      className={`px-4 py-2 rounded ${
                        materialType === type
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {type === 'character' ? '👤 角色' : type === 'location' ? '🏠 地点' : '📦 物品'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">生成数量</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`px-4 py-2 rounded ${
                        count === n
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {n}个
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
                <p>将基于项目「{currentProject?.title || '未命名'}」的类型设置生成素材。</p>
              </div>
            </div>
          )}

          {/* Generated Preview */}
          {generatedMaterials.length > 0 && (
            <div className="space-y-4">
              {savedCount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700">
                  已保存 {savedCount} 个素材到素材库
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedMaterials.map((mat, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleMaterial(idx)}
                    className={`p-3 border rounded cursor-pointer transition ${
                      selectedMaterials.has(idx)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.has(idx)}
                        onChange={() => toggleMaterial(idx)}
                        className="w-4 h-4"
                      />
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        mat.type === 'character' ? 'bg-blue-100 text-blue-700' :
                        mat.type === 'location' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {mat.type === 'character' ? '角色' : mat.type === 'location' ? '地点' : '物品'}
                      </span>
                      <span className="font-medium">{mat.name}</span>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-1 text-sm">
                      {Object.entries(mat.fields).map(([key, value]) => (
                        <p key={key} className="text-gray-600">
                          <span className="text-gray-400">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          {generatedMaterials.length === 0 ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isGenerating ? '生成中...' : '🎨 开始生成'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setGeneratedMaterials([]); setSelectedMaterials(new Set()) }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                重新生成
              </button>
              <button
                onClick={handleSaveSelected}
                disabled={selectedMaterials.size === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                保存选中 ({selectedMaterials.size})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
