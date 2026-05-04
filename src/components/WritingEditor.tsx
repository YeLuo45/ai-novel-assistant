import { useState, useEffect, useRef, useCallback } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useStore } from '../store'
import { OutlineNode } from '../db'
import AIShortcutBar from './AIShortcutBar'
import WordCountBar from './WordCountBar'
import CardReference from './CardReference'
import ViewpointSwitcher from './ViewpointSwitcher'

interface Props {
  nodeId: number
  onClose: () => void
}

export default function WritingEditor({ nodeId, onClose }: Props) {
  const { outlineNodes, updateOutlineNode, currentProject, updateDailyWordCount, todayWordCount } = useStore()
  const node = outlineNodes.find(n => n.id === nodeId)
  
  const [title, setTitle] = useState(node?.title || '')
  const [content, setContent] = useState(node?.content || '')
  const [status, setStatus] = useState(node?.status || 'writing')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [lastSavedContent, setLastSavedContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [initialWordCount, setInitialWordCount] = useState(0)
  
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Calculate breadcrumb path
  const getBreadcrumb = useCallback((): string => {
    if (!node) return ''
    
    const path: string[] = []
    let currentNode: OutlineNode | undefined = node
    
    while (currentNode) {
      path.unshift(currentNode.title)
      if (currentNode.parentId) {
        currentNode = outlineNodes.find(n => n.id === currentNode!.parentId)
      } else {
        break
      }
    }
    
    return path.join(' > ')
  }, [node, outlineNodes])

  // Calculate word count
  const wordCount = content.replace(/\s/g, '').length

  // Track initial word count when node loads
  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setContent(node.content)
      setStatus(node.status)
      setLastSavedContent(node.content)
      setInitialWordCount(node.content?.replace(/\s/g, '').length || 0)
    }
  }, [node])

  // Listen for text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim())
      } else {
        setSelectedText('')
      }
    }
    
    document.addEventListener('mouseup', handleSelectionChange)
    return () => document.removeEventListener('mouseup', handleSelectionChange)
  }, [])

  // Detect content changes
  useEffect(() => {
    setHasChanges(content !== lastSavedContent)
  }, [content, lastSavedContent])

  // Auto-save (30 seconds)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
    }
    
    saveTimerRef.current = setInterval(() => {
      if (hasChanges && !isSaving) {
        handleSave(true)
      }
    }, 30000)
    
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
      }
    }
  }, [hasChanges, isSaving, content, title, status])

  // Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content, title, status, nodeId])

  const handleSave = async (isAutoSave = false) => {
    if (!nodeId || isSaving) return
    
    setIsSaving(true)
    try {
      await updateOutlineNode(nodeId, {
        title,
        content,
        status
      })
      setLastSavedContent(content)
      setHasChanges(false)
      
      // Update daily word count
      if (currentProject?.id) {
        const newWordCount = content.replace(/\s/g, '').length
        const wordDelta = newWordCount - initialWordCount
        if (wordDelta > 0) {
          await updateDailyWordCount(currentProject.id, todayWordCount + wordDelta)
          setInitialWordCount(newWordCount)
        }
      }
      
      if (!isAutoSave) {
        // Manual save success toast (optional)
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Apply AI modification result
  const handleAIApply = (text: string) => {
    // Replace selected text or append to content end
    if (selectedText) {
      setContent(content.replace(selectedText, text))
    } else {
      setContent(content + '\n\n' + text)
    }
  }

  // Calculate project total word count and completion progress
  const totalWordCount = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)
  
  const completedChapters = outlineNodes.filter(n => n.status === 'completed').length
  const totalChapters = outlineNodes.length

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        节点不存在
      </div>
    )
  }

  return (
    <div 
      ref={editorRef}
      className={`flex flex-col h-full bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500">
            {getBreadcrumb()}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Save Status */}
          <span className="text-xs text-gray-400">
            {isSaving ? '保存中...' : hasChanges ? '有未保存的更改' : '已保存'}
          </span>
          
          {/* Status Select */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="planning">构思中</option>
            <option value="writing">写作中</option>
            <option value="completed">已完成</option>
          </select>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>

          {/* Preview Mode Toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-sm rounded ${previewMode ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title={previewMode ? '切换到编辑模式' : '切换到预览模式（可点击素材卡片）'}
          >
            {previewMode ? '编辑' : '预览'}
          </button>

          {/* Viewpoint Switcher */}
          {currentProject && (
            <ViewpointSwitcher projectId={currentProject.id!} />
          )}

          {/* Save Button */}
          <button
            onClick={() => handleSave(false)}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
          
          {/* Close */}
          <button
            onClick={() => {
              if (hasChanges) {
                if (confirm('有未保存的更改，确定要关闭吗？')) {
                  onClose()
                }
              } else {
                onClose()
              }
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
          {/* Title Input */}
          <div className="p-6 pb-0">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="章节标题"
              className="w-full text-2xl font-semibold text-gray-800 border-none outline-none placeholder-gray-300"
            />
          </div>
          
          {/* Markdown Editor / Preview */}
          <div className="p-6" data-color-mode="light">
            {previewMode ? (
              <div className="prose max-w-none min-h-[400px]">
                <CardReference content={content} />
              </div>
            ) : (
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height="100%"
                preview="edit"
                visibleDragbar={false}
                style={{
                  minHeight: '400px',
                  backgroundColor: 'transparent'
                }}
                textareaProps={{
                  placeholder: '开始写作...',
                  onMouseUp: () => {
                    const selection = window.getSelection()
                    if (selection && selection.toString().trim()) {
                      setSelectedText(selection.toString().trim())
                    }
                  }
                }}
              />
            )}
          </div>
          
          {/* Word Count */}
          <div className="px-6 pb-4 text-sm text-gray-500">
            本章字数：{wordCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bottom Word Count Bar */}
      <WordCountBar
        chapterWordCount={wordCount}
        totalWordCount={totalWordCount}
        completedChapters={completedChapters}
        totalChapters={totalChapters}
      />

      {/* AI Shortcut Bar */}
      <AIShortcutBar
        selectedText={selectedText}
        content={content}
        onApply={handleAIApply}
      />
    </div>
  )
}
