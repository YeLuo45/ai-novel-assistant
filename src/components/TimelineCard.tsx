import { useStore } from '../store'
import { OutlineNode, Storyline } from '../db'

interface TimelineCardProps {
  node: OutlineNode
  storylines: Storyline[]
  chapterStorylineLinks: { chapterId: number; storylineId: number }[]
  onEdit: (nodeId: number) => void
  onOpen: (nodeId: number) => void
  isActive?: boolean
  position: 'left' | 'right'
}

export default function TimelineCard({
  node,
  storylines,
  chapterStorylineLinks,
  onEdit,
  onOpen,
  isActive = false,
  position
}: TimelineCardProps) {
  const wordCount = node.content?.replace(/\s/g, '').length || 0
  
  // Get storylines for this chapter
  const nodeStorylines = chapterStorylineLinks
    .filter(link => link.chapterId === node.id)
    .map(link => storylines.find(s => s.id === link.storylineId))
    .filter(Boolean)

  const statusColors = {
    planning: 'bg-gray-100 border-gray-300',
    writing: 'bg-blue-50 border-blue-300',
    completed: 'bg-green-50 border-green-300'
  }

  const statusLabels = {
    planning: '构思中',
    writing: '写作中',
    completed: '已完成'
  }

  return (
    <div className={`absolute w-5/12 ${position === 'left' ? 'left-0 pr-8' : 'right-0 pl-8'} flex items-center`}>
      <div 
        className={`w-full rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${
          isActive ? statusColors[node.status] + ' ring-2 ring-indigo-400' : statusColors[node.status] + ' hover:border-indigo-300'
        }`}
        onClick={() => onOpen(node.id!)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              node.type === 'chapter' ? 'bg-purple-100 text-purple-700' :
              node.type === 'section' ? 'bg-blue-100 text-blue-700' :
              node.type === 'scene' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {node.type === 'volume' ? '卷' : node.type === 'chapter' ? '章' : node.type === 'section' ? '节' : '场景'}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              node.status === 'planning' ? 'bg-gray-200 text-gray-600' :
              node.status === 'writing' ? 'bg-blue-200 text-blue-700' :
              'bg-green-200 text-green-700'
            }`}>
              {statusLabels[node.status]}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(node.id!)
            }}
            className="text-gray-400 hover:text-indigo-600 text-sm"
          >
            ✎
          </button>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-800 mb-1 line-clamp-1">
          {node.title || '未命名'}
        </h4>

        {/* Summary */}
        {node.summary && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {node.summary}
          </p>
        )}

        {/* Storyline indicators */}
        {nodeStorylines.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {nodeStorylines.map(storyline => storyline && (
              <span
                key={storyline.id}
                className="px-2 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: storyline.color }}
              >
                {storyline.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{wordCount.toLocaleString()} 字</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            点击打开 →
          </span>
        </div>
      </div>
    </div>
  )
}
