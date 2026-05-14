/**
 * AI 建议弹窗组件
 * - 显示 diff 样式建议（绿色新增/红色删除）
 * - 支持一键采纳或手动修改
 * - 可重新生成
 */

import { useState, useEffect, useRef } from 'react'
import { streamWritingAssist, type WritingAssistType } from '../ai/writingAssistant'
import type { LLMEvent } from '../ai/types'
interface Props {
  isOpen: boolean
  onClose: () => void
  type: WritingAssistType
  originalText: string
  contextBefore: string
  contextAfter: string
  onApply: (text: string) => void
}

export default function InlineSuggestionPanel({
  isOpen,
  onClose,
  type,
  originalText,
  contextBefore,
  contextAfter,
  onApply
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const subscriptionRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isOpen && originalText) {
      generateSuggestions()
    }
  }, [isOpen, originalText])

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current()
      }
    }
  }, [])

  const generateSuggestions = async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current()
    }

    setIsLoading(true)
    setSuggestions([])
    setStreamingText('')
    setError(null)

    let accumulated = ''

    try {
      const unsubscribe = await streamWritingAssist({
        type,
        selectedText: originalText,
        contextBefore,
        contextAfter,
        model: selectedModel
      }, (event: LLMEvent) => {
        if (event.type === 'done') {
          setSuggestions([accumulated])
          setIsLoading(false)
        } else if (event.type === 'text' && event.content) {
          accumulated += event.content
          setStreamingText(accumulated)
        } else if (event.type === 'error') {
          setError(event.content || 'Unknown error')
          setIsLoading(false)
        }
      })

      subscriptionRef.current = unsubscribe
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (suggestions[selectedIndex]) {
      onApply(suggestions[selectedIndex])
      onClose()
    }
  }

  const handleRetry = () => {
    generateSuggestions()
  }

  const handleCancel = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current()
    }
    onClose()
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'continue': return '续写'
      case 'polish': return '润色'
      case 'expand': return '扩写'
      case 'summarize': return '缩写'
      default: return 'AI建议'
    }
  }

  // 简单的 diff 可视化
  const renderDiff = (original: string, modified: string) => {
    // 对于简单的演示，我们展示原文和修改后的对比
    // 实际项目中可以使用更复杂的 diff 算法
    return (
      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">原文：</div>
          <div className="bg-red-50 border border-red-200 rounded p-2 text-sm whitespace-pre-wrap">
            {original}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">修改后：</div>
          <div className="bg-green-50 border border-green-200 rounded p-2 text-sm whitespace-pre-wrap">
            {modified}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800">AI {getTypeLabel()}建议</span>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">正在生成建议...</div>
              <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                <div className="whitespace-pre-wrap text-sm">
                  {streamingText || <span className="animate-pulse">正在思考...</span>}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="space-y-3">
              <div className="text-sm text-red-500">⚠️ {error}</div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                重试
              </button>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && !error && suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                点击下方建议查看详情，或直接采纳
              </div>
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`cursor-pointer rounded-lg border-2 transition-colors ${
                    selectedIndex === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="p-3">
                    {renderDiff(originalText, suggestion)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Suggestions Yet */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p>点击"重新生成"获取建议</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            🔄 重新生成
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={suggestions.length === 0 || isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ 采纳建议
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
