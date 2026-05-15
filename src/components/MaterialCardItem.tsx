import { useState, useEffect } from 'react'
import { MaterialCard, db, MaterialTag } from '../db'

interface MaterialCardItemProps {
  card: MaterialCard
  onEdit: (card: MaterialCard) => void
  onDelete: (id: number) => void
}

const typeLabels = {
  character: '人物',
  location: '地点',
  item: '物品'
}

const MAX_VISIBLE_TAGS = 3

export function MaterialCardItem({ card, onEdit, onDelete }: MaterialCardItemProps) {
  const [tags, setTags] = useState<MaterialTag[]>([])

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    if (!card.tags || card.tags.length === 0) return
    const tagIds = card.tags.map(t => parseInt(t)).filter(id => !isNaN(id))
    if (tagIds.length === 0) return
    const loadedTags: MaterialTag[] = []
    for (const id of tagIds) {
      const tag = await db.materialTags.get(id)
      if (tag) loadedTags.push(tag)
    }
    setTags(loadedTags)
  }

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const overflowCount = tags.length - MAX_VISIBLE_TAGS

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* 角色头像 (V29) */}
        {card.type === 'character' && card.avatar && (
          <img
            src={card.avatar}
            alt={card.name}
            className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover mr-3 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        {/* 默认角色头像 */}
        {card.type === 'character' && !card.avatar && (
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mr-3 flex-shrink-0 text-xl">
            {card.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              card.type === 'character' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              card.type === 'location' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {typeLabels[card.type]}
            </span>
            <h4 className="font-medium text-gray-900 dark:text-white truncate">{card.name}</h4>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
            {Object.entries(card.fields).map(([key, value]) => (
              value && <p key={key} className="truncate">
                <span className="text-gray-400">{key}:</span> {value}
              </p>
            ))}
          </div>
          {/* 标签展示 (V30) */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {visibleTags.map(tag => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                  +{overflowCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(card)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
            title="编辑"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => card.id && onDelete(card.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition-colors"
            title="删除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
