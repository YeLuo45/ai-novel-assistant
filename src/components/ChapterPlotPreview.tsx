/**
 * 生成内容预览组件
 * - 展示AI生成的章节内容
 * - 支持版本切换（版本1/2/3）
 * - 插入/编辑按钮
 */

import { useState } from 'react'
import type { GeneratedChapter } from '../ai/chapterGenerator'

interface Props {
  isOpen: boolean
  onClose: () => void
  chapters: GeneratedChapter[]
  isLoading?: boolean
  onInsert: (content: string, title: string) => void
  onEdit?: (content: string, title: string) => void
}

export default function ChapterPlotPreview({
  isOpen,
  onClose,
  chapters,
  isLoading,
  onInsert,
  onEdit
}: Props) {
  const [selectedVersion, setSelectedVersion] = useState(0)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const currentChapter = chapters[selectedVersion]

  const handleCopy = async () => {
    if (currentChapter) {
      await navigator.clipboard.writeText(currentChapter.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInsert = () => {
    if (currentChapter) {
      onInsert(currentChapter.content, currentChapter.title)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-800">章节预览</span>
            
            {/* Version Selector */}
            {chapters.length > 1 && (
              <div className="flex gap-1">
                {chapters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVersion(index)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedVersion === index
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    版本 {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <div className="text-gray-500">正在生成内容...</div>
              </div>
            </div>
          ) : currentChapter ? (
            <div className="space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentChapter.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentChapter.content.replace(/\s/g, '').length} 字
                </p>
              </div>
              
              <div className="prose prose-indigo max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {currentChapter.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              暂无生成内容
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleCopy}
            disabled={!currentChapter}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            {copied ? '✓ 已复制' : '📋 复制'}
          </button>
          
          <div className="flex gap-2">
            {onEdit && currentChapter && (
              <button
                onClick={() => onEdit(currentChapter.content, currentChapter.title)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ✏️ 编辑
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              onClick={handleInsert}
              disabled={!currentChapter}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              ✓ 插入章节
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
