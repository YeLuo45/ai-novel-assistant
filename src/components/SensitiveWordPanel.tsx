/**
 * 敏感词检测面板
 * - 侧边抽屉形式
 * - 按分类显示敏感词列表
 * - 点击词汇显示详情
 * - 一键替换为*号功能
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  sensitiveWordCategories, 
  getCategoryColorClass,
  type SensitiveWordCategory 
} from '../utils/sensitiveWords'
import { 
  detectSensitiveWords, 
  replaceSensitiveWords, 
  getDetectionStats,
  type DetectionResult 
} from '../utils/sensitiveDetector'

interface Props {
  isOpen: boolean
  onClose: () => void
  content: string
  onReplace: (newContent: string) => void
}

export default function SensitiveWordPanel({
  isOpen,
  onClose,
  content,
  onReplace
}: Props) {
  const [activeTab, setActiveTab] = useState<string>('detection')
  const [selectedWord, setSelectedWord] = useState<DetectionResult | null>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)

  // Detect sensitive words in content
  const detectionResults = useMemo(() => {
    return detectSensitiveWords(content)
  }, [content])

  // Get stats
  const stats = useMemo(() => {
    return getDetectionStats(detectionResults)
  }, [detectionResults])

  // Handle replace all
  const handleReplaceAll = () => {
    if (detectionResults.length === 0) return
    
    if (confirm(`确定要将 ${detectionResults.length} 处敏感词替换为 * 吗？`)) {
      const newContent = replaceSensitiveWords(content, detectionResults)
      onReplace(newContent)
    }
  }

  // Handle replace single
  const handleReplaceSingle = (result: DetectionResult) => {
    const newContent = replaceSensitiveWords(content, [result])
    onReplace(newContent)
    setSelectedWord(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">⚠️ 敏感词检测</h2>
            <p className="text-sm text-gray-500 mt-1">
              {detectionResults.length === 0 
                ? '未检测到敏感词' 
                : `检测到 ${detectionResults.length} 处敏感词`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('detection')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'detection'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 检测结果 {detectionResults.length > 0 && `(${detectionResults.length})`}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'categories'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📚 敏感词库
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'detection' && (
            <div className="p-4">
              {/* Stats */}
              {Object.keys(stats).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(stats).map(([category, count]) => {
                    const catInfo = sensitiveWordCategories[category]
                    return catInfo ? (
                      <span 
                        key={category}
                        className={`px-3 py-1 text-sm rounded-full border ${getCategoryColorClass(catInfo.color)}`}
                      >
                        {catInfo.label}: {count}
                      </span>
                    ) : null
                  })}
                </div>
              )}

              {/* Replace all button */}
              {detectionResults.length > 0 && (
                <button
                  onClick={handleReplaceAll}
                  className="w-full mb-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  一键替换所有敏感词为 * 号
                </button>
              )}

              {/* Detection results */}
              {detectionResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">✅</p>
                  <p>恭喜！未检测到敏感词</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detectionResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWord === result 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedWord(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColorClass(result.color)}`}>
                            {result.label}
                          </span>
                          <span className="font-medium text-gray-800">{result.word}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReplaceSingle(result)
                          }}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          替换
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        位置: 第 {result.position + 1} 字符
                      </div>
                      
                      {/* Context preview */}
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        ...{content.slice(Math.max(0, result.position - 10), result.position)}
                        <span className={`px-1 rounded ${getCategoryColorClass(result.color)}`}>
                          {result.word}
                        </span>
                        {content.slice(result.position + result.word.length, result.position + result.word.length + 10)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="p-4 space-y-4">
              {Object.entries(sensitiveWordCategories).map(([key, category]) => (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className={`px-4 py-3 font-medium flex items-center justify-between ${getCategoryColorClass(category.color)}`}
                  >
                    <span>{category.label}</span>
                    <span className="text-sm opacity-75">{category.words.length} 个词</span>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {category.words.map((word, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-sm bg-white border border-gray-200 rounded cursor-help hover:shadow-sm ${getCategoryColorClass(category.color)}`}
                          title={`${category.label}: ${word}`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            💡 提示：敏感词检测仅供参考，请结合上下文语境判断。部分正常用语可能会被误标。
          </p>
        </div>
      </div>
    </div>
  )
}
