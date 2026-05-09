import { useState, useEffect, useRef, useCallback } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useStore } from '../store'
import { OutlineNode, db } from '../db'
import AIShortcutBar from './AIShortcutBar'
import WordCountBar from './WordCountBar'
import CardReference from './CardReference'
import ViewpointSwitcher from './ViewpointSwitcher'
import ChapterPlotGeneratorModal from './ChapterPlotGeneratorModal'
import BatchPolishingModal from './BatchPolishingModal'
import StyleConsistencyPanel from './StyleConsistencyPanel'
import DialogueGeneratorModal from './DialogueGeneratorModal'
import VersionHistoryPanel from './VersionHistoryPanel'
import SensitiveWordPanel from './SensitiveWordPanel'
import { applyPolishingResult } from '../ai/batchPolishing'
import { detectSensitiveWords } from '../utils/sensitiveDetector'
import { CollaborationOrchestrator, type CollaborationOptions } from '@/ai/collaboration'
import { CollaborationVisualizer } from './CollaborationVisualizer'
import { ExpertDetailPanel } from './ExpertDetailPanel'
import { CriticReportPanel } from './CriticReportPanel'
import { ForeshadowingPanel } from './ForeshadowingPanel'
import { CharacterStatePanel } from './CharacterStatePanel'
import { MemoryDashboard } from './MemoryDashboard'
import { GenreSelector } from './GenreSelector'
import { GenreMetricsPanel } from './GenreMetricsPanel'
import { VersionGeneratorPanel } from './VersionGeneratorPanel'
import { VersionCompareModal } from './VersionCompareModal'
import { multiVersionGenerator } from '@/ai/versioning/MultiVersionGenerator'
import { versionComparator } from '@/ai/versioning/VersionComparator'
import type { WritingVersion, VersionComparison, VersionOptions } from '@/ai/versioning/types'
import type { Subtask, AgentOutput, AgentId, CriticReport } from '@/ai/collaboration/types'
import type { CollaborationSession } from '@/ai/collaboration/types'
import type { GenreId, GenreDetectionResult } from '@/ai/genres/types'
import { InterventionStatusBar } from './InterventionStatusBar'
import { InterventionReviewPanel } from './InterventionReviewPanel'
import { useInterventionHotkeys } from '@/hooks/useInterventionHotkeys'
import type { ExecutionStatus, UserAction, InterventionPoint } from '@/ai/intervention/types'
import { MaterialLibraryPanel } from './MaterialLibraryPanel'
import { OptimizationPanel } from './OptimizationPanel'
import { CustomizationPanel } from './CustomizationPanel'

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
  const [showPlotGenerator, setShowPlotGenerator] = useState(false)
  const [showPolishingModal, setShowPolishingModal] = useState(false)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [showDialogueGenerator, setShowDialogueGenerator] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showSensitivePanel, setShowSensitivePanel] = useState(false)
  const [sensitiveWordCount, setSensitiveWordCount] = useState(0)

  // 多Agent协作状态
  const [collaborationMode, setCollaborationMode] = useState(false)
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [collaborationResult, setCollaborationResult] = useState<string>('')
  const [collaborationSubtasks, setCollaborationSubtasks] = useState<Subtask[]>([])
  const [collaborationOutputs, setCollaborationOutputs] = useState<Map<AgentId, AgentOutput>>(new Map())
  const [currentPhase, setCurrentPhase] = useState<CollaborationSession['status']>('decomposing')
  const [criticReport, setCriticReport] = useState<CriticReport | null>(null)
  const [isCriticLoading, setIsCriticLoading] = useState(false)
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  
  // V15: 类型系统状态
  const [projectGenre, setProjectGenre] = useState<GenreId | undefined>(undefined)
  const [genreDetectionResult, setGenreDetectionResult] = useState<GenreDetectionResult | null>(null)
  
  // V16: 多版本生成状态
  const [versions, setVersions] = useState<WritingVersion[]>([])
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [isGeneratingVersions, setIsGeneratingVersions] = useState(false)

  // V17: 干预功能状态
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle')
  const [currentIntervention, setCurrentIntervention] = useState<InterventionPoint | null>(null)
  const [interventionEnabled, setInterventionEnabled] = useState(false)

  // V18: 素材库状态
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false)

  // V20: 定制面板状态
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false)
  const [materialContext, setMaterialContext] = useState('')

  // V19: 优化功能状态
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [parallelEnabled, setParallelEnabled] = useState(true)
  const [draftEnabled, setDraftEnabled] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // V17: 干预处理函数
  const handleInterventionAction = (action: UserAction) => {
    // 调用 orchestrator.handleUserIntervention
    // 这里简化处理，直接调用干预管理器的处理
    console.log('Intervention action:', action)
    if (action.type === 'approve' || action.type === 'modify' || action.type === 'skip') {
      setCurrentIntervention(null)
      setExecutionStatus('running')
    } else if (action.type === 'reject') {
      setCurrentIntervention(null)
      setExecutionStatus('running')
    } else if (action.type === 'pause') {
      setExecutionStatus('paused')
    } else if (action.type === 'rerun') {
      setCurrentIntervention(null)
      setExecutionStatus('running')
    }
  }

  // V17: 注册快捷键
  useInterventionHotkeys(handleInterventionAction, executionStatus === 'waiting_approval')

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

  // Get current chapter ID from node title or id
  const getCurrentChapterId = () => {
    if (!node) return 1
    const titleMatch = node.title?.match(/[0-9]+/)
    return titleMatch ? parseInt(titleMatch[0], 10) : node.id || 1
  }

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

  // V15: Load project genre when currentProject changes
  useEffect(() => {
    if (currentProject?.genre) {
      setProjectGenre(currentProject.genre as GenreId)
    }
  }, [currentProject])

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

  // Detect sensitive words
  useEffect(() => {
    const results = detectSensitiveWords(content)
    setSensitiveWordCount(results.length)
  }, [content])

  // Progress sync: auto-set status to 'writing' when content has words
  useEffect(() => {
    const currentWordCount = content.replace(/\s/g, '').length
    if (currentWordCount > 0 && status === 'planning') {
      setStatus('writing')
    }
  }, [content, status])

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
      
      // Create version snapshot (only for significant changes)
      if (currentProject?.id && content !== lastSavedContent) {
        const wordCountDiff = Math.abs(content.replace(/\s/g, '').length - lastSavedContent.replace(/\s/g, '').length)
        if (wordCountDiff > 50 || isAutoSave) {
          try {
            await db.chapterVersions.add({
              chapterId: nodeId,
              projectId: currentProject.id,
              content: lastSavedContent,
              title: title,
              createdAt: new Date()
            })
          } catch (err) {
            console.error('Failed to create version snapshot:', err)
          }
        }
      }
      
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

  // 多Agent协作处理函数
  const handleCollaboration = async () => {
    setIsCollaborating(true)
    setCurrentPhase('decomposing')

    // V18: 将素材上下文传递给协作引擎
    const enhancedContextBefore = materialContext
      ? `${materialContext}\n\n${content || ''}`
      : content || ''

    const options: CollaborationOptions = {
      projectId: currentProject?.id || 0,
      userRequest: '',  // 实际使用时从表单或输入框获取
      viewpoint: 'third_person_limited',
      povCharacter: '主角',
      genre: currentProject?.genre || '玄幻',
      contextBefore: enhancedContextBefore,
      contextAfter: '',
      chapterTitle: title || '新章节',
      chapterOutline: '',
      targetWordCount: 3000
    }

    try {
      const orchestrator = new CollaborationOrchestrator(options)
      const result = await orchestrator.start()
      setCollaborationResult(result)
      setCurrentPhase('done')
    } catch (error) {
      console.error('协作失败:', error)
      setCurrentPhase('failed')
    } finally {
      setIsCollaborating(false)
    }
  }

  // V16: 多版本生成处理函数
  const handleGenerateMultiVersion = async (options: VersionOptions) => {
    setIsGeneratingVersions(true)
    try {
      const generatedVersions = await multiVersionGenerator.generateVersions(
        content,
        options
      )
      setVersions(generatedVersions)
      
      const comparisonResult = versionComparator.compare(generatedVersions)
      setComparison(comparisonResult)
      setShowVersionCompare(true)
    } finally {
      setIsGeneratingVersions(false)
    }
  }

  const handleVersionSelect = (versionId: string) => {
    // 可以保存用户选择
    console.log('Selected version:', versionId)
  }

  const handleVersionMerge = (selections: { [versionId: string]: number[] }) => {
    // 处理合并
    console.log('Merge selections:', selections)
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

          {/* Mode Switcher */}
          <div className="flex gap-1 border rounded-lg p-1 bg-gray-100">
            <button
              onClick={() => setCollaborationMode(false)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                !collaborationMode 
                  ? 'bg-white shadow text-indigo-700 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 单Agent模式
            </button>
            <button
              onClick={() => setCollaborationMode(true)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                collaborationMode 
                  ? 'bg-white shadow text-indigo-700 font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🤝 多Agent协作模式
            </button>
          </div>

          {/* Viewpoint Switcher */}
          {currentProject && (
            <ViewpointSwitcher projectId={currentProject.id!} />
          )}

          {/* AI Tools */}
          <button
            onClick={() => setShowPlotGenerator(true)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
            title="AI章节生成"
          >
            📖 生成章节
          </button>
          
          <button
            onClick={() => setShowStylePanel(true)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
            title="文风检测"
          >
            🎨 文风检测
          </button>
          
          <button
            onClick={() => setShowPolishingModal(true)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
            title="批量润色"
          >
            ✨ 批量润色
          </button>

          <button
            onClick={() => setShowDialogueGenerator(true)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
            title="生成对话"
          >
            💬 生成对话
          </button>

          {/* Version History */}
          <button
            onClick={() => setShowVersionHistory(true)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
            title="版本历史"
          >
            📜 版本历史
          </button>

          {/* Sensitive Word Detection */}
          <button
            onClick={() => setShowSensitivePanel(true)}
            className={`px-3 py-1.5 text-sm rounded ${
              sensitiveWordCount > 0 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="敏感词检测"
          >
            ⚠️ 敏感词 {sensitiveWordCount > 0 && `(${sensitiveWordCount})`}
          </button>

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

        {/* V17: 干预状态栏 */}
        {interventionEnabled && (
          <div className="mb-4">
            <InterventionStatusBar
              status={executionStatus}
              currentPoint={currentIntervention}
              onAction={handleInterventionAction}
            />
          </div>
        )}

        {/* Collaboration Mode UI */}
        {collaborationMode && (
          <div className="collaboration-ui mt-6">
            {/* 素材库/定制面板切换按钮 */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => { setShowMaterialLibrary(false); setShowCustomizationPanel(false); }}
                className={`flex-1 px-4 py-2 text-sm ${
                  !showMaterialLibrary && !showCustomizationPanel ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600'
                }`}
              >
                协作写作
              </button>
              <button
                onClick={() => { setShowMaterialLibrary(true); setShowCustomizationPanel(false); }}
                className={`flex-1 px-4 py-2 text-sm ${
                  showMaterialLibrary ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600'
                }`}
              >
                📚 素材库
              </button>
              <button
                onClick={() => { setShowMaterialLibrary(false); setShowCustomizationPanel(true); }}
                className={`flex-1 px-4 py-2 text-sm ${
                  showCustomizationPanel ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600'
                }`}
              >
                ⚙️ 定制
              </button>
            </div>

            {/* 素材库/定制面板 */}
            {showMaterialLibrary ? (
              <MaterialLibraryPanel
                onApplyContext={(context) => {
                  setMaterialContext(context)
                  setShowMaterialLibrary(false)
                }}
              />
            ) : showCustomizationPanel ? (
              <CustomizationPanel />
            ) : (
              <>
                {/* 干预控制 */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interventionEnabled}
                      onChange={(e) => setInterventionEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">启用实时干预</span>
                  </label>
                </div>

                {/* V19: 优化面板 */}
                <div className="mb-4">
                  <OptimizationPanel
                    cacheEnabled={cacheEnabled}
                    onCacheToggle={setCacheEnabled}
                    parallelEnabled={parallelEnabled}
                    onParallelToggle={setParallelEnabled}
                    draftEnabled={draftEnabled}
                    onDraftToggle={setDraftEnabled}
                  />
                </div>

                {/* 协作可视化 */}
                <CollaborationVisualizer
                  subtasks={collaborationSubtasks}
                  outputs={collaborationOutputs}
                  currentPhase={currentPhase}
                  criticReport={criticReport}
                />

            {/* CriticAgent 评审结果 */}
            {collaborationMode && (criticReport || isCriticLoading) && (
              <div className="mt-4">
                <CriticReportPanel report={criticReport} isLoading={isCriticLoading} />
              </div>
            )}

            {/* 记忆面板切换 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className={`px-3 py-1 rounded text-sm ${showMemoryPanel ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}
              >
                🔮 记忆面板
              </button>
            </div>

            {/* V15: 类型选择 */}
            <div className="mb-4">
              <GenreSelector 
                value={projectGenre} 
                onChange={setProjectGenre} 
              />
            </div>

            {/* 记忆面板内容 */}
            {showMemoryPanel && currentProject && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CharacterStatePanel projectId={currentProject.id || 0} />
                <ForeshadowingPanel 
                  projectId={currentProject.id || 0} 
                  currentChapterId={getCurrentChapterId()} 
                />
              </div>
            )}

            {/* 执行按钮 */}
            {!isCollaborating && !collaborationResult && (
              <button 
                onClick={handleCollaboration} 
                className="btn-primary mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                🤝 开始多Agent协作
              </button>
            )}

            {/* 加载中 */}
            {isCollaborating && (
              <div className="loading-state mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  <span>AI 专家团队正在协作创作，请稍候...</span>
                </div>
              </div>
            )}

            {/* 最终结果 */}
            {collaborationResult && (
              <div className="result-section mt-4">
                <h4 className="font-bold mb-2">✨ 协作完成</h4>
                <textarea
                  value={collaborationResult}
                  onChange={(e) => setCollaborationResult(e.target.value)}
                  className="w-full h-64 p-2 border rounded"
                />
              </div>
            )}

            {/* V15: 类型检测结果面板 */}
            {collaborationMode && projectGenre && (
              <div className="mt-4">
                <GenreMetricsPanel 
                  genreId={projectGenre} 
                  result={genreDetectionResult}
                />
              </div>
            )}

            {/* Expert Detail Panel */}
            <div className="expert-panels mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <ExpertDetailPanel agentId="PlotExpert" output={collaborationOutputs.get('PlotExpert')} />
              <ExpertDetailPanel agentId="DialogueMaster" output={collaborationOutputs.get('DialogueMaster')} />
              <ExpertDetailPanel agentId="StyleGuard" output={collaborationOutputs.get('StyleGuard')} />
              <ExpertDetailPanel agentId="CriticAgent" output={collaborationOutputs.get('CriticAgent')} />
            </div>
              </>
            )}
          </div>
        )}

        {/* V16: 多版本生成 */}
        <div className="mt-4 p-4 border-t">
          <VersionGeneratorPanel 
            onGenerate={handleGenerateMultiVersion}
            isLoading={isGeneratingVersions}
          />
        </div>

        {/* V16: 版本对比弹窗 */}
        {showVersionCompare && versions.length > 0 && comparison && (
          <VersionCompareModal
            versions={versions}
            comparison={comparison}
            onSelect={handleVersionSelect}
            onMerge={handleVersionMerge}
            onClose={() => setShowVersionCompare(false)}
          />
        )}
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

      {/* Modals */}
      <ChapterPlotGeneratorModal
        isOpen={showPlotGenerator}
        onClose={() => setShowPlotGenerator(false)}
        onInsert={(generatedContent, generatedTitle, targetNodeId) => {
          // Insert generated content
          if (targetNodeId === nodeId) {
            setContent(generatedContent)
            setTitle(generatedTitle)
          }
          setShowPlotGenerator(false)
        }}
        preselectedNodeId={nodeId}
      />

      <BatchPolishingModal
        isOpen={showPolishingModal}
        onClose={() => setShowPolishingModal(false)}
        onApplyResults={async (results) => {
          // Apply polishing results
          for (const result of results) {
            if (result.success) {
              try {
                await applyPolishingResult(result)
              } catch (err) {
                console.error(`Failed to apply result for chapter ${result.chapterId}:`, err)
              }
            }
          }
          // Refresh content if current chapter was polished
          const currentResult = results.find(r => r.chapterId === nodeId)
          if (currentResult?.success) {
            setContent(currentResult.polishedContent)
          }
        }}
        preselectedChapterIds={[nodeId]}
      />

      <StyleConsistencyPanel
        isOpen={showStylePanel}
        onClose={() => setShowStylePanel(false)}
        chapterId={nodeId}
      />

      <DialogueGeneratorModal
        isOpen={showDialogueGenerator}
        onClose={() => setShowDialogueGenerator(false)}
        onInsert={(dialogue) => {
          // Insert dialogue at cursor or append to content end
          setContent(content + '\n\n' + dialogue)
          setShowDialogueGenerator(false)
        }}
      />

      <VersionHistoryPanel
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        chapterId={nodeId}
        projectId={currentProject?.id || 0}
        currentContent={content}
        currentTitle={title}
        onRestore={(restoredContent, restoredTitle) => {
          setContent(restoredContent)
          setTitle(restoredTitle)
        }}
      />

      <SensitiveWordPanel
        isOpen={showSensitivePanel}
        onClose={() => setShowSensitivePanel(false)}
        content={content}
        onReplace={(newContent) => {
          setContent(newContent)
        }}
      />

      {/* V17: 干预审核面板 */}
      {currentIntervention && executionStatus === 'waiting_approval' && (
        <InterventionReviewPanel
          point={currentIntervention}
          onAction={handleInterventionAction}
          onCancel={() => setCurrentIntervention(null)}
        />
      )}
    </div>
  )
}
