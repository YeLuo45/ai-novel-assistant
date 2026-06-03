import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../db'
import OutlineTree from '../components/OutlineTree'
import WritingEditor from '../components/WritingEditor'
import { MaterialPanel } from '../components/MaterialPanel'
import WorldbuildingTab from '../components/WorldbuildingTab'
import DailyGoalTracker from '../components/DailyGoalTracker'
import CharacterRelationshipList from '../components/CharacterRelationshipList'
import TimelineView from '../components/TimelineView'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'

type Tab = 'outline' | 'storyline' | 'worldbuilding' | 'relationships' | 'timeline'

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { 
    currentProject, setCurrentProject, 
    outlineNodes, loadOutline,
    createOutlineNode, updateOutlineNode, deleteOutlineNode, moveOutlineNode,
    currentNodeId, setCurrentNodeId,
    storylines, loadStorylines, createStoryline, updateStoryline, deleteStoryline,
    chapterStorylineLinks, loadChapterStorylineLinks, addChapterStorylineLink, removeChapterStorylineLink,
    totalWordGoal,
    showGoalTracker = true
  } = useStore()
  
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storyline', 'worldbuilding', 'relationships', 'timeline'].includes(tab)) {
      return tab as Tab
    }
    return 'outline'
  })
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [editingNode, setEditingNode] = useState<number | null>(null)
  const [showMaterialPanel, setShowMaterialPanel] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [nodeForm, setNodeForm] = useState<{
    type: 'volume' | 'chapter' | 'section' | 'scene'
    title: string
    summary: string
    content: string
    status: 'planning' | 'writing' | 'completed'
  }>({
    type: 'chapter',
    title: '',
    summary: '',
    content: '',
    status: 'planning'
  })

  // Storyline form state
  const [showStorylineModal, setShowStorylineModal] = useState(false)
  const [editingStoryline, setEditingStoryline] = useState<number | null>(null)
  const [storylineForm, setStorylineForm] = useState({ name: '', color: '#18181b' })

  // Calculate total book words
  const totalBookWords = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setShowMaterialPanel(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return
      const projectId = parseInt(id)
      const project = await db.projects.get(projectId)
      if (project) {
        setCurrentProject(project)
        loadOutline(projectId)
        loadStorylines(projectId)
        loadChapterStorylineLinks(projectId)
      } else {
        navigate('/projects')
      }
    }
    loadProject()
  }, [id])

  const handleAddNode = async () => {
    if (!id || !nodeForm.title.trim()) return
    await createOutlineNode({
      projectId: parseInt(id),
      parentId: editingNode,
      type: nodeForm.type,
      title: nodeForm.title.trim(),
      summary: nodeForm.summary,
      content: nodeForm.content,
      status: nodeForm.status,
      order: outlineNodes.filter(n => n.parentId === editingNode).length
    })
    setShowNodeModal(false)
    resetNodeForm()
  }

  const handleUpdateNode = async () => {
    if (!editingNode || !nodeForm.title.trim()) return
    await updateOutlineNode(editingNode, {
      title: nodeForm.title.trim(),
      summary: nodeForm.summary,
      content: nodeForm.content,
      status: nodeForm.status,
      type: nodeForm.type
    })
    setShowNodeModal(false)
    setEditingNode(null)
    resetNodeForm()
  }

  const resetNodeForm = () => {
    setNodeForm({
      type: 'chapter',
      title: '',
      summary: '',
      content: '',
      status: 'planning'
    })
  }

  const openEditModal = (nodeId: number) => {
    const node = outlineNodes.find(n => n.id === nodeId)
    if (node) {
      setEditingNode(nodeId)
      setNodeForm({
        type: node.type,
        title: node.title,
        summary: node.summary,
        content: node.content,
        status: node.status
      })
      setShowNodeModal(true)
    }
  }

  const openAddModal = (parentId: number | null, type: 'volume' | 'chapter' | 'section' | 'scene') => {
    setEditingNode(parentId)
    setNodeForm({ ...nodeForm, type })
    setShowNodeModal(true)
  }

  const handleDeleteNode = async (nodeId: number) => {
    if (confirm('确定要删除这个节点及其子节点吗？')) {
      await deleteOutlineNode(nodeId)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    await moveOutlineNode(parseInt(draggableId), null, destination.index)
  }

  // Open WritingEditor
  const handleOpenNode = (nodeId: number) => {
    setCurrentNodeId(nodeId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  // Close WritingEditor
  const handleCloseEditor = () => {
    setCurrentNodeId(null)
  }

  // Storyline management
  const handleAddStoryline = async () => {
    if (!id || !storylineForm.name.trim()) return
    await createStoryline({
      projectId: parseInt(id),
      name: storylineForm.name.trim(),
      color: storylineForm.color
    })
    setShowStorylineModal(false)
    setStorylineForm({ name: '', color: '#18181b' })
  }

  const handleUpdateStoryline = async () => {
    if (!editingStoryline || !storylineForm.name.trim()) return
    await updateStoryline(editingStoryline, {
      name: storylineForm.name.trim(),
      color: storylineForm.color
    })
    setShowStorylineModal(false)
    setEditingStoryline(null)
    setStorylineForm({ name: '', color: '#18181b' })
  }

  const handleDeleteStoryline = async (storylineId: number) => {
    if (confirm('确定要删除这个故事线吗？')) {
      await deleteStoryline(storylineId)
    }
  }

  const toggleChapterStoryline = async (chapterId: number, storylineId: number) => {
    const exists = chapterStorylineLinks.some(
      l => l.chapterId === chapterId && l.storylineId === storylineId
    )
    if (exists) {
      await removeChapterStorylineLink(chapterId, storylineId)
    } else {
      await addChapterStorylineLink({ chapterId, storylineId })
    }
  }

  const getChapterStorylineColors = (chapterId: number) => {
    const links = chapterStorylineLinks.filter(l => l.chapterId === chapterId)
    return links
      .map(l => storylines.find(s => s.id === l.storylineId))
      .filter(Boolean)
  }

  const mobileTabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'outline', icon: '📋', label: '大纲' },
    { key: 'worldbuilding', icon: '🌍', label: '世界' },
    { key: 'timeline', icon: '📅', label: '时间' },
  ]

  const desktopTabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'outline', icon: '📋', label: '大纲' },
    { key: 'storyline', icon: '📖', label: '故事线' },
    { key: 'worldbuilding', icon: '🌍', label: '世界观' },
    { key: 'relationships', icon: '👥', label: '关系图' },
    { key: 'timeline', icon: '📅', label: '时间线' },
  ]

  const tabs = isMobile ? mobileTabs : desktopTabs

  if (!currentProject) return null

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'relative w-80'}
        bg-white dark:bg-zinc-900/50 backdrop-blur-md border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Project Info Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-zinc-900 dark:text-zinc-100 font-serif-novel truncate" title={currentProject.title}>
                {currentProject.title}
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 tracking-wide">
                {currentProject.genre || '未分类'}
              </p>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-target"
                aria-label="关闭"
              >
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Compact Capsule Tab Navigation */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/30">
          <div className="bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-lg flex flex-wrap gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                  activeTab === tab.key 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span className={isMobile ? 'text-[10px]' : ''}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'outline' && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto min-h-0">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="outline">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        <OutlineTree
                          nodes={outlineNodes.filter(n => n.parentId === null)}
                          allNodes={outlineNodes}
                          onEdit={openEditModal}
                          onDelete={handleDeleteNode}
                          onAddChild={openAddModal}
                          onOpenNode={handleOpenNode}
                          activeNodeId={currentNodeId}
                          storylines={storylines}
                          chapterStorylineLinks={chapterStorylineLinks}
                          totalBookWords={totalBookWords}
                          totalBookGoal={totalWordGoal}
                        />
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
              
              <button
                onClick={() => openAddModal(null, 'volume')}
                className="w-full mt-4 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all touch-target font-medium"
              >
                + 添加新卷
              </button>
            </div>
          )}

          {activeTab === 'worldbuilding' && (
            <div className="h-full overflow-hidden">
              <WorldbuildingTab />
            </div>
          )}

          {activeTab === 'relationships' && currentProject && !isMobile && (
            <div className="h-full overflow-hidden">
              <CharacterRelationshipList projectId={currentProject.id!} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="h-full overflow-hidden">
              <TimelineView
                onEditNode={openEditModal}
                onOpenNode={handleOpenNode}
              />
            </div>
          )}

          {activeTab === 'storyline' && !isMobile && (
            <div className="p-4 space-y-6">
              {/* Storyline List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">故事线列表</h4>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {storylines.map(storyline => (
                    <div 
                      key={storyline.id}
                      className="flex items-center gap-3 p-2.5 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-lg group"
                    >
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-4 ring-zinc-100 dark:ring-zinc-900"
                        style={{ backgroundColor: storyline.color }}
                      />
                      <span className="flex-1 text-xs truncate text-zinc-700 dark:text-zinc-200 font-medium">{storyline.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingStoryline(storyline.id!)
                            setStorylineForm({ name: storyline.name, color: storyline.color })
                            setShowStorylineModal(true)
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-1.5 py-1"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteStoryline(storyline.id!)}
                          className="text-[10px] text-zinc-400 hover:text-red-600 px-1.5 py-1"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingStoryline(null)
                  setStorylineForm({ name: '', color: '#18181b' })
                  setShowStorylineModal(true)
                }}
                className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all touch-target"
              >
                + 添加故事线
              </button>

              {/* Chapter-Storyline Assignment */}
              {storylines.length > 0 && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">章节故事线分配</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {outlineNodes.filter(n => n.type === 'chapter').map(chapter => {
                      return (
                        <div key={chapter.id} className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                          <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 truncate">
                            {chapter.title}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {storylines.map(storyline => {
                              const isLinked = chapterStorylineLinks.some(
                                l => l.chapterId === chapter.id && l.storylineId === storyline.id
                              )
                              return (
                                <button
                                  key={storyline.id}
                                  onClick={() => toggleChapterStoryline(chapter.id!, storyline.id!)}
                                  className={`w-4 h-4 rounded-full border border-white dark:border-zinc-900 transition-all shadow-sm touch-target ${
                                    isLinked ? 'scale-110 ring-2 ring-zinc-400 dark:ring-zinc-600' : 'opacity-30 hover:opacity-70'
                                  }`}
                                  style={{ backgroundColor: storyline.color }}
                                  title={storyline.name}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto relative">
        {currentNodeId ? (
          <WritingEditor
            nodeId={currentNodeId}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-6 grayscale opacity-20">✒️</div>
              <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 font-serif-novel mb-2">
                “写作是唯一的、最终的自由。”
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-serif-novel italic mb-8">
                —— 弗朗茨·卡夫卡
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-6">
                从左侧大纲选择一个章节节点，开启您的文学之旅
              </p>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  打开大纲
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Goal Tracker (Desktop only) */}
      {!isMobile && showGoalTracker && currentProject && (
        <DailyGoalTracker projectId={currentProject.id!} />
      )}

      {/* Material Panel */}
      <MaterialPanel 
        isOpen={showMaterialPanel} 
        onToggle={() => setShowMaterialPanel(!showMaterialPanel)} 
      />

      {/* Add/Edit Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-serif-novel mb-5">
              {editingNode && outlineNodes.find(n => n.id === editingNode) ? '编辑节点' : '添加节点'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">类型</label>
                <select
                  value={nodeForm.type}
                  onChange={e => setNodeForm({ ...nodeForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-sm"
                >
                  <option value="volume">卷</option>
                  <option value="chapter">章</option>
                  <option value="section">节</option>
                  <option value="scene">场景</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">标题</label>
                <input
                  type="text"
                  value={nodeForm.title}
                  onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-sm"
                  placeholder="输入标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">状态</label>
                <select
                  value={nodeForm.status}
                  onChange={e => setNodeForm({ ...nodeForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-sm"
                >
                  <option value="planning">构思中</option>
                  <option value="writing">写作中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">简述</label>
                <textarea
                  value={nodeForm.summary}
                  onChange={e => setNodeForm({ ...nodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 h-24 bg-white dark:bg-zinc-950 text-sm resize-none"
                  placeholder="简要描述内容..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowNodeModal(false); setEditingNode(null); resetNodeForm(); }}
                className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium rounded-md touch-target"
              >
                取消
              </button>
              <button
                onClick={editingNode && outlineNodes.find(n => n.id === editingNode) ? handleUpdateNode : handleAddNode}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 touch-target shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Storyline Modal */}
      {showStorylineModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-serif-novel mb-5">
              {editingStoryline ? '编辑故事线' : '添加故事线'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">名称</label>
                <input
                  type="text"
                  value={storylineForm.name}
                  onChange={e => setStorylineForm({ ...storylineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-sm"
                  placeholder="例如：主线、复仇线、感情线"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">颜色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="w-10 h-10 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer p-0.5 bg-white dark:bg-zinc-950"
                  />
                  <input
                    type="text"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 bg-white dark:bg-zinc-950 text-sm"
                    placeholder="#18181b"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowStorylineModal(false); setEditingStoryline(null); }}
                className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium rounded-md touch-target"
              >
                取消
              </button>
              <button
                onClick={editingStoryline ? handleUpdateStoryline : handleAddStoryline}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 touch-target shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
