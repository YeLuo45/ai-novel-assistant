import { useEffect, useState } from 'react'
import { db, Milestone } from '../db'
import { useStore } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
  projectId: number
}

export default function MilestonePanel({ isOpen, onClose, projectId }: Props) {
  const { outlineNodes } = useStore()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    targetWordCount: 0
  })

  // Calculate total book word count
  const totalBookWords = outlineNodes.reduce((sum, n) => {
    return sum + (n.content?.replace(/\s/g, '').length || 0)
  }, 0)

  // Load milestones
  const loadMilestones = async () => {
    const data = await db.milestones
      .where('projectId')
      .equals(projectId)
      .toArray()
    setMilestones(data.sort((a, b) => a.targetDate.localeCompare(b.targetDate)))
  }

  useEffect(() => {
    if (isOpen && projectId) {
      loadMilestones()
    }
  }, [isOpen, projectId])

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetDate: '',
      targetWordCount: 0
    })
    setEditingMilestone(null)
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.targetDate) return

    if (editingMilestone && editingMilestone.id) {
      await db.milestones.update(editingMilestone.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetDate: formData.targetDate,
        targetWordCount: formData.targetWordCount
      })
    } else {
      await db.milestones.add({
        projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetDate: formData.targetDate,
        targetWordCount: formData.targetWordCount,
        status: 'pending',
        createdAt: new Date()
      })
    }

    await loadMilestones()
    resetForm()
    setShowForm(false)
  }

  // Delete milestone
  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个里程碑吗？')) {
      await db.milestones.delete(id)
      await loadMilestones()
    }
  }

  // Mark as achieved
  const handleMarkAchieved = async (milestone: Milestone) => {
    if (!milestone.id) return
    await db.milestones.update(milestone.id, {
      status: 'achieved',
      achievedAt: new Date()
    })
    await loadMilestones()
  }

  // Open edit form
  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description,
      targetDate: milestone.targetDate,
      targetWordCount: milestone.targetWordCount
    })
    setShowForm(true)
  }

  // Calculate days remaining
  const getDaysRemaining = (targetDate: string): number => {
    const today = new Date()
    const target = new Date(targetDate)
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Get status color
  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-700 border-green-200'
      case 'missed': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  // Group milestones
  const pendingMilestones = milestones.filter(m => m.status === 'pending')
  const achievedMilestones = milestones.filter(m => m.status === 'achieved')
  const missedMilestones = milestones.filter(m => m.status === 'missed')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">📍 里程碑管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add button */}
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors mb-6"
          >
            + 添加里程碑
          </button>

          {/* Form */}
          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                {editingMilestone ? '编辑里程碑' : '新建里程碑'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：第一卷完成"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="里程碑详细描述..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">目标日期</label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">目标字数</label>
                    <input
                      type="number"
                      value={formData.targetWordCount}
                      onChange={e => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || 0 })}
                      placeholder="50000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingMilestones.length}</div>
              <div className="text-xs text-yellow-600">进行中</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{achievedMilestones.length}</div>
              <div className="text-xs text-green-600">已完成</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{missedMilestones.length}</div>
              <div className="text-xs text-red-600">已逾期</div>
            </div>
          </div>

          {/* Milestone List */}
          <div className="space-y-3">
            {milestones.length === 0 && !showForm && (
              <div className="text-center py-8 text-gray-400">
                暂无里程碑，添加一个来跟踪你的写作进度吧
              </div>
            )}

            {/* Pending Milestones */}
            {pendingMilestones.map(milestone => {
              const daysLeft = getDaysRemaining(milestone.targetDate)
              const progress = milestone.targetWordCount > 0 
                ? Math.min(100, Math.round((totalBookWords / milestone.targetWordCount) * 100))
                : 0
              
              return (
                <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(milestone.status)}`}>
                        {daysLeft > 0 ? `${daysLeft}天后` : daysLeft === 0 ? '今天' : '已逾期'}
                      </span>
                      <h4 className="font-semibold text-gray-800">{milestone.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkAchieved(milestone)}
                        className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                        title="标记完成"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleEdit(milestone)}
                        className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => milestone.id && handleDelete(milestone.id)}
                        className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 mb-2">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>目标: {milestone.targetWordCount.toLocaleString()} 字</span>
                    <span>当前: {totalBookWords.toLocaleString()} 字</span>
                    <span className="text-indigo-600 font-medium">{progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${daysLeft < 0 ? 'bg-red-400' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Achieved Milestones */}
            {achievedMilestones.map(milestone => (
              <div key={milestone.id} className="bg-green-50 border border-green-200 rounded-lg p-4 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(milestone.status)}`}>
                      已完成
                    </span>
                    <h4 className="font-semibold text-gray-800 line-through">{milestone.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => milestone.id && handleDelete(milestone.id)}
                      className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
                {milestone.description && (
                  <p className="text-sm text-gray-500 mb-2">{milestone.description}</p>
                )}
                <div className="text-xs text-green-600">
                  完成于: {milestone.achievedAt ? new Date(milestone.achievedAt).toLocaleDateString() : '-'}
                </div>
              </div>
            ))}

            {/* Missed Milestones */}
            {missedMilestones.map(milestone => (
              <div key={milestone.id} className="bg-red-50 border border-red-200 rounded-lg p-4 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(milestone.status)}`}>
                      已逾期
                    </span>
                    <h4 className="font-semibold text-gray-800 line-through">{milestone.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(milestone)}
                      className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                    >
                      重新设定
                    </button>
                    <button
                      onClick={() => milestone.id && handleDelete(milestone.id)}
                      className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="text-xs text-red-500">
                  原定日期: {milestone.targetDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
