/**
 * 批量润色 Modal 组件
 * - 章节勾选列表
 * - 润色选项（多选）
 * - 进度条（已完成/总章节数）
 * - Diff预览 + 选择性采纳
 */

import { useState, useEffect } from 'react'
import { batchPolish, type PolishingOptions, type PolishingResult } from '../ai/batchPolishing'
import { useStore } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
  onApplyResults: (results: PolishingResult[]) => void
  preselectedChapterIds?: number[]
}

const TONE_OPTIONS = [
  { value: 'formal', label: '正式', icon: '📜' },
  { value: 'casual', label: '轻松', icon: '💬' },
  { value: 'literary', label: '文雅', icon: '📚' },
  { value: 'vivid', label: '生动', icon: '✨' }
]

const DIALOGUE_OPTIONS = [
  { value: 'natural', label: '自然' },
  { value: 'classical', label: '古典' },
  { value: 'modern', label: '现代' },
  { value: 'poetic', label: '诗意' }
]

const SENTENCE_OPTIONS = [
  { value: 'short', label: '短句' },
  { value: 'medium', label: '中等' },
  { value: 'long', label: '长句' },
  { value: 'balanced', label: '均衡' }
]

export default function BatchPolishingModal({
  isOpen,
  onClose,
  onApplyResults,
  preselectedChapterIds = []
}: Props) {
  const { outlineNodes, currentProject } = useStore()
  
  const [selectedChapterIds, setSelectedChapterIds] = useState<number[]>(preselectedChapterIds)
  const [tone, setTone] = useState<PolishingOptions['tone']>(undefined)
  const [dialogueStyle, setDialogueStyle] = useState<PolishingOptions['dialogueStyle']>(undefined)
  const [sentenceLength, setSentenceLength] = useState<PolishingOptions['sentenceLength']>(undefined)
  const [fixErrors, setFixErrors] = useState(true)
  const [isPolishing, setIsPolishing] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentChapterId: 0 })
  const [results, setResults] = useState<PolishingResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Get chapters with content
  const chaptersWithContent = outlineNodes.filter(
    n => (n.type === 'chapter' || n.type === 'section') && n.content
  )

  const toggleChapter = (chapterId: number) => {
    setSelectedChapterIds(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const selectAll = () => {
    setSelectedChapterIds(chaptersWithContent.map(n => n.id!).filter(Boolean))
  }

  const selectNone = () => {
    setSelectedChapterIds([])
  }

  const handlePolishing = async () => {
    if (selectedChapterIds.length === 0) {
      setError('请选择至少一个章节')
      return
    }

    setIsPolishing(true)
    setError(null)
    setResults([])
    setProgress({ completed: 0, total: selectedChapterIds.length, currentChapterId: 0 })

    const options: PolishingOptions = {
      tone,
      dialogueStyle,
      sentenceLength,
      fixErrors
    }

    try {
      const polishingResults = await batchPolish(
        selectedChapterIds,
        options,
        (completed, total, chapterId) => {
          setProgress({ completed, total, currentChapterId: chapterId })
        }
      )
      
      setResults(polishingResults)
      setShowResults(true)
    } catch (err: any) {
      setError(err.message || '润色失败')
    } finally {
      setIsPolishing(false)
    }
  }

  const handleApplyAll = () => {
    onApplyResults(results)
    onClose()
  }

  const currentResult = results[selectedResultIndex]

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedChapterIds(preselectedChapterIds)
      setResults([])
      setShowResults(false)
      setError(null)
    }
  }, [isOpen, preselectedChapterIds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-medium text-gray-800">批量润色</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!showResults ? (
            <div className="space-y-6">
              {/* Chapter Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    选择章节 ({selectedChapterIds.length}/{chaptersWithContent.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      全选
                    </button>
                    <button
                      onClick={selectNone}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      取消全选
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {chaptersWithContent.map(chapter => (
                    <label
                      key={chapter.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChapterIds.includes(chapter.id!)}
                        onChange={() => toggleChapter(chapter.id!)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {chapter.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        {chapter.content?.replace(/\s/g, '').length || 0}字
                      </span>
                    </label>
                  ))}
                  {chaptersWithContent.length === 0 && (
                    <div className="p-4 text-center text-gray-400">
                      暂无有内容的章节
                    </div>
                  )}
                </div>
              </div>

              {/* Polishing Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">润色选项</h4>

                {/* Tone */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">语调风格</label>
                  <div className="flex flex-wrap gap-2">
                    {TONE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTone(tone === option.value ? undefined : option.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          tone === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {option.icon} {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dialogue Style */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">对话风格</label>
                  <div className="flex flex-wrap gap-2">
                    {DIALOGUE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setDialogueStyle(dialogueStyle === option.value ? undefined : option.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          dialogueStyle === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sentence Length */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">句式长短</label>
                  <div className="flex flex-wrap gap-2">
                    {SENTENCE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSentenceLength(sentenceLength === option.value ? undefined : option.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          sentenceLength === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fix Errors */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fixErrors}
                    onChange={e => setFixErrors(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">自动修正错别字和语病</span>
                </label>
              </div>

              {/* Progress */}
              {isPolishing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">润色进度</span>
                    <span className="text-indigo-600">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
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
            </div>
          ) : (
            // Results View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">
                  润色结果 ({results.length}个章节)
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    重新选择
                  </button>
                </div>
              </div>

              {/* Result Tabs */}
              {results.length > 0 && (
                <div className="flex gap-1 flex-wrap border-b border-gray-200 pb-2">
                  {results.map((result, index) => {
                    const chapter = outlineNodes.find(n => n.id === result.chapterId)
                    return (
                      <button
                        key={result.chapterId}
                        onClick={() => setSelectedResultIndex(index)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedResultIndex === index
                            ? 'bg-indigo-600 text-white'
                            : result.success
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {chapter?.title || `章节${index + 1}`}
                        {!result.success && ' ⚠️'}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Diff Preview */}
              {currentResult && (
                <div className="space-y-4">
                  {currentResult.success ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">原文</div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                          {currentResult.originalContent}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">润色后</div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                          {currentResult.polishedContent}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                      润色失败：{currentResult.error}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="text-sm text-gray-500">
                成功：{results.filter(r => r.success).length} | 失败：{results.filter(r => !r.success).length}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
          
          {!showResults ? (
            <button
              onClick={handlePolishing}
              disabled={selectedChapterIds.length === 0 || isPolishing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPolishing ? '润色中...' : `✨ 开始润色 (${selectedChapterIds.length})`}
            </button>
          ) : (
            <button
              onClick={handleApplyAll}
              disabled={results.filter(r => r.success).length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ 采纳所有结果 ({results.filter(r => r.success).length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
