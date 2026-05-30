/**
 * 文风检测报告面板组件
 * - 一致性分数Badge（颜色：绿>80%, 黄60-80%, 红<60%）
 * - 各维度偏差列表
 * - "查看偏差段落"展开
 * - "一键修复"按钮
 */

import { useState, useEffect } from 'react'
import { analyzeStyleConsistency, type StyleConsistencyReport, type StyleDimension } from '../ai/styleChecker'
import { useStore } from '../store'
import StyleBadge from './StyleBadge'
import InlineSuggestionPanel from './InlineSuggestionPanel'

interface Props {
  isOpen: boolean
  onClose: () => void
  chapterId: number
}

export default function StyleConsistencyPanel({ isOpen, onClose, chapterId }: Props) {
  const { currentProject } = useStore()
  
  const [report, setReport] = useState<StyleConsistencyReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())
  const [showFixPanel, setShowFixPanel] = useState(false)
  const [fixText, setFixText] = useState('')
  const [showFixModal, setShowFixModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && chapterId && currentProject?.id) {
      loadReport()
    }
  }, [isOpen, chapterId, currentProject])

  const loadReport = async () => {
    if (!currentProject?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await analyzeStyleConsistency(currentProject.id, chapterId)
      setReport(result)
    } catch (err: any) {
      setError(err.message || '分析失败')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDimension = (dimensionName: string) => {
    const newExpanded = new Set(expandedDimensions)
    if (newExpanded.has(dimensionName)) {
      newExpanded.delete(dimensionName)
    } else {
      newExpanded.add(dimensionName)
    }
    setExpandedDimensions(newExpanded)
  }

  const handleFix = () => {
    if (!report) return
    // Open polishing modal or apply fixes
    setShowFixModal(true)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-800">文风一致性检测</span>
              {report && <StyleBadge score={report.overallScore} size="md" />}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading || isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin text-3xl mb-2">📊</div>
                <div className="text-gray-500">
                  {isAnalyzing ? '正在分析文风...' : '加载中...'}
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">⚠️ {error}</div>
                <button
                  onClick={loadReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  重试
                </button>
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Overall Score Summary */}
                <div className="text-center py-4 border-b border-gray-200">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {report.overallScore}
                  </div>
                  <div className="text-gray-500">文风一致性评分</div>
                </div>

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 建议</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {report.recommendations.map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dimensions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">各维度分析</h4>
                  
                  {report.dimensions.map((dim, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDimension(dim.name)}
                        className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-700">
                            {dim.name === 'characterVoice' && '🎭 角色语气'}
                            {dim.name === 'vocabulary' && '📝 措辞习惯'}
                            {dim.name === 'sentenceLength' && '📏 句式长短'}
                            {dim.name === 'descriptionDensity' && '🎬 描写密度'}
                          </span>
                          <StyleBadge score={dim.score} size="sm" showLabel={false} />
                        </div>
                        <span className="text-gray-400">
                          {expandedDimensions.has(dim.name) ? '▲' : '▼'}
                        </span>
                      </button>
                      
                      {expandedDimensions.has(dim.name) && (
                        <div className="p-3 border-t border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">{dim.description}</div>
                          
                          {dim.deviations.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-gray-500">偏差段落：</div>
                              {dim.deviations.map((dev, devIndex) => (
                                <div
                                  key={devIndex}
                                  className={`p-2 rounded text-sm ${
                                    dev.severity === 'major'
                                      ? 'bg-red-50 border border-red-200'
                                      : dev.severity === 'moderate'
                                      ? 'bg-yellow-50 border border-yellow-200'
                                      : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div className="text-gray-700">{dev.paragraphText}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    期望：{dev.expected} | 实际：{dev.actual}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Analysis Time */}
                <div className="text-xs text-gray-400 text-center">
                  分析时间：{new Date(report.analyzedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                暂无分析数据
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={loadReport}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              🔄 重新分析
            </button>
            
            {report && report.overallScore < 80 && (
              <button
                onClick={handleFix}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                ✨ 一键修复
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fix Modal - using InlineSuggestionPanel */}
      {showFixModal && report && (
        <InlineSuggestionPanel
          isOpen={showFixModal}
          onClose={() => setShowFixModal(false)}
          type="polish"
          originalText=""
          contextBefore=""
          contextAfter=""
          onApply={(text) => {
            console.log('Applied fix:', text)
            setShowFixModal(false)
          }}
        />
      )}
    </>
  )
}
