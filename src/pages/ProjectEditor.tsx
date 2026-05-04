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
import WordGoalTracker from '../components/WordGoalTracker'
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
  const [showMaterialPanel, setShowMaterialPanel] = useState(true)
  const [showGoalTracker, setShowGoalTracker] = useState(true)
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

  if (!currentProject) return null

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Sidebar - Outline */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">{currentProject.title}</h2>
              <p className="text-sm text-gray-500">{currentProject.genre}</p>
            </div>
            <button
              onClick={() => navigate(`/projects/${id}/stats`)}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
              title="查看统计"
            >
              📊
            </button>
          </div>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'outline' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            大纲
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'chat' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            AI对话
          </button>
          <button
            onClick={() => setActiveTab('storyline')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'storyline' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            故事线
          </button>
          <button
            onClick={() => setActiveTab('worldbuilding')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'worldbuilding' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            世界观
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'relationships' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            关系图
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'timeline' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500'
            }`}
          >
            时间线
          </button>
        </div>

        {activeTab === 'outline' && (
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
              className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
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

        {activeTab === 'relationships' && currentProject && (
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

        {activeTab === 'storyline' && (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Storyline List */}
            <div className="space-y-2 mb-4">
              {storylines.map(storyline => (
                <div 
                  key={storyline.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: storyline.color }}
                  />
                  <span className="flex-1 text-sm truncate">{storyline.name}</span>
                  <button
                    onClick={() => {
                      setEditingStoryline(storyline.id!)
                      setStorylineForm({ name: storyline.name, color: storyline.color })
                      setShowStorylineModal(true)
                    }}
                    className="text-xs text-gray-500 hover:text-indigo-600"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteStoryline(storyline.id!)}
                    className="text-xs text-gray-500 hover:text-red-600"
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
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              + 添加故事线
            </button>

            {/* Chapter-Storyline Assignment */}
            {storylines.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">章节-故事线分配</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {outlineNodes.filter(n => n.type === 'chapter').map(chapter => {
                    const chapterStorylines = getChapterStorylineColors(chapter.id!)
                    return (
                      <div key={chapter.id} className="p-2 bg-white border border-gray-200 rounded">
                        <div className="text-xs font-medium text-gray-700 mb-1 truncate">
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
                                className={`w-5 h-5 rounded-full border transition-all ${
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
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {currentNodeId ? (
          <WritingEditor
            nodeId={currentNodeId}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">从左侧大纲选择一个节点开始编辑</p>
              <p className="text-sm">点击章节标题将打开完整的写作编辑器</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Goal Tracker */}
      {showGoalTracker && currentProject && (
        <WordGoalTracker projectId={currentProject.id!} />
      )}

      {/* Material Panel */}
      <MaterialPanel 
        isOpen={showMaterialPanel} 
        onToggle={() => setShowMaterialPanel(!showMaterialPanel)} 
      />

      {/* Add/Edit Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingNode && outlineNodes.find(n => n.id === editingNode) ? '编辑节点' : '添加节点'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={nodeForm.type}
                  onChange={e => setNodeForm({ ...nodeForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="volume">卷</option>
                  <option value="chapter">章</option>
                  <option value="section">节</option>
                  <option value="scene">场景</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={nodeForm.title}
                  onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="节点标题"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={nodeForm.status}
                  onChange={e => setNodeForm({ ...nodeForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="planning">构思中</option>
                  <option value="writing">写作中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简述</label>
                <textarea
                  value={nodeForm.summary}
                  onChange={e => setNodeForm({ ...nodeForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                  placeholder="简要描述内容..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowNodeModal(false); setEditingNode(null); resetNodeForm(); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={editingNode && outlineNodes.find(n => n.id === editingNode) ? handleUpdateNode : handleAddNode}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Storyline Modal */}
      {showStorylineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">
              {editingStoryline ? '编辑故事线' : '添加故事线'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={storylineForm.name}
                  onChange={e => setStorylineForm({ ...storylineForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="故事线名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={storylineForm.color}
                    onChange={e => setStorylineForm({ ...storylineForm, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowStorylineModal(false); setEditingStoryline(null); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={editingStoryline ? handleUpdateStoryline : handleAddStoryline}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
