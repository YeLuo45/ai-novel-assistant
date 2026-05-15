/**
 * CreateProjectModal - V24 Extended Version
 * 新建项目弹窗，包含扩展字段：书名/题材、题材类型、主角名、背景/朝代、核心卖点、其他要求
 * V24: 支持从已有项目复制填写信息
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate()
  const { createProject, projects } = useStore()
  
  const [formData, setFormData] = useState({
    title: '',           // 书名/题材（必填）
    genre: '',           // 题材类型
    protagonistName: '', // 主角名（可选）
    background: '',      // 背景/朝代（可选）
    coreSellingPoint: '', // 核心卖点（可选）
    otherRequirements: '' // 其他要求（可选）
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCopyFrom, setShowCopyFrom] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    
    setIsSubmitting(true)
    try {
      const project = await createProject(formData.title.trim(), formData.genre.trim())
      
      // Update project with extended fields
      if (project.id !== undefined) {
        const projectId = project.id
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protagonistName: formData.protagonistName.trim() || undefined,
            background: formData.background.trim() || undefined,
            coreSellingPoint: formData.coreSellingPoint.trim() || undefined,
            otherRequirements: formData.otherRequirements.trim() || undefined
          })
        }).catch(() => {
          // If API fails, use store directly
          useStore.getState().updateProject(projectId, {
            protagonistName: formData.protagonistName.trim() || undefined,
            background: formData.background.trim() || undefined,
            coreSellingPoint: formData.coreSellingPoint.trim() || undefined,
            otherRequirements: formData.otherRequirements.trim() || undefined
          })
        })
      }
      
      // Reset form
      setFormData({
        title: '',
        genre: '',
        protagonistName: '',
        background: '',
        coreSellingPoint: '',
        otherRequirements: ''
      })
      
      onClose()
      setShowCopyFrom(false)

      // Navigate to project editor (stay in project, not version generator)
      if (project.id) {
        navigate(`/projects/${project.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCopyFrom = (srcProject: typeof projects[0]) => {
    setFormData({
      title: srcProject.title + '（副本）',
      genre: srcProject.genre || '',
      protagonistName: srcProject.protagonistName || '',
      background: srcProject.background || '',
      coreSellingPoint: srcProject.coreSellingPoint || '',
      otherRequirements: srcProject.otherRequirements || ''
    })
    setShowCopyFrom(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">新建项目</h3>
        
        {projects.length > 0 && (
          <div className="mb-4">
            {showCopyFrom ? (
              <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-indigo-700 font-medium">从已有项目复制</span>
                  <button
                    onClick={() => setShowCopyFrom(false)}
                    className="text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    收起
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => p.id && handleCopyFrom(p)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-indigo-100 transition-colors"
                    >
                      <span className="font-medium text-gray-800">{p.title}</span>
                      <span className="ml-2 text-xs text-gray-500">{p.genre || '未分类'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCopyFrom(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                从已有项目复制填写信息
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 书名/题材（必填） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              书名/题材 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：星际穿越、都市传奇"
              autoFocus
              required
            />
          </div>
          
          {/* 题材类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              题材类型
            </label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => handleChange('genre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：科幻、玄幻、都市、悬疑"
            />
          </div>
          
          {/* 主角名（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主角名 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.protagonistName}
              onChange={(e) => handleChange('protagonistName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="主要角色名称"
            />
          </div>
          
          {/* 背景/朝代（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背景/朝代 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.background}
              onChange={(e) => handleChange('background', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：现代都市、唐朝、明朝、未来世界"
            />
          </div>
          
          {/* 核心卖点（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              核心卖点 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <textarea
              value={formData.coreSellingPoint}
              onChange={(e) => handleChange('coreSellingPoint', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
              placeholder="本书的核心亮点或特色"
            />
          </div>
          
          {/* 其他要求（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              其他要求 <span className="text-gray-400 text-xs">(可选)</span>
            </label>
            <textarea
              value={formData.otherRequirements}
              onChange={(e) => handleChange('otherRequirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="任何其他创作要求或想法"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              className={`px-4 py-2 rounded-lg ${
                !formData.title.trim() || isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? '创建中...' : '创建并生成版本'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
