import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../db'
import OutlineTree from '../components/OutlineTree'
import AIChat from '../components/AIChat'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'

type Tab = 'outline' | 'chat'

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { 
    currentProject, setCurrentProject, 
    outlineNodes, loadOutline,
    createOutlineNode, updateOutlineNode, deleteOutlineNode, moveOutlineNode,
    agentConfigs
  } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('outline')
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [editingNode, setEditingNode] = useState<number | null>(null)
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

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return
      const projectId = parseInt(id)
      const project = await db.projects.get(projectId)
      if (project) {
        setCurrentProject(project)
        loadOutline(projectId)
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

  if (!currentProject) return null

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 左侧大纲 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{currentProject.title}</h2>
          <p className="text-sm text-gray-500">{currentProject.genre}</p>
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
            <AIChat agentConfigs={agentConfigs} />
          </div>
        )}
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {editingNode ? (
          <NodeEditor
            node={outlineNodes.find(n => n.id === editingNode)!}
            onSave={async (updates) => {
              if (editingNode) await updateOutlineNode(editingNode, updates)
            }}
            onClose={() => setEditingNode(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>从左侧大纲选择一个节点开始编辑</p>
          </div>
        )}
      </div>

      {/* 添加/编辑节点弹窗 */}
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
    </div>
  )
}

function NodeEditor({ node, onSave, onClose }: { node: any; onSave: (u: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: node.title,
    summary: node.summary,
    content: node.content,
    status: node.status
  })

  useEffect(() => {
    setForm({
      title: node.title,
      summary: node.summary,
      content: node.content,
      status: node.status
    })
  }, [node])

  const handleSave = () => {
    onSave(form)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className={`px-2 py-1 text-xs rounded ${
              node.type === 'volume' ? 'bg-purple-100 text-purple-700' :
              node.type === 'chapter' ? 'bg-blue-100 text-blue-700' :
              node.type === 'section' ? 'bg-green-100 text-green-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {node.type === 'volume' ? '卷' : node.type === 'chapter' ? '章' : node.type === 'section' ? '节' : '场景'}
            </span>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="ml-2 px-2 py-1 text-sm border rounded"
            >
              <option value="planning">构思中</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">关闭</button>
            <button onClick={handleSave} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">保存</button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简述</label>
            <textarea
              value={form.summary}
              onChange={e => setForm({ ...form, summary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="章节概述..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-96"
              placeholder="开始写作..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
