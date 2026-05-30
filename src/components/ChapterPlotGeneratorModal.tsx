/**
 * 章节情节生成 Modal 组件
 * - 大纲节点选择器
 * - 风格选择（详细/简洁/高潮/平铺）
 * - 字数目标输入
 * - 生成进度 + 预览
 * - 插入/复制按钮
 */

import { useState, useEffect } from 'react'
import { generateChapterFromOutline, type PlotStyle, type GeneratedChapter } from '../ai/chapterGenerator'
import { useStore } from '../store'
import { type OutlineNode } from '../db'
import ChapterPlotPreview from './ChapterPlotPreview'

interface Props {
  isOpen: boolean
  onClose: () => void
  onInsert: (content: string, title: string, nodeId: number) => void
  preselectedNodeId?: number
}

const STYLE_OPTIONS: { value: PlotStyle; label: string; description: string }[] = [
  { value: 'detailed', label: '详细', description: '细腻描写，场景氛围丰富' },
  { value: 'concise', label: '简洁', description: '节奏明快，直入主题' },
  { value: 'climax', label: '高潮', description: '冲突激烈，悬念丛生' },
  { value: 'plains', label: '平铺', description: '平稳推进，逻辑清晰' }
]

export default function ChapterPlotGeneratorModal({
  isOpen,
  onClose,
  onInsert,
  preselectedNodeId
}: Props) {
  const { outlineNodes, currentProject } = useStore()
  
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(preselectedNodeId || null)
  const [style, setStyle] = useState<PlotStyle>('detailed')
  const [targetWordCount, setTargetWordCount] = useState<number>(1500)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedChapters, setGeneratedChapters] = useState<GeneratedChapter[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Get available outline nodes (planning or writing status)
  const availableNodes = outlineNodes.filter(
    n => n.type === 'chapter' || n.type === 'section'
  )

  // Get selected node
  const selectedNode = outlineNodes.find(n => n.id === selectedNodeId)

  // Get context (previous and next chapters)
  const getContext = (nodeId: number) => {
    const nodeIndex = outlineNodes.findIndex(n => n.id === nodeId)
    const contextBefore = nodeIndex > 0 
      ? outlineNodes[nodeIndex - 1]?.content?.slice(-500)
      : undefined
    const contextAfter = nodeIndex < outlineNodes.length - 1
      ? outlineNodes[nodeIndex + 1]?.content?.slice(0, 500)
      : undefined
    return { contextBefore, contextAfter }
  }

  const handleGenerate = async () => {
    if (!selectedNodeId || !selectedNode) {
      setError('请先选择一个章节节点')
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setGeneratedChapters([])

    try {
      const { contextBefore, contextAfter } = getContext(selectedNodeId)
      
      setProgress(20)
      
      const results = await generateChapterFromOutline({
        outlineNode: selectedNode,
        contextBefore,
        contextAfter,
        style,
        targetWordCount,
        model: 'gpt-4o-mini'
      })
      
      setProgress(100)
      setGeneratedChapters(results)
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsert = (content: string, title: string) => {
    if (selectedNodeId) {
      onInsert(content, title, selectedNodeId)
      onClose()
    }
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedNodeId(preselectedNodeId || null)
      setGeneratedChapters([])
      setShowPreview(false)
      setError(null)
    }
  }, [isOpen, preselectedNodeId])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-800">AI 章节生成</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Node Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择章节
              </label>
              <select
                value={selectedNodeId || ''}
                onChange={e => setSelectedNodeId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- 选择章节 --</option>
                {availableNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.type === 'chapter' ? '章' : '节'}：{node.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                风格选择
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStyle(option.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      style === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Word Count Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标字数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={targetWordCount}
                  onChange={e => setTargetWordCount(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-20 text-right">
                  {targetWordCount} 字
                </span>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">生成中...</span>
                  <span className="text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* Selected Node Info */}
            {selectedNode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  {selectedNode.title}
                </div>
                {selectedNode.summary && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {selectedNode.summary}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedNodeId || isGenerating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中...' : '🎨 生成章节'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <ChapterPlotPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        chapters={generatedChapters}
        isLoading={false}
        onInsert={handleInsert}
      />
    </>
  )
}
