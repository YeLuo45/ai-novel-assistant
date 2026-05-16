/**
 * ChapterVersionHistory - V31 版本历史侧边栏组件
 * 显示快照列表（时间 + 字数）
 * 预览面板
 * 恢复按钮
 * 删除按钮
 */

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { ChapterVersion } from '../db'
import { diffLines } from 'diff'

interface Props {
  chapterId: number
  projectId: number
  currentContent: string
  currentTitle: string
  onRestore: (content: string, title: string) => void
  onClose: () => void
}

export default function ChapterVersionHistory({
  chapterId,
  projectId,
  currentContent,
  currentTitle,
  onRestore,
  onClose
}: Props) {
  const { loadChapterVersions, saveChapterVersion, deleteChapterVersions } = useStore()
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  // Load versions on mount
  useEffect(() => {
    loadVersions()
  }, [chapterId])

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const vers = await loadChapterVersions(chapterId)
      setVersions(vers)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate word count from version or content
  const getWordCount = (content: string) => {
    return content.replace(/\s/g, '').length
  }

  // Handle restore
  const handleRestore = useCallback((version: ChapterVersion) => {
    if (confirm(`确定要恢复到 "${version.title}" 版本吗？当前内容将被覆盖。`)) {
      onRestore(version.content, version.title)
    }
  }, [onRestore])

  // Handle delete
  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个版本快照吗？')) {
      await deleteChapterVersions([id])
      if (selectedVersion?.id === id) {
        setSelectedVersion(null)
      }
      loadVersions()
    }
  }

  // Compute diff between current and selected version
  const computeDiff = () => {
    if (!selectedVersion) return []
    return diffLines(selectedVersion.content, currentContent)
  }

  const diffResult = selectedVersion ? computeDiff() : []

  // Restore from selected version
  const handleRestoreSelected = () => {
    if (selectedVersion) {
      handleRestore(selectedVersion)
    }
  }

  // Save current as new version
  const handleSaveCurrentVersion = async () => {
    await saveChapterVersion(chapterId, currentContent, currentTitle)
    await loadVersions()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <span>加载中...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">📜 版本历史</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCurrentVersion}
            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            title="保存当前版本"
          >
            💾 保存当前
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Version list */}
        <div className={`${showDiff && selectedVersion ? 'w-1/2' : 'w-full'} border-r border-gray-200 overflow-y-auto`}>
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <p className="text-4xl mb-2">📜</p>
              <p className="text-center">暂无版本记录</p>
              <p className="text-sm text-center mt-1">点击「保存当前」创建第一个版本</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Current version */}
              <div 
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  showDiff && selectedVersion === null ? 'bg-indigo-50' : ''
                }`}
                onClick={() => { setSelectedVersion(null); setShowDiff(false) }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">当前</span>
                      {currentTitle}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(new Date())} · {getWordCount(currentContent)} 字
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved versions */}
              {versions.map((version, index) => (
                <div 
                  key={version.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    showDiff && selectedVersion?.id === version.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => { setSelectedVersion(version); setShowDiff(true) }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          v{versions.length - index}
                        </span>
                        <span className="truncate">{version.title}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(version.createdAt)} · {(version as any).wordCount || getWordCount(version.content)} 字
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(version)
                        }}
                        className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        恢复
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(version.id!)
                        }}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diff viewer */}
        {showDiff && selectedVersion && (
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                对比: {selectedVersion.title} vs 当前
              </span>
              <button
                onClick={() => setShowDiff(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="font-mono text-sm">
                {diffResult.map((part, index) => {
                  const colorClass = part.added ? 'bg-green-100 text-green-800' :
                                   part.removed ? 'bg-red-100 text-red-800' : 'text-gray-700'
                  const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
                  return (
                    <div key={index} className={`${colorClass} px-2 py-0.5 whitespace-pre-wrap`}>
                      {prefix}{part.value}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleRestoreSelected}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                恢复到选中版本
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}