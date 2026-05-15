import { useState, useEffect } from 'react'
import { MaterialCard, MaterialCardType } from '../db'
import { callLLM } from '../ai/llm'

interface MaterialCardFormProps {
  card?: MaterialCard | null
  type: MaterialCardType
  onSave: (data: Omit<MaterialCard, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const defaultFields = {
  character: { 姓名: '', 性别: '', 年龄: '', 身份: '' },
  location: { 名称: '', 类型: '' },
  item: { 名称: '', 类型: '' }
}

export function MaterialCardForm({ card, type, onSave, onCancel }: MaterialCardFormProps) {
  const [name, setName] = useState(card?.name || '')
  const [avatar, setAvatar] = useState(card?.avatar || '')
  const [fields, setFields] = useState<Record<string, string>>(card?.fields || defaultFields[type])
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)

  useEffect(() => {
    if (!card) {
      setFields(defaultFields[type])
    }
  }, [type, card])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ type, name: name.trim(), avatar: avatar || undefined, fields })
  }

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerateAvatar = async () => {
    if (!name.trim()) {
      alert('请先输入角色名称')
      return
    }
    setIsGeneratingAvatar(true)
    try {
      const prompt = `为 "${name}" 这个角色创作一个简洁的头像描述（50字以内），用于AI绘图生成头像。描述应该体现角色的外貌特征和性格。`
      const result = await callLLM('MiniMax-M2.7', [
        { role: 'user' as const, content: prompt }
      ])
      // 生成的头像使用占位图服务
      const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}`
      setAvatar(avatarUrl)
    } catch (error) {
      console.error('生成头像失败:', error)
    } finally {
      setIsGeneratingAvatar(false)
    }
  }

  const fieldLabels = {
    character: ['姓名', '性别', '年龄', '身份'],
    location: ['名称', '类型'],
    item: ['名称', '类型']
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          名称
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`输入${type === 'character' ? '人物' : type === 'location' ? '地点' : '物品'}名称`}
          required
        />
      </div>

      {/* 角色头像 (V29) */}
      {type === 'character' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            头像
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="输入头像URL或点击AI生成"
            />
            <button
              type="button"
              onClick={handleGenerateAvatar}
              disabled={isGeneratingAvatar}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {isGeneratingAvatar ? '生成中...' : '🎨 AI生成'}
            </button>
          </div>
          {avatar && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={avatar}
                alt="头像预览"
                className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover bg-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                移除头像
              </button>
            </div>
          )}
        </div>
      )}

      {fieldLabels[type].map(key => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {key}
          </label>
          <input
            type="text"
            value={fields[key] || ''}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`输入${key}`}
          />
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {card ? '保存' : '创建'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}
