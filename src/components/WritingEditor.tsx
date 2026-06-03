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
import { ToolPanel } from './ToolPanel'
import { MaterialLibraryPanel } from './MaterialLibraryPanel'
import { OptimizationPanel } from './OptimizationPanel'
import { CustomizationPanel } from './CustomizationPanel'
import { ExportPanel } from './ExportPanel'
import { SharePanel } from './SharePanel'
import { MemoryPanel } from './MemoryPanel'
import ChapterProgressBar from './ChapterProgressBar'
import WordFrequencyPanel from './WordFrequencyPanel'
import CharacterAppearancePanel from './CharacterAppearancePanel'
import { useAutoSave } from '../hooks/useAutoSave'
import ChapterVersionHistory from './ChapterVersionHistory'

interface Props {
  nodeId: number
  onClose: () => void
}

type AssistantTab = 'ai' | 'stats' | 'memory' | 'history'

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

  // 统一侧边栏状态
  const [showAssistantSidebar, setShowAssistantSidebar] = useState(true)
  const [assistantTab, setAssistantTab] = useState<AssistantTab>('ai')

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

  // V21: 导出面板状态
  const [showExportPanel, setShowExportPanel] = useState(false)

  // V21 Phase 3: 分享面板状态
  const [showSharePanel, setShowSharePanel] = useState(false)

  // V27: 词频和人物出场面板状态
  const [showWordFrequencyPanel, setShowWordFrequencyPanel] = useState(false)
  const [showCharacterAppearancePanel, setShowCharacterAppearancePanel] = useState(false)

  // V19: 优化功能状态
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [parallelEnabled, setParallelEnabled] = useState(true)
  const [draftEnabled, setDraftEnabled] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // V31: 自动存档 Hook
  const { hasUnsavedChanges: autoSaveHasChanges, forceSave: forceAutoSave } = useAutoSave({
    content,
    title,
    chapterId: nodeId,
    projectId: currentProject?.id || 0,
    onSave: async (newContent, newTitle) => {
      if (!nodeId) return
      await updateOutlineNode(nodeId, { title: newTitle, content: newContent })
      setLastSavedContent(newContent)
    },
    onCreateVersion: async (newContent, newTitle) => {
      if (!currentProject?.id) return
      const { saveChapterVersion } = useStore.getState()
      await saveChapterVersion(nodeId, newContent, newTitle)
    },
    delay: 30000
  })

  // V17: 干预处理函数
  const handleInterventionAction = (action: UserAction) => {
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

  const wordCount = content.replace(/\s/g, '').length

  const getCurrentChapterId = () => {
    if (!node) return 1
    const titleMatch = node.title?.match(/[0-9]+/)
    return titleMatch ? parseInt(titleMatch[0], 10) : node.id || 1
  }

  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setContent(node.content)
      setStatus(node.status)
      setLastSavedContent(node.content)
      setInitialWordCount(node.content?.replace(/\s/g, '').length || 0)
    }
  }, [node])

  useEffect(() => {
    if (currentProject?.genre) {
      setProjectGenre(currentProject.genre as GenreId)
    }
  }, [currentProject])

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

  useEffect(() => {
    setHasChanges(content !== lastSavedContent)
  }, [content, lastSavedContent])

  useEffect(() => {
    const results = detectSensitiveWords(content)
    setSensitiveWordCount(results.length)
  }, [content])

  useEffect(() => {
    const currentWordCount = content.replace(/\s/g, '').length
    if (currentWordCount > 0 && status === 'planning') {
      setStatus('writing')
    }
  }, [content, status])

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
      if (currentProject?.id) {
        const newWordCount = content.replace(/\s/g, '').length
        const wordDelta = newWordCount - initialWordCount
        if (wordDelta > 0) {
          await updateDailyWordCount(currentProject.id, todayWordCount + wordDelta)
          setInitialWordCount(newWordCount)
        }
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIApply = (text: string) => {
    if (selectedText) {
      setContent(content.replace(selectedText, text))
    } else {
      setContent(content + '\n\n' + text)
    }
  }

  const handleCollaboration = async () => {
    setIsCollaborating(true)
    setCurrentPhase('decomposing')
    const enhancedContextBefore = materialContext
      ? `${materialContext}\n\n${content || ''}`
      : content || ''
    const options: CollaborationOptions = {
      projectId: currentProject?.id || 0,
      userRequest: '',
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
    } {
      setIsCollaborating(false)
    }
  }

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
    console.log('Selected version:', versionId)
  }

  const handleVersionMerge = (selections: { [versionId: string]: number[] }) => {
    console.log('Merge selections:', selections)
  }

  const totalWordCount = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)
  
  const completedChapters = outlineNodes.filter(n => n.status === 'completed').length
  const totalChapters = outlineNodes.length

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-500 font-serif-novel">
        章节不存在
      </div>
    )
  }

  return (
    <div 
      ref={editorRef}
      className={`flex h-full bg-zinc-50 dark:bg-zinc-950 ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}
    >
      {/* Left Main Writing Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Toolbar - Minimalist */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              title="返回大纲"
            >
              ← 大纲
            </button>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[240px] font-serif-novel">
              {getBreadcrumb()}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium select-none">
              {isSaving ? '正在保存...' : hasChanges ? '未保存' : '已保存'}
            </span>
            
            {/* Status Select */}
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
            >
              <option value="planning">构思中</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
            </select>
            
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

            {/* Preview Mode Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                previewMode 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={previewMode ? '切换到编辑模式' : '切换到预览模式'}
            >
              {previewMode ? '编辑' : '预览'}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏模式'}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9L4 4m0 0l4-1m-4 1l1 4m10-4l5 5m0 0l-1-4m1 4l-4-1M9 15l-5 5m0 0l4 1m-4-1l-1-4m15 4l-5-5m0 0l1 4m-1-4l4 1" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>

            {/* Toggle Assistant Sidebar */}
            <button
              onClick={() => setShowAssistantSidebar(!showAssistantSidebar)}
              className={`p-1.5 rounded-md transition-all ${
                showAssistantSidebar 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="创作助手"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

            {/* Save Button */}
            <button
              onClick={() => handleSave(false)}
              disabled={!hasChanges || isSaving}
              className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              保存
            </button>

            {/* Close Button */}
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
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              title="关闭编辑器"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Editor Body - Immersive & Focused */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950 flex justify-center">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col min-h-[500px]">
            {/* Title Input */}
            <div className="p-8 pb-4">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="章节标题"
                className="w-full text-2xl font-medium text-zinc-900 dark:text-zinc-100 border-none outline-none placeholder-zinc-300 dark:placeholder-zinc-700 bg-transparent font-serif-novel"
              />
              <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 mt-4" />
            </div>
            
            {/* Editor Container */}
            <div className="flex-1 px-8 py-2" data-color-mode="light">
              {previewMode ? (
                <div className="prose dark:prose-invert max-w-none min-h-[400px] font-serif-novel text-zinc-800 dark:text-zinc-200">
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
                    placeholder: '落笔生花，开始写作...',
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
            
            {/* Word Count Footer */}
            <div className="px-8 py-4 border-t border-zinc-100 dark:border-zinc-800/50 text-xs text-zinc-400 dark:text-zinc-500 font-serif-novel flex justify-between items-center">
              <span>本章字数：{wordCount.toLocaleString()} 字</span>
              <span className="italic opacity-60">“字字珠玑，句句斟酌”</span>
            </div>
          </div>
        </div>

        {/* Intervention Status Bar */}
        {interventionEnabled && (
          <div className="px-8 pb-4">
            <InterventionStatusBar
              status={executionStatus}
              currentPoint={currentIntervention}
              onAction={handleInterventionAction}
            />
          </div>
        )}

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

      {/* Right Assistant Sidebar - Unified & Elegant */}
      {showAssistantSidebar && (
        <div className="w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full z-20 shadow-lg">
          {/* Sidebar Tabs */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50">
            <div className="bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-lg flex gap-0.5">
              {(['ai', 'stats', 'memory', 'history'] as AssistantTab[]).map(tab => {
                const labels = { ai: 'AI 写作', stats: '统计分析', memory: '参考记忆', history: '版本历史' }
                const icons = { ai: '🤝', stats: '📊', memory: '🧠', history: '📜' }
                return (
                  <button
                    key={tab}
                    onClick={() => setAssistantTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex flex-col items-center gap-0.5 ${
                      assistantTab === tab 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-sm">{icons[tab]}</span>
                    <span className="text-[10px]">{labels[tab]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {/* Tab: AI 写作 */}
            {assistantTab === 'ai' && (
              <div className="space-y-5">
                {/* Mode Switcher */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">创作模式</h4>
                  <div className="grid grid-cols-2 gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-950">
                    <button
                      onClick={() => setCollaborationMode(false)}
                      className={`py-1.5 text-xs rounded-md transition-all ${
                        !collaborationMode 
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium' 
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      单Agent模式
                    </button>
                    <button
                      onClick={() => setCollaborationMode(true)}
                      className={`py-1.5 text-xs rounded-md transition-all ${
                        collaborationMode 
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium' 
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      多Agent协作
                    </button>
                  </div>
                </div>

                {/* Viewpoint Switcher */}
                {currentProject && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">视角设定</h4>
                    <ViewpointSwitcher projectId={currentProject.id!} />
                  </div>
                )}

                {/* AI Tools Grid */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">AI 写作工具箱</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowPlotGenerator(true)}
                      className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/10"
                    >
                      <span className="text-lg">📖</span>
                      <span className="font-medium">生成章节</span>
                    </button>
                    <button
                      onClick={() => setShowStylePanel(true)}
                      className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/10"
                    >
                      <span className="text-lg">🎨</span>
                      <span className="font-medium">文风检测</span>
                    </button>
                    <button
                      onClick={() => setShowPolishingModal(true)}
                      className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/10"
                    >
                      <span className="text-lg">✨</span>
                      <span className="font-medium">批量润色</span>
                    </button>
                    <button
                      onClick={() => setShowDialogueGenerator(true)}
                      className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/10"
                    >
                      <span className="text-lg">💬</span>
                      <span className="font-medium">生成对话</span>
                    </button>
                    <button
                      onClick={() => setShowSensitivePanel(true)}
                      className={`p-3 border rounded-lg text-xs transition-all flex flex-col items-center gap-1.5 ${
                        sensitiveWordCount > 0 
                          ? 'border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10 text-red-600 dark:text-red-400' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-lg">⚠️</span>
                      <span className="font-medium">敏感词 {sensitiveWordCount > 0 && `(${sensitiveWordCount})`}</span>
                    </button>
                    <button
                      onClick={() => setShowExportPanel(true)}
                      className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/10"
                    >
                      <span className="text-lg">📤</span>
                      <span className="font-medium">导出作品</span>
                    </button>
                  </div>
                </div>

                {/* Multi-version Generation */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">多版本生成</h4>
                  <VersionGeneratorPanel 
                    onGenerate={handleGenerateMultiVersion}
                    isLoading={isGeneratingVersions}
                  />
                </div>

                {/* Collaboration Mode UI */}
                {collaborationMode && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">多Agent协作面板</h4>
                    
                    {/* Material Library & Customization inside Sidebar */}
                    <div className="flex gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
                      <button
                        onClick={() => { setShowMaterialLibrary(false); setShowCustomizationPanel(false); }}
                        className={`flex-1 py-1 text-[10px] rounded transition-all ${
                          !showMaterialLibrary && !showCustomizationPanel ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium' : 'text-zinc-500'
                        }`}
                      >
                        协作
                      </button>
                      <button
                        onClick={() => { setShowMaterialLibrary(true); setShowCustomizationPanel(false); }}
                        className={`flex-1 py-1 text-[10px] rounded transition-all ${
                          showMaterialLibrary ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium' : 'text-zinc-500'
                        }`}
                      >
                        素材
                      </button>
                      <button
                        onClick={() => { setShowMaterialLibrary(false); setShowCustomizationPanel(true); }}
                        className={`flex-1 py-1 text-[10px] rounded transition-all ${
                          showCustomizationPanel ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium' : 'text-zinc-500'
                        }`}
                      >
                        定制
                      </button>
                    </div>

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
                      <div className="space-y-4">
                        {/* Real-time Intervention Toggle */}
                        <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={interventionEnabled}
                              onChange={(e) => setInterventionEnabled(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">启用实时干预</span>
                          </label>
                        </div>

                        {/* Optimization Panel */}
                        <OptimizationPanel
                          cacheEnabled={cacheEnabled}
                          onCacheToggle={setCacheEnabled}
                          parallelEnabled={parallelEnabled}
                          onParallelToggle={setParallelEnabled}
                          draftEnabled={draftEnabled}
                          onDraftToggle={setDraftEnabled}
                        />

                        {/* Genre Selector */}
                        <GenreSelector 
                          value={projectGenre} 
                          onChange={setProjectGenre} 
                        />

                        {/* Collaboration Visualizer */}
                        <CollaborationVisualizer
                          subtasks={collaborationSubtasks}
                          outputs={collaborationOutputs}
                          currentPhase={currentPhase}
                          criticReport={criticReport}
                        />

                        {/* Critic Report */}
                        {(criticReport || isCriticLoading) && (
                          <CriticReportPanel report={criticReport} isLoading={isCriticLoading} />
                        )}

                        {/* Action Trigger */}
                        {!isCollaborating && !collaborationResult && (
                          <button 
                            onClick={handleCollaboration} 
                            className="w-full py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                          >
                            🤝 开始多Agent协作
                          </button>
                        )}

                        {/* Loading State */}
                        {isCollaborating && (
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2 justify-center">
                              <span className="animate-spin text-sm">⚙️</span>
                              <span>AI 专家团队正在协作创作...</span>
                            </div>
                          </div>
                        )}

                        {/* Collaboration Result */}
                        {collaborationResult && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">✨ 最终生成结果</h5>
                            <textarea
                              value={collaborationResult}
                              onChange={(e) => setCollaborationResult(e.target.value)}
                              className="w-full h-48 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                          </div>
                        )}

                        {/* Genre Metrics */}
                        {projectGenre && (
                          <GenreMetricsPanel 
                            genreId={projectGenre} 
                            result={genreDetectionResult}
                          />
                        )}

                        {/* Expert Detail Panels */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">专家团队输出</h5>
                          <div className="grid grid-cols-1 gap-2">
                            <ExpertDetailPanel agentId="PlotExpert" output={collaborationOutputs.get('PlotExpert')} />
                            <ExpertDetailPanel agentId="DialogueMaster" output={collaborationOutputs.get('DialogueMaster')} />
                            <ExpertDetailPanel agentId="StyleGuard" output={collaborationOutputs.get('StyleGuard')} />
                            <ExpertDetailPanel agentId="CriticAgent" output={collaborationOutputs.get('CriticAgent')} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: 统计分析 */}
            {assistantTab === 'stats' && (
              <div className="space-y-6">
                {/* Chapter Progress */}
                {nodeId && currentProject && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">章节进度</h4>
                    <ChapterProgressBar
                      projectId={currentProject.id}
                      chapterId={nodeId}
                      currentWordCount={wordCount}
                      defaultTarget={3000}
                    />
                  </div>
                )}

                {/* Word Frequency */}
                {currentProject && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">词频统计</h4>
                    <WordFrequencyPanel
                      fullText={outlineNodes.reduce((sum, n) => sum + (n.content || ''), '')}
                      chapterText={content}
                      isOpen={true}
                      onToggle={() => {}}
                    />
                  </div>
                )}

                {/* Character Appearance */}
                {currentProject && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">人物出场</h4>
                    <CharacterAppearancePanel
                      projectId={currentProject.id}
                      outlineNodes={outlineNodes}
                      isOpen={true}
                      onToggle={() => {}}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab: 参考记忆 */}
            {assistantTab === 'memory' && (
              <div className="space-y-6">
                {/* Memory Panel */}
                {currentProject && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">世界观与设定记忆</h4>
                    <MemoryPanel
                      isOpen={true}
                      onClose={() => {}}
                      projectId={currentProject.id || 0}
                      currentChapter={node?.id || 1}
                    />
                  </div>
                )}

                {/* Character State & Foreshadowing Panels */}
                {currentProject && (
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">人物状态与伏笔</h4>
                    <div className="space-y-4">
                      <CharacterStatePanel projectId={currentProject.id || 0} />
                      <ForeshadowingPanel 
                        projectId={currentProject.id || 0} 
                        currentChapterId={getCurrentChapterId()} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: 版本历史 */}
            {assistantTab === 'history' && (
              <div className="space-y-4 h-full flex flex-col">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">版本历史记录</h4>
                {currentProject && (
                  <div className="flex-1 min-h-0">
                    <ChapterVersionHistory
                      chapterId={nodeId}
                      projectId={currentProject.id}
                      currentContent={content}
                      currentTitle={title}
                      onRestore={(restoredContent, restoredTitle) => {
                        setContent(restoredContent)
                        setTitle(restoredTitle)
                      }}
                      onClose={() => {}}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChapterPlotGeneratorModal
        isOpen={showPlotGenerator}
        onClose={() => setShowPlotGenerator(false)}
        onInsert={(generatedContent, generatedTitle, targetNodeId) => {
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
          for (const result of results) {
            if (result.success) {
              try {
                await applyPolishingResult(result)
              } catch (err) {
                console.error(`Failed to apply result for chapter ${result.chapterId}:`, err)
              }
            }
          }
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

      {/* Export Panel */}
      {showExportPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl max-w-lg w-full">
            <button
              onClick={() => setShowExportPanel(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg"
            >
              ✕
            </button>
            <ExportPanel
              content={content}
              metadata={{
                title: title || '无标题',
                author: currentProject?.title || '未知作者',
                createdAt: currentProject?.createdAt?.getTime() || Date.now(),
                wordCount: content.replace(/\s/g, '').length
              }}
            />
          </div>
        </div>
      )}

      {/* Share Panel */}
      {showSharePanel && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-2xl max-w-md w-full">
            <button
              onClick={() => setShowSharePanel(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg"
            >
              ✕
            </button>
            <SharePanel
              projectId={currentProject.id?.toString() || ''}
            />
          </div>
        </div>
      )}

      {/* Version Compare Modal */}
      {showVersionCompare && versions.length > 0 && comparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <VersionCompareModal
            versions={versions}
            comparison={comparison}
            onSelect={handleVersionSelect}
            onMerge={handleVersionMerge}
            onClose={() => setShowVersionCompare(false)}
          />
        </div>
      )}

      {/* Intervention Review Panel */}
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
