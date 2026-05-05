/**
 * 版本历史面板
 * - 侧边抽屉形式
 * - 版本列表（版本号、时间、字数、修改摘要）
 * - 支持多选两个版本进行对比
 * - DiffViewer集成
 * - 恢复到指定版本按钮
 */

import { useState, useEffect, useMemo } from 'react'
import { db, ChapterVersion } from '../db'
import DiffViewer from './DiffViewer'

interface Props {
  isOpen: boolean
  onClose: () => void
  chapterId: number
  projectId: number
  currentContent: string
  currentTitle: string
  onRestore: (content: string, title: string) => void
}

export default function VersionHistoryPanel({
  isOpen,
  onClose,
  chapterId,
  projectId,
  currentContent,
  currentTitle,
  onRestore
}: Props) {
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [selectedVersions, setSelectedVersions] = useState<[number | null, number | null]>([null, null])
  const [isLoading, setIsLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  // Load versions
  useEffect(() => {
    if (isOpen && chapterId) {
      loadVersions()
    }
  }, [isOpen, chapterId])

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const vers = await db.chapterVersions
        .where('chapterId')
        .equals(chapterId)
        .reverse()
        .sortBy('createdAt')
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

  // Calculate word count
  const getWordCount = (content: string) => {
    return content.replace(/\s/g, '').length
  }

  // Calculate diff summary between versions
  const getDiffSummary = (oldContent: string, newContent: string) => {
    const oldWords = getWordCount(oldContent)
    const newWords = getWordCount(newContent)
    const diff = newWords - oldWords
    if (diff > 0) return `+${diff} 字`
    if (diff < 0) return `${diff} 字`
    return '无变化'
  }

  // Handle version selection
  const handleVersionSelect = (versionId: number, index: 0 | 1) => {
    const newSelected = [...selectedVersions] as [number | null, number | null]
    newSelected[index] = versionId
    setSelectedVersions(newSelected)
  }

  // Get selected version data
  const selectedVersionData = useMemo(() => {
    if (selectedVersions[0] === null && selectedVersions[1] === null) {
      return [null, null]
    }
    const v1 = selectedVersions[0] !== null 
      ? versions.find(v => v.id === selectedVersions[0])
      : null
    const v2 = selectedVersions[1] !== null
      ? versions.find(v => v.id === selectedVersions[1])
      : null
    return [v1, v2]
  }, [selectedVersions, versions])

  // Handle restore
  const handleRestore = (version: ChapterVersion) => {
    if (confirm(`确定要恢复到 "${version.title}" 版本吗？当前内容将被新版本覆盖。`)) {
      onRestore(version.content, version.title)
      onClose()
    }
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
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">📜 版本历史</h2>
            <p className="text-sm text-gray-500 mt-1">共 {versions.length} 个版本</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 text-sm rounded ${
                compareMode 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {compareMode ? '退出对比' : '版本对比'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Version List */}
          <div className={`${compareMode && selectedVersionData[0] && selectedVersionData[1] ? 'w-1/2' : 'w-full'} border-r border-gray-200 overflow-y-auto`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                加载中...
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-4xl mb-2">📜</p>
                <p>暂无版本记录</p>
                <p className="text-sm mt-1">保存章节时自动创建版本快照</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Current version */}
                <div 
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    compareMode && selectedVersions[1] === null ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => compareMode && handleVersionSelect(0 as any, 1)}
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
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={selectedVersions[1] === null}
                        onChange={() => handleVersionSelect(0 as any, 1)}
                        className="w-4 h-4 text-indigo-600"
                      />
                    )}
                  </div>
                </div>

                {/* Saved versions */}
                {versions.map((version, index) => (
                  <div 
                    key={version.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      compareMode && (
                        selectedVersions[0] === version.id || 
                        selectedVersions[1] === version.id
                      ) ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => {
                      if (compareMode) {
                        if (selectedVersions[0] === null) {
                          handleVersionSelect(version.id!, 0)
                        } else if (selectedVersions[1] === null) {
                          handleVersionSelect(version.id!, 1)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            v{versions.length - index}
                          </span>
                          {version.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(version.createdAt)} · {getWordCount(version.content)} 字
                        </div>
                        {index < versions.length && (
                          <div className="text-xs text-gray-400 mt-1">
                            相比上一版: {getDiffSummary(versions[index + 1]?.content || '', version.content)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestore(version)
                          }}
                          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          恢复
                        </button>
                        {compareMode && (
                          <input
                            type="checkbox"
                            checked={selectedVersions[0] === version.id || selectedVersions[1] === version.id}
                            onChange={() => {
                              if (selectedVersions[0] === null) {
                                handleVersionSelect(version.id!, 0)
                              } else if (selectedVersions[1] === null) {
                                handleVersionSelect(version.id!, 1)
                              }
                            }}
                            className="w-4 h-4 text-indigo-600"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diff Viewer */}
          {compareMode && selectedVersionData[0] && selectedVersionData[1] && (
            <div className="w-1/2 flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                版本对比
              </div>
              <div className="flex-1 overflow-hidden">
                <DiffViewer
                  oldContent={selectedVersionData[0].content}
                  newContent={selectedVersionData[1].content}
                  oldVersionLabel={selectedVersionData[0].title}
                  newVersionLabel={selectedVersionData[1].title}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
