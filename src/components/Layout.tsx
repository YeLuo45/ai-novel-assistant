import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { ExportPanel } from './ExportPanel'

export default function Layout() {
  const location = useLocation()
  const { currentProject } = useStore()
  const [showExport, setShowExport] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
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

      {/* 主内容区 */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
