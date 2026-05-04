import { useState } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { ExportPanel } from './ExportPanel'
import BackupReminderToast from './BackupReminderToast'
import BackupPanel from './BackupPanel'

export default function Layout() {
  const location = useLocation()
  const params = useParams()
  const { currentProject, updateLastBackupTime } = useStore()
  const [showExport, setShowExport] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

  const isActive = (path: string) => location.pathname === path

  // Check if we're in a project context
  const isProjectContext = location.pathname.startsWith('/projects/') && params.id

  const handleBackupSuccess = () => {
    updateLastBackupTime()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-indigo-600">AI小说开发助手</h1>
            <nav className="flex gap-4">
              <Link
                to="/projects"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/projects') || location.pathname.startsWith('/projects/')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                项目
              </Link>
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                API设置
              </Link>
            </nav>
          </div>
          {currentProject && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                当前项目: <span className="font-medium text-gray-700">{currentProject.title}</span>
              </div>
              {isProjectContext && (
                <Link
                  to={`/projects/${params.id}/stats`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname.includes('/stats')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📊 统计
                </Link>
              )}
              <button
                onClick={() => setShowBackup(true)}
                className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                💾 备份
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                📤 导出
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Export Panel */}
      <ExportPanel isOpen={showExport} onToggle={() => setShowExport(false)} />

      {/* Backup Panel Modal */}
      <BackupPanel 
        isOpen={showBackup} 
        onClose={() => setShowBackup(false)}
        onBackupSuccess={handleBackupSuccess}
      />

      {/* Backup Reminder Toast */}
      <BackupReminderToast onOpenBackup={() => setShowBackup(true)} />

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
