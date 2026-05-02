import { useState, useEffect } from 'react'
import { MaterialCard, MaterialCardType } from '../db'

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
  const [fields, setFields] = useState<Record<string, string>>(card?.fields || defaultFields[type])

  useEffect(() => {
    if (!card) {
      setFields(defaultFields[type])
    }
  }, [type, card])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ type, name: name.trim(), fields })
  }

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
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
