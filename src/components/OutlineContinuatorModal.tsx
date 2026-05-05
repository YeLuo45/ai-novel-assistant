/**
 * 大纲续写 Modal 组件
 * - 当前章节选择
 * - 生成数量选择（1-5章）
 * - 版本切换（版本1/2/3）
 * - 采纳按钮（插入章节树）
 */

import { useState, useEffect } from 'react'
import { continueOutline, type OutlineVersion, type OutlineChapter } from '../ai/outlineContinuator'
import { useStore } from '../store'
import { type OutlineNode } from '../db'

interface Props {
  isOpen: boolean
  onClose: () => void
  onInsert: (chapters: OutlineChapter[], parentId: number | null) => void
  preselectedNodeId?: number
}

export default function OutlineContinuatorModal({
  isOpen,
  onClose,
  onInsert,
  preselectedNodeId
}: Props) {
  const { outlineNodes, currentProject } = useStore()
  
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(preselectedNodeId || null)
  const [chapterCount, setChapterCount] = useState<number>(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState<OutlineVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Get available outline nodes (planning or writing status)
  const availableNodes = outlineNodes.filter(
    n => n.type === 'chapter' || n.type === 'section'
  )

  // Get selected node
  const selectedNode = outlineNodes.find(n => n.id === selectedNodeId)

  // Get siblings and parent info for insertion
  const getInsertContext = (nodeId: number) => {
    const node = outlineNodes.find(n => n.id === nodeId)
    if (!node) return { parentId: null as number | null, insertIndex: outlineNodes.length }
    
    const siblings = outlineNodes.filter(n => n.parentId === node.parentId)
    const nodeIndex = siblings.findIndex(n => n.id === nodeId)
    
    return {
      parentId: node.parentId,
      insertIndex: nodeIndex >= 0 ? nodeIndex + 1 : siblings.length
    }
  }

  const handleGenerate = async () => {
    if (!selectedNodeId || !selectedNode) {
      setError('请先选择一个章节节点')
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setGeneratedVersions([])
    setCurrentVersion(0)
    setShowPreview(false)

    try {
      setProgress(20)
      
      const results = await continueOutline({
        currentChapter: selectedNode,
        existingOutline: outlineNodes,
        count: chapterCount,
        model: 'gpt-4o-mini'
      })
      
      setProgress(100)
      setGeneratedVersions(results)
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsert = () => {
    if (generatedVersions.length > 0 && currentVersion < generatedVersions.length) {
      const version = generatedVersions[currentVersion]
      const { parentId } = selectedNodeId ? getInsertContext(selectedNodeId) : { parentId: null as number | null }
      onInsert(version.chapters, parentId)
      onClose()
    }
  }

  const handleInsertSingle = (chapter: OutlineChapter, chapterIndex: number) => {
    if (generatedVersions.length > 0 && currentVersion < generatedVersions.length) {
      const { parentId } = selectedNodeId ? getInsertContext(selectedNodeId) : { parentId: null as number | null }
      // Insert only this chapter
      onInsert([chapter], parentId)
    }
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedNodeId(preselectedNodeId || null)
      setGeneratedVersions([])
      setShowPreview(false)
      setError(null)
      setCurrentVersion(0)
    }
  }, [isOpen, preselectedNodeId])

  if (!isOpen) return null

  const currentChapters = generatedVersions[currentVersion]?.chapters || []
  const versionLabels = ['版本一（稳妥）', '版本二（高潮）', '版本三（悬疑）']

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-800">📝 AI 大纲续写</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Node Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当前章节（基于此章节续写）
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

            {/* Chapter Count Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生成后续章节数量
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={chapterCount}
                  onChange={e => setChapterCount(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-20 text-right">
                  {chapterCount} 章
                </span>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">AI 思考中...</span>
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
                {selectedNode.content && (
                  <div className="text-xs text-gray-400 mt-1 line-clamp-3">
                    {selectedNode.content}
                  </div>
                )}
              </div>
            )}

            {/* Version Selector (when preview is shown) */}
            {showPreview && generatedVersions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择版本
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {generatedVersions.map((version, index) => (
                    <button
                      key={version.version}
                      onClick={() => setCurrentVersion(index)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        currentVersion === index
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{versionLabels[index]}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {version.chapters.length} 章
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {showPreview && currentChapters.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  预览大纲
                </label>
                {currentChapters.map((chapter, index) => (
                  <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {chapter.type === 'chapter' ? '章' : chapter.type === 'section' ? '节' : '场景'}
                          </span>
                          <span className="font-medium text-sm">{chapter.title}</span>
                        </div>
                        {chapter.summary && (
                          <div className="text-xs text-gray-600 mt-1">
                            {chapter.summary}
                          </div>
                        )}
                        {chapter.content && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-3">
                            {chapter.content}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleInsertSingle(chapter, index)}
                        className="ml-2 text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        采纳
                      </button>
                    </div>
                  </div>
                ))}
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
            {!showPreview ? (
              <button
                onClick={handleGenerate}
                disabled={!selectedNodeId || isGenerating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中...' : '🔮 开始生成'}
              </button>
            ) : (
              <button
                onClick={handleInsert}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✅ 采纳全部 ({currentChapters.length} 章)
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
