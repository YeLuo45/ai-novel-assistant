import { useState, useEffect, useRef, useCallback } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useStore } from '../store'
import { OutlineNode } from '../db'
import AIAssistBar from './AIAssistBar'
import WordCountBar from './WordCountBar'
import CardReference from './CardReference'

interface Props {
  nodeId: number
  onClose: () => void
}

export default function WritingEditor({ nodeId, onClose }: Props) {
  const { outlineNodes, updateOutlineNode } = useStore()
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
  
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // 计算面包屑路径
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

  // 计算字数
  const wordCount = content.replace(/\s/g, '').length

  // 监听文字选中
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

  // 检测内容变化
  useEffect(() => {
    setHasChanges(content !== lastSavedContent)
  }, [content, lastSavedContent])

  // 自动保存（30秒）
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

  // Ctrl+S 保存
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

  // 内容变化时更新 node（用于其他组件获取最新内容）
  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setContent(node.content)
      setStatus(node.status)
      setLastSavedContent(node.content)
    }
  }, [node])

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
      
      if (!isAutoSave) {
        // 手动保存成功提示（可添加 toast）
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 应用 AI 修改结果
  const handleAIApply = (text: string) => {
    // 替换选中文本或追加到内容末尾
    if (selectedText) {
      setContent(content.replace(selectedText, text))
    } else {
      setContent(content + '\n\n' + text)
    }
  }

  // 计算项目总字数和完成进度
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
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 面包屑 */}
          <div className="text-sm text-gray-500">
            {getBreadcrumb()}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 保存状态 */}
          <span className="text-xs text-gray-400">
            {isSaving ? '保存中...' : hasChanges ? '有未保存的更改' : '已保存'}
          </span>
          
          {/* 状态选择 */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="planning">构思中</option>
            <option value="writing">写作中</option>
            <option value="completed">已完成</option>
          </select>
          
          {/* 全屏切换 */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>

          {/* 预览模式切换 */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-sm rounded ${previewMode ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title={previewMode ? '切换到编辑模式' : '切换到预览模式（可点击素材卡片）'}
          >
            {previewMode ? '编辑' : '预览'}
          </button>

          {/* 保存按钮 */}
          <button
            onClick={() => handleSave(false)}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
          
          {/* 关闭 */}
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

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
          {/* 标题输入 */}
          <div className="p-6 pb-0">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="章节标题"
              className="w-full text-2xl font-semibold text-gray-800 border-none outline-none placeholder-gray-300"
            />
          </div>
          
          {/* Markdown 编辑器 / 预览 */}
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
          
          {/* 字数统计 */}
          <div className="px-6 pb-4 text-sm text-gray-500">
            本章字数：{wordCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 底部字数栏 */}
      <WordCountBar
        chapterWordCount={wordCount}
        totalWordCount={totalWordCount}
        completedChapters={completedChapters}
        totalChapters={totalChapters}
      />

      {/* AI 辅助浮窗 */}
      <AIAssistBar
        selectedText={selectedText}
        content={content}
        onApply={handleAIApply}
      />
    </div>
  )
}
