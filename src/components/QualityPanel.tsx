/**
 * QualityPanel - V34
 * Quality assessment panel with radar chart and issue list
 */

import { useState } from 'react'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import type { QualityResult, QualityIssue } from '../ai/critic/types'

interface Props {
  qualityResult: QualityResult | null
  isAnalyzing: boolean
  onIssueClick?: (issue: QualityIssue) => void
  onFixSuggestion?: (issue: QualityIssue, fix: string) => void
}

const SEVERITY_COLORS = {
  error: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', icon: '🔴' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: '🟡' },
  info: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', icon: '🔵' }
}

const DIMENSION_LABELS = {
  length: '长度',
  style: '风格',
  duplicate: '重复',
  dialogue: '对话'
}

export default function QualityPanel({ 
  qualityResult, 
  isAnalyzing,
  onIssueClick,
  onFixSuggestion 
}: Props) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Transform radar data for recharts
  const radarData = qualityResult ? [
    { dimension: '长度', value: qualityResult.radarData.length, fullMark: 100 },
    { dimension: '结构', value: qualityResult.radarData.length * 0.95, fullMark: 100 },
    { dimension: '对话', value: qualityResult.radarData.dialogue, fullMark: 100 },
    { dimension: '风格', value: qualityResult.radarData.style, fullMark: 100 },
    { dimension: '创意', value: (qualityResult.radarData.duplicate + qualityResult.radarData.style) / 2, fullMark: 100 },
  ] : []

  const handleIssueClick = (issue: QualityIssue, index: number) => {
    setExpandedIssue(expandedIssue === index ? null : index)
    onIssueClick?.(issue)
  }

  const handleFix = (issue: QualityIssue) => {
    if (issue.suggestion) {
      onFixSuggestion?.(issue, issue.suggestion)
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gradient-to-b from-indigo-50 to-purple-50 border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="展开质量面板"
        >
          📊
        </button>
        {qualityResult && (
          <div className="mt-4 text-xs font-medium text-indigo-600">
            {qualityResult.score}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-96 bg-gradient-to-b from-indigo-50 to-purple-50 border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="font-bold text-gray-800">质量评估</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="收起面板"
          >
            ◀
          </button>
        </div>
        
        {/* Overall Score */}
        {qualityResult && (
          <div className="mt-3 flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
              ${qualityResult.score >= 80 ? 'bg-green-100 text-green-600' :
                qualityResult.score >= 60 ? 'bg-amber-100 text-amber-600' :
                'bg-red-100 text-red-600'}`}
            >
              {qualityResult.score}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">综合质量分</div>
              <div className="text-xs text-gray-400">
                {qualityResult.issues.length} 个问题待处理
              </div>
            </div>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            分析中...
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="p-4 bg-white m-3 rounded-xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">五维雷达图</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                />
                <Radar
                  name="质量"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  formatter={(value: number) => [`${Math.round(value)}`, '得分']}
                  labelStyle={{ color: '#374151' }}
                />
              </RadarChart>
            </ResponsiveContainer>
            
            {/* Dimension Scores */}
            <div className="grid grid-cols-5 gap-1 mt-2 text-center">
              {radarData.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="text-gray-500">{item.dimension}</div>
                  <div className={`font-medium ${
                    item.value >= 80 ? 'text-green-600' :
                    item.value >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {Math.round(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues List */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span>
            问题列表
            {qualityResult && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {qualityResult.issues.length}
              </span>
            )}
          </h3>
          
          {!qualityResult || qualityResult.issues.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">暂无问题</p>
            </div>
          ) : (
            <div className="space-y-2">
              {qualityResult.issues.map((issue, index) => {
                const severity = SEVERITY_COLORS[issue.severity]
                const isExpanded = expandedIssue === index
                
                return (
                  <div
                    key={index}
                    className={`${severity.bg} ${severity.border} border rounded-lg overflow-hidden transition-all`}
                  >
                    <div
                      className="p-3 cursor-pointer flex items-start gap-2"
                      onClick={() => handleIssueClick(issue, index)}
                    >
                      <span>{severity.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${severity.text} bg-white/50`}>
                            {issue.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            段落 {issue.position.paragraph ?? '-'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {issue.message}
                        </p>
                      </div>
                      <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-white/30">
                        <div className="pt-2 space-y-2">
                          {issue.suggestion && (
                            <div className="bg-white/50 rounded p-2">
                              <div className="text-xs text-gray-500 mb-1">💡 修复建议</div>
                              <p className="text-sm text-gray-700">{issue.suggestion}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFix(issue)
                                }}
                                className="mt-2 text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                              >
                                一键修复
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            位置: 字符 {issue.position.start}-{issue.position.end}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
