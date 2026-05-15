import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/CreateProjectModal'
import { db } from '../db'

export default function ProjectList() {
  const { projects, loadProjects, deleteProject } = useStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('确定要删除这个项目吗？')) {
      await deleteProject(id)
    }
  }

  const handleCopy = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const original = await db.projects.get(id)
    if (!original) return
    
    // Deep clone with all fields (required + optional)
    const copy = {
      title: original.title + ' (副本)',
      genre: original.genre || '',
      protagonistName: original.protagonistName || '',
      background: original.background || '',
      coreSellingPoint: original.coreSellingPoint || '',
      otherRequirements: original.otherRequirements || '',
      worldbuilding: original.worldbuilding || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const newId = await db.projects.add(copy)
    loadProjects()
    
    // Navigate to new project
    window.location.href = `/ai-novel-assistant/projects/${newId}`
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">我的项目</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">还没有项目，点击上方按钮创建一个</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-500">{project.genre || '未分类'}</p>
                </div>
                <button
                  onClick={(e) => project.id && handleDelete(project.id, e)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={(e) => project.id && handleCopy(project.id, e)}
                  className="text-gray-400 hover:text-indigo-500 p-1"
                  title="复制项目"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                创建于 {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 新建项目弹窗 - 使用扩展版本 */}
      <CreateProjectModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  )
}
