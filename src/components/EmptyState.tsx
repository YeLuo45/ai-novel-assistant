import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon = '📭', 
  title, 
  description, 
  action,
  children,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="text-6xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors touch-target font-medium"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  )
}

export function EmptyProjectState() {
  return (
    <EmptyState
      icon="📚"
      title="还没有项目"
      description="创建你的第一个小说项目，开始AI辅助创作之旅"
      action={{
        label: "创建项目",
        onClick: () => {
          // This would typically trigger the create modal
          const event = new CustomEvent('open-create-project')
          window.dispatchEvent(event)
        }
      }}
    />
  )
}

export function EmptyChapterState() {
  return (
    <EmptyState
      icon="📝"
      title="还没有章节"
      description="点击上方按钮添加第一章节，构建你的故事大纲"
      action={{
        label: "添加章节",
        onClick: () => {
          const event = new CustomEvent('open-add-chapter')
          window.dispatchEvent(event)
        }
      }}
    />
  )
}

export function EmptyMaterialState() {
  return (
    <EmptyState
      icon="📦"
      title="素材库为空"
      description="添加人物、地点、物品等素材，方便在写作时快速引用"
      action={{
        label: "添加素材",
        onClick: () => {
          const event = new CustomEvent('open-add-material')
          window.dispatchEvent(event)
        }
      }}
    />
  )
}
