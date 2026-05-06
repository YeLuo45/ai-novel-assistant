import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../db'
import OutlineTree from '../components/OutlineTree'
import AIChat from '../components/AIChat'
import WritingEditor from '../components/WritingEditor'
import { MaterialPanel } from '../components/MaterialPanel'
import WorldbuildingTab from '../components/WorldbuildingTab'
import AIShortcutBar from '../components/AIShortcutBar'
import DailyGoalTracker from '../components/DailyGoalTracker'
import CharacterRelationshipList from '../components/CharacterRelationshipList'
import TimelineView from '../components/TimelineView'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'

type Tab = 'outline' | 'chat' | 'storyline' | 'worldbuilding' | 'relationships' | 'timeline'

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentProject, setCurrentProject, 
    outlineNodes, loadOutline,
    createOutlineNode, updateOutlineNode, deleteOutlineNode, moveOutlineNode,
    agentConfigs,
    currentNodeId, setCurrentNodeId,
    storylines, loadStorylines, createStoryline, updateStoryline, deleteStoryline,
    chapterStorylineLinks, loadChapterStorylineLinks, addChapterStorylineLink, removeChapterStorylineLink,
    totalWordGoal, dailyGoal, todayWordCount, updateDailyWordCount
  } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('outline')
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [editingNode, setEditingNode] = useState<number | null>(null)
  const [showMaterialPanel, setShowMaterialPanel] = useState(false)
  const [showGoalTracker, setShowGoalTracker] = useState(true)
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
  const [storylineForm, setStorylineForm] = useState({ name: '', color: '#6366f1' })

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
        setShowGoalTracker(false)
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
    setStorylineForm({ name: '', color: '#6366f1' })
  }

  const handleUpdateStoryline = async () => {
    if (!editingStoryline || !storylineForm.name.trim()) return
    await updateStoryline(editingStoryline, {
      name: storylineForm.name.trim(),
      color: storylineForm.color
    })
    setShowStorylineModal(false)
    setEditingStoryline(null)
    setStorylineForm({ name: '', color: '#6366f1' })
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

  // Get storyline colors for a chapter
  const getChapterStorylineColors = (chapterId: number) => {
    const links = chapterStorylineLinks.filter(l => l.chapterId === chapterId)
    return links
      .map(l => storylines.find(s => s.id === l.storylineId))
      .filter(Boolean)
  }

  // Mobile tabs - fewer tabs on mobile
  const mobileTabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'outline', icon: '📋', label: '大纲' },
    { key: 'chat', icon: '💬', label: 'AI' },
    { key: 'worldbuilding', icon: '🌍', label: '世界' },
    { key: 'timeline', icon: '📅', label: '时间' },
  ]

  const desktopTabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'outline', icon: '📋', label: '大纲' },
    { key: 'chat', icon: '💬', label: 'AI对话' },
    { key: 'storyline', icon: '📖', label: '故事线' },
    { key: 'worldbuilding', icon: '🌍', label: '世界观' },
    { key: 'relationships', icon: '👥', label: '关系图' },
    { key: 'timeline', icon: '📅', label: '时间线' },
  ]

  const tabs = isMobile ? mobileTabs : desktopTabs

  if (!currentProject) return null

  return (
    <div className="flex h-[calc(100vh-64px)] dark:bg-dark-bg">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Outline */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'relative'}
        bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border flex flex-col
        transform transition-transform duration-300
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-800 dark:text-dark-text truncate">{currentProject.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentProject.genre}</p>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target"
                aria-label="关闭"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {!isMobile && (
              <button
                onClick={() => navigate(`/projects/${id}/stats`)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm touch-target"
                title="查看统计"
              >
                📊
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className={`flex ${isMobile ? 'flex-wrap' : 'flex-col'} border-b border-gray-200 dark:border-dark-border`}>
          {!isMobile && tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 touch-target ${
                activeTab === tab.key 
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400' 
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className={isMobile ? 'text-xs' : ''}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Tab Bar */}
        {isMobile && (
          <div className="flex border-b border-gray-200 dark:border-dark-border overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[64px] py-3 text-xs font-medium flex flex-col items-center gap-1 transition-colors touch-target ${
                  activeTab === tab.key 
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Desktop Tab Content */}
        {!isMobile && activeTab === 'outline' && (
          <div className="flex-1 overflow-y-auto p-4">
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
            
            <button
              onClick={() => openAddModal(null, 'volume')}
              className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors touch-target"
            >
              + 添加卷
            </button>
          </div>
        )}

        {/* Mobile Outline Content */}
        {isMobile && activeTab === 'outline' && (
          <div className="flex-1 overflow-y-auto p-4">
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
            
            <button
              onClick={() => openAddModal(null, 'volume')}
              className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors touch-target"
            >
              + 添加卷
            </button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 overflow-hidden">
            <AIChat agentConfigs={agentConfigs} projectId={currentProject.id} />
          </div>
        )}

        {activeTab === 'worldbuilding' && (
          <div className="flex-1 overflow-hidden">
            <WorldbuildingTab />
          </div>
        )}

        {activeTab === 'relationships' && currentProject && !isMobile && (
          <div className="flex-1 overflow-hidden">
            <CharacterRelationshipList projectId={currentProject.id!} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="flex-1 overflow-hidden">
            <TimelineView
              onEditNode={openEditModal}
              onOpenNode={handleOpenNode}
            />
          </div>
        )}

        {activeTab === 'storyline' && !isMobile && (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Storyline List */}
            <div className="space-y-2 mb-4">
              {storylines.map(storyline => (
                <div 
                  key={storyline.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg"
                >
                  <span 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: storyline.color }}
                  />
                  <span className="flex-1 text-sm truncate text-gray-700 dark:text-gray-200">{storyline.name}</span>
                  <button
                    onClick={() => {
                      setEditingStoryline(storyline.id!)
                      setStorylineForm({ name: storyline.name, color: storyline.color })
                      setShowStorylineModal(true)
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 touch-target px-2 py-1"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteStoryline(storyline.id!)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 touch-target px-2 py-1"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setEditingStoryline(null)
                setStorylineForm({ name: '', color: '#6366f1' })
                setShowStorylineModal(true)
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors touch-target"
            >
              + 添加故事线
            </button>

            {/* Chapter-Storyline Assignment */}
            {storylines.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">章节-故事线分配</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {outlineNodes.filter(n => n.type === 'chapter').map(chapter => {
                    const chapterStorylines = getChapterStorylineColors(chapter.id!)
                    return (
                      <div key={chapter.id} className="p-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1 truncate">
                          {chapter.title}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {storylines.map(storyline => {
                            const isLinked = chapterStorylineLinks.some(
                              l => l.chapterId === chapter.id && l.storylineId === storyline.id
                            )
                            return (
                              <button
                                key={storyline.id}
                                onClick={() => toggleChapterStoryline(chapter.id!, storyline.id!)}
                                className={`w-5 h-5 rounded-full border transition-all touch-target ${
                                  isLinked ? 'scale-110' : 'opacity-50 hover:opacity-80'
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

      {/* Right Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-dark-bg overflow-y-auto">
        {currentNodeId ? (
          <WritingEditor
            nodeId={currentNodeId}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4 opacity-50">📝</div>
              <p className="text-lg mb-2 dark:text-gray-300">从左侧大纲选择一个节点开始编辑</p>
              <p className="text-sm">点击章节标题将打开完整的写作编辑器</p>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors touch-target font-medium"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4">
              {editingNode && outlineNodes.find(n => n.id === editingNode) ? '编辑节点' : '添加节点'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">类型</label>
                <select
                  value={nodeForm.type}
                  onChange={e => setNodeForm({ ...nodeForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                >
                  <option value="volume">卷</option>
                  <option value="chapter">章</option>
                  <option value="section">节</option>
                  <option value="scene">场景</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">标题</label>
                <input
                  type="text"
                  value={nodeForm.title}
                  onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                  placeholder="节点标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">状态</label>
                <select
                  value={nodeForm.status}
                  onChange={e => setNodeForm({ ...nodeForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                >
                  <option value="planning">构思中</option>
                  <option value="writing">写作中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">简述</label>
                <textarea
                  value={nodeForm.summary}
                  onChange={e => setNodeForm({ ...nodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                  placeholder="简要描述内容..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowNodeModal(false); setEditingNode(null); resetNodeForm(); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
              >
                取消
              </button>
              <button
                onClick={editingNode && outlineNodes.find(n => n.id === editingNode) ? handleUpdateNode : handleAddNode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 touch-target"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Storyline Modal */}
      {showStorylineModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4">
              {editingStoryline ? '编辑故事线' : '添加故事线'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">名称</label>
                <input
                  type="text"
                  value={storylineForm.name}
                  onChange={e => setStorylineForm({ ...storylineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                  placeholder="故事线名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">颜色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 dark:border-dark-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowStorylineModal(false); setEditingStoryline(null); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
              >
                取消
              </button>
              <button
                onClick={editingStoryline ? handleUpdateStoryline : handleAddStoryline}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 touch-target"
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
