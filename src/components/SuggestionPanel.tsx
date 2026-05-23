/**
 * SuggestionPanel - V38
 * Displays actionable improvement suggestions
 */

import { useState, useMemo } from 'react'
import type { QualityIssue } from '../ai/critic/types'

interface Suggestion {
  id: string
  issue: QualityIssue
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionableSteps: string[]
  targetChapter?: number
  targetParagraph?: number
  estimatedImpact: 'high' | 'medium' | 'low'
}

interface Props {
  suggestions: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onApplySuggestion?: (suggestion: Suggestion) => void
  onApplyAll?: (suggestions: Suggestion[]) => void
}

const PRIORITY_CONFIG = {
  high: {
    label: '高优先级',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
    icon: '🔴'
  },
  medium: {
    label: '中优先级',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700',
    icon: '🟡'
  },
  low: {
    label: '低优先级',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: '🔵'
  }
}

const IMPACT_LABELS = {
  high: '高影响',
  medium: '中影响',
  low: '低影响'
}

export default function SuggestionPanel({
  suggestions,
  onSuggestionClick,
  onApplySuggestion,
  onApplyAll
}: Props) {
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredSuggestions = useMemo(() => {
    if (filterPriority === 'all') return suggestions
    return suggestions.filter(s => s.priority === filterPriority)
  }, [suggestions, filterPriority])

  const groupedByPriority = useMemo(() => {
    const groups: Record<string, Suggestion[]> = {
      high: [],
      medium: [],
      low: []
    }
    for (const s of filteredSuggestions) {
      groups[s.priority].push(s)
    }
    return groups
  }, [filteredSuggestions])

  const stats = useMemo(() => ({
    total: suggestions.length,
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
    low: suggestions.filter(s => s.priority === 'low').length
  }), [suggestions])

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleApply = (e: React.MouseEvent, suggestion: Suggestion) => {
    e.stopPropagation()
    onApplySuggestion?.(suggestion)
  }

  const handleApplyAll = () => {
    onApplyAll?.(filteredSuggestions)
  }

  if (suggestions.length === 0) {
    return (
      <div className="w-96 bg-gradient-to-b from-green-50 to-emerald-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="font-bold text-gray-800">改进建议</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">暂无改进建议</p>
            <p className="text-sm text-gray-400 mt-1">文章质量良好</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-gradient-to-b from-green-50 to-emerald-50 border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="font-bold text-gray-800">改进建议</h2>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {stats.total}条
            </span>
          </div>
          <button
            onClick={handleApplyAll}
            className="text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            一键应用
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{stats.high}</div>
            <div className="text-xs text-red-500">高优先</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-600">{stats.medium}</div>
            <div className="text-xs text-amber-500">中优先</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.low}</div>
            <div className="text-xs text-blue-500">低优先</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {(['all', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`flex-1 text-xs py-1.5 rounded transition-colors ${
                filterPriority === p
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? '全部' : PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(['high', 'medium', 'low'] as const).map(priority => {
          const items = groupedByPriority[priority]
          if (items.length === 0) return null
          
          const config = PRIORITY_CONFIG[priority]
          
          return (
            <div key={priority} className="space-y-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${config.badgeColor.replace('bg-', 'text-').split(' ')[0]}`}>
                <span>{config.icon}</span>
                <span>{config.label}</span>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>

              {items.map(suggestion => {
                const isExpanded = expandedId === suggestion.id
                
                return (
                  <div
                    key={suggestion.id}
                    className={`${config.bgColor} ${config.borderColor} border rounded-xl overflow-hidden transition-all`}
                  >
                    <div
                      className="p-3 cursor-pointer"
                      onClick={() => {
                        handleToggle(suggestion.id)
                        onSuggestionClick?.(suggestion)
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${config.badgeColor}`}>
                              {suggestion.issue.type}
                            </span>
                            {suggestion.targetChapter !== undefined && (
                              <span className="text-xs text-gray-400">
                                第{suggestion.targetChapter + 1}章
                              </span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              suggestion.estimatedImpact === 'high' ? 'bg-green-100 text-green-700' :
                              suggestion.estimatedImpact === 'medium' ? 'bg-gray-100 text-gray-600' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              {IMPACT_LABELS[suggestion.estimatedImpact]}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-800 mb-1">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-white/30">
                        <div className="pt-2 space-y-2">
                          {/* Actionable steps */}
                          <div>
                            <div className="text-xs text-gray-500 mb-1">📋 实施步骤</div>
                            <ul className="space-y-1">
                              {suggestion.actionableSteps.map((step, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-1.5">
                                  <span className="text-indigo-500">{idx + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Issue details */}
                          <div className="text-xs text-gray-400">
                            问题位置: 段落 {suggestion.targetParagraph ?? '-'}
                          </div>

                          {/* Apply button */}
                          <button
                            onClick={(e) => handleApply(e, suggestion)}
                            className="w-full text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>✓</span>
                            <span>应用建议</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}