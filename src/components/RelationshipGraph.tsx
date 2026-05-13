/**
 * RelationshipGraph - V23
 * 角色关系可视化组件
 */

import { useMemo } from 'react'
import type { Character } from '../db'

interface Props {
  characters: Character[]
  compact?: boolean
}

const roleColors = {
  protagonist: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700' },
  supporting: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  minor: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' }
}

const relationshipTypes: Record<string, string> = {
  '青梅竹马': '👫',
  '恋人': '💕',
  '师徒': '📚',
  '同门': '⚔️',
  '兄弟': '👊',
  '母女': '👩‍👧',
  '父子': '👨‍👦',
  '朋友': '🤝',
  '对手': '🎯',
  '仇人': '💢',
  '暗恋': '💭',
  '恩人': '🙏'
}

export default function RelationshipGraph({ characters, compact = false }: Props) {
  // Extract relationships from character data
  const relationships = useMemo(() => {
    const rels: { from: string; to: string; type: string; description: string }[] = []
    
    characters.forEach(char => {
      char.relationships.forEach(rel => {
        // Parse relationship string like "与XX是XX关系"
        const match = rel.match(/与(.+?)是(.+?)关系/)
        if (match) {
          const [, targetName, relType] = match
          // Avoid duplicate relationships
          const existing = rels.find(r => 
            (r.from === targetName && r.to === char.name) ||
            (r.from === char.name && r.to === targetName)
          )
          if (!existing) {
            rels.push({
              from: char.name,
              to: targetName,
              type: relType,
              description: rel
            })
          }
        } else if (rel.startsWith('与')) {
          // Try to parse other formats
          const parts = rel.replace('与', '').split(/(是|存在|有着)/)
          if (parts.length >= 3) {
            const targetName = parts[0].trim()
            const relType = parts[2].trim()
            const existing = rels.find(r => 
              (r.from === targetName && r.to === char.name) ||
              (r.from === char.name && r.to === targetName)
            )
            if (!existing) {
              rels.push({
                from: char.name,
                to: targetName,
                type: relType,
                description: rel
              })
            }
          }
        }
      })
    })
    
    return rels
  }, [characters])

  if (characters.length === 0) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'h-32' : 'h-64'} bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-sm">暂无角色关系数据</p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {characters.slice(0, 4).map(char => {
          const colors = roleColors[char.role]
          return (
            <div key={char.id} className={`flex items-center gap-2 p-2 rounded-lg ${colors.bg}`}>
              <span className={`w-2 h-2 rounded-full ${colors.border.replace('border', 'bg')}`} />
              <span className={`font-medium text-sm ${colors.text}`}>{char.name}</span>
              {char.role === 'protagonist' && <span className="text-xs">⭐</span>}
            </div>
          )
        })}
        {characters.length > 4 && (
          <div className="text-xs text-gray-500 text-center">
            +{characters.length - 4} 更多角色
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-4 min-h-[300px]">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-700 mb-4">👥 角色关系图</h3>
      
      {/* Character Nodes */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {characters.map(char => {
          const colors = roleColors[char.role]
          return (
            <div
              key={char.id}
              className={`relative p-3 rounded-xl ${colors.bg} border-2 ${colors.border} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className={`font-bold ${colors.text}`}>{char.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {char.role === 'protagonist' ? '⭐ 主角' : 
                 char.role === 'supporting' ? '👤 配角' : '👤 路人'}
              </div>
              {char.role === 'protagonist' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs shadow">
                  ⭐
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">关系详情</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {relationships.map((rel, idx) => {
              const emoji = Object.entries(relationshipTypes).find(([type]) => 
                rel.type.includes(type)
              )?.[1] || '💬'
              
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors"
                >
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {rel.from} → {rel.to}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{rel.type}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400" /> 主角
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-400" /> 配角
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-400" /> 路人
        </span>
      </div>
    </div>
  )
}
