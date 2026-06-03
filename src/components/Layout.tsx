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
    <div className="app-shell min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Navigation - Desktop */}
      {!isMobile && (
        <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 py-3 sticky top-0 z-30 safe-top">
          <div className="app-shell__bar flex items-center justify-between max-w-7xl mx-auto">
            <div className="app-shell__brand-nav flex items-center gap-12">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif-novel">
                AI小说开发助手
              </h1>
              <nav className="flex gap-1">
                <Link
                  to="/projects"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive('/projects') || location.pathname.startsWith('/projects/')
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  项目
                </Link>
                <Link
                  to="/settings"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive('/settings')
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  API设置
                </Link>
              </nav>
            </div>
            
            {currentProject && (
              <div className="flex items-center gap-4">
                <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 border-r border-zinc-200 dark:border-zinc-800 pr-4 py-1">
                  <span>当前项目:</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={currentProject.title}>
                    {currentProject.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {isProjectContext && (
                    <Link
                      to={`/projects/${params.id}/stats`}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border ${
                        location.pathname.includes('/stats')
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      📊 统计
                    </Link>
                  )}
                  <button
                    onClick={() => setShowBackup(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-200"
                  >
                    💾 备份
                  </button>
                  <button
                    onClick={() => setShowExport(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-950 bg-zinc-900 dark:bg-zinc-50 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200"
                  >
                    📤 导出
                  </button>
                  <ThemeToggle className="ml-1" />
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 safe-top sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 touch-target"
              aria-label="打开菜单"
            >
              <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-serif-novel truncate max-w-[180px]">
              {currentProject?.title || 'AI小说开发助手'}
            </h1>
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 transform transition-transform duration-300 ease-in-out border-r border-zinc-200 dark:border-zinc-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-serif-novel">AI小说开发助手</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 touch-target"
                aria-label="关闭菜单"
              >
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <Link
              to="/projects"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-target ${
                isActive('/projects') || location.pathname.startsWith('/projects/')
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              📚 项目
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-target ${
                isActive('/settings')
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              ⚙️ API设置
            </Link>
            {isProjectContext && (
              <Link
                to={`/projects/${params.id}/stats`}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-target ${
                  location.pathname.includes('/stats')
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                📊 统计
              </Link>
            )}
          </nav>
          {currentProject && (
            <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="text-xs text-zinc-400 dark:text-zinc-500 mb-3 truncate">
                当前项目: <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentProject.title}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBackup(true); setSidebarOpen(false) }}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-target"
                >
                  💾 备份
                </button>
                <button
                  onClick={() => { setShowExport(true); setSidebarOpen(false) }}
                  className="flex-1 px-3 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors touch-target"
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
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center z-30 safe-bottom">
      {tabs.map(tab => {
        const isActive = currentPath === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center justify-center py-2 px-6 touch-target min-w-[64px] ${
              isActive 
                ? 'text-zinc-900 dark:text-zinc-100 font-semibold' 
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
