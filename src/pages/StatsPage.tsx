import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store'
import { db } from '../db'
import WritingStatsDashboard from '../components/WritingStatsDashboard'
import DailyGoalTracker from '../components/DailyGoalTracker'

export default function StatsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentProject, setCurrentProject, outlineNodes, storylines, chapterStorylineLinks, loadStorylines, loadChapterStorylineLinks } = useStore()

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return
      const projectId = parseInt(id)
      const project = await db.projects.get(projectId)
      if (project) {
        setCurrentProject(project)
        loadStorylines(projectId)
        loadChapterStorylineLinks(projectId)
      } else {
        navigate('/projects')
      }
    }
    loadProject()
  }, [id])

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main Stats Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/projects/${id}`} className="text-sm text-indigo-600 hover:text-indigo-700 mb-1 inline-block">
                ← 返回编辑
              </Link>
              <h1 className="text-xl font-bold text-gray-800">{currentProject.title} - 写作统计</h1>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <WritingStatsDashboard projectId={currentProject.id!} />
      </div>

      {/* Right Sidebar - Daily Goal Tracker */}
      <DailyGoalTracker projectId={currentProject.id!} />
    </div>
  )
}
