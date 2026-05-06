import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { ExportPanel } from './ExportPanel'
import BackupReminderToast from './BackupReminderToast'
import BackupPanel from './BackupPanel'
import { ThemeToggle } from './ThemeToggle'
import { PWAInstallBanner } from './PWAInstallBanner'

export default function Layout() {
  const location = useLocation()
  const params = useParams()
  const { currentProject, updateLastBackupTime } = useStore()
  const [showExport, setShowExport] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const isActive = (path: string) => location.pathname === path
  const isProjectContext = location.pathname.startsWith('/projects/') && params.id

  const handleBackupSuccess = () => {
    updateLastBackupTime()
  }

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect virtual keyboard (for mobile)
  useEffect(() => {
    const handleVisualViewportChange = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        const keyboardHeight = window.innerHeight - visualViewport.height
        setKeyboardHeight(keyboardHeight > 100 ? keyboardHeight : 0)
      }
    }
    window.visualViewport?.addEventListener('resize', handleVisualViewportChange)
    return () => window.visualViewport?.removeEventListener('resize', handleVisualViewportChange)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg">
      {/* Top Navigation - Desktop */}
      {!isMobile && (
        <header className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border px-4 py-3 safe-top">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AI小说开发助手</h1>
              <nav className="flex gap-2">
                <Link
                  to="/projects"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/projects') || location.pathname.startsWith('/projects/')
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  项目
                </Link>
                <Link
                  to="/settings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/settings')
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  API设置
                </Link>
              </nav>
            </div>
            {currentProject && (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  当前项目: <span className="font-medium text-gray-700 dark:text-gray-200">{currentProject.title}</span>
                </div>
                {isProjectContext && (
                  <Link
                    to={`/projects/${params.id}/stats`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname.includes('/stats')
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    📊 统计
                  </Link>
                )}
                <button
                  onClick={() => setShowBackup(true)}
                  className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors touch-target"
                >
                  💾 备份
                </button>
                <button
                  onClick={() => setShowExport(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors touch-target"
                >
                  📤 导出
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border px-4 py-3 safe-top sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target"
              aria-label="打开菜单"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">
              {currentProject?.title || 'AI小说开发助手'}
            </h1>
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-bg-secondary transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">AI小说开发助手</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-target"
                aria-label="关闭菜单"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            <Link
              to="/projects"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-target ${
                isActive('/projects') || location.pathname.startsWith('/projects/')
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              📚 项目
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-target ${
                isActive('/settings')
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              ⚙️ API设置
            </Link>
            {isProjectContext && (
              <Link
                to={`/projects/${params.id}/stats`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors touch-target ${
                  location.pathname.includes('/stats')
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                📊 统计
              </Link>
            )}
          </nav>
          {currentProject && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                当前项目: <span className="font-medium text-gray-700 dark:text-gray-200">{currentProject.title}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBackup(true); setSidebarOpen(false) }}
                  className="flex-1 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors touch-target"
                >
                  💾 备份
                </button>
                <button
                  onClick={() => { setShowExport(true); setSidebarOpen(false) }}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors touch-target"
                >
                  📤 导出
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main className="flex-1" style={{ paddingBottom: isMobile ? keyboardHeight : 0 }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Navigation */}
      {isMobile && isProjectContext && (
        <MobileBottomNav projectId={params.id!} />
      )}
    </div>
  )
}

function MobileBottomNav({ projectId }: { projectId: string }) {
  const location = useLocation()
  const currentPath = location.pathname

  const tabs = [
    { path: `/projects/${projectId}`, icon: '📝', label: '编辑' },
    { path: `/projects/${projectId}/stats`, icon: '📊', label: '统计' },
  ]

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border flex justify-around items-center z-30 safe-bottom">
      {tabs.map(tab => {
        const isActive = currentPath === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center py-2 px-6 touch-target min-w-[64px] ${
              isActive 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium mt-1">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
