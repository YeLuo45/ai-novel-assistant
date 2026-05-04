import { Draggable } from 'react-beautiful-dnd'
import { OutlineNode, Storyline } from '../db'

interface Props {
  nodes: OutlineNode[]
  allNodes: OutlineNode[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAddChild: (parentId: number | null, type: 'volume' | 'chapter' | 'section' | 'scene') => void
  onOpenNode?: (id: number) => void
  activeNodeId?: number | null
  depth?: number
  storylines?: Storyline[]
  chapterStorylineLinks?: { chapterId: number; storylineId: number }[]
  totalBookWords?: number
  totalBookGoal?: number
}

const typeLabels = {
  volume: '卷',
  chapter: '章',
  section: '节',
  scene: '场景'
}

const typeColors = {
  volume: 'bg-purple-100 text-purple-700 border-purple-200',
  chapter: 'bg-blue-100 text-blue-700 border-blue-200',
  section: 'bg-green-100 text-green-700 border-green-200',
  scene: 'bg-orange-100 text-orange-700 border-orange-200'
}

const statusIcons = {
  planning: '○',
  writing: '◐',
  completed: '●'
}

export default function OutlineTree({ 
  nodes, allNodes, onEdit, onDelete, onAddChild, onOpenNode, activeNodeId, depth = 0,
  storylines = [], chapterStorylineLinks = [], totalBookWords = 0, totalBookGoal = 0 
}: Props) {
  return (
    <div>
      {depth === 0 && (
        <div className="mb-3 px-2 py-2 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-xs text-gray-500">
            <span>全书: {totalBookWords.toLocaleString()} / {totalBookGoal.toLocaleString()} 字</span>
            <span>{totalBookGoal > 0 ? Math.round((totalBookWords / totalBookGoal) * 100) : 0}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(totalBookGoal > 0 ? (totalBookWords / totalBookGoal) * 100 : 0, 100)}%` }}
            />
          </div>
        </div>
      )}
      {nodes.map((node, index) => {
        const children = allNodes.filter(n => n.parentId === node.id)
        const wordCount = node.content?.replace(/\s/g, '').length || 0
        const wordGoal = 3000 // Default chapter goal
        const nodeLinks = chapterStorylineLinks.filter(l => l.chapterId === node.id)
        const nodeStorylines = nodeLinks
          .map(l => storylines.find(s => s.id === l.storylineId))
          .filter(Boolean) as Storyline[]
        
        return (
          <Draggable key={node.id} draggableId={String(node.id)} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`mb-2 ${snapshot.isDragging ? 'opacity-80' : ''}`}
              >
                <div
                  className={`p-3 rounded-lg border ${typeColors[node.type]} ${
                    snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                  } ${activeNodeId === node.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white'}
                  `}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs opacity-60">{statusIcons[node.status]}</span>
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-white/50 rounded">
                      {typeLabels[node.type]}
                    </span>
                    
                    {/* Storyline Color Tags */}
                    {nodeStorylines.length > 0 && (
                      <div className="flex gap-1">
                        {nodeStorylines.map(storyline => (
                          <span 
                            key={storyline.id}
                            className="w-3 h-3 rounded-full border border-white/50"
                            style={{ backgroundColor: storyline.color }}
                            title={storyline.name}
                          />
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        if (onOpenNode && node.id) {
                          onOpenNode(node.id)
                        } else if (node.id) {
                          onEdit(node.id)
                        }
                      }}
                      className="flex-1 text-left text-sm font-medium hover:text-indigo-600 truncate"
                    >
                      {node.title}
                    </button>
                    
                    {/* Word count badge */}
                    {(node.type === 'chapter' || node.type === 'section' || node.type === 'scene') && (
                      <span className="text-xs px-2 py-0.5 bg-white/50 rounded text-gray-600">
                        {wordCount.toLocaleString()}/{wordGoal}
                      </span>
                    )}
                  </div>
                  
                  {node.summary && (
                    <p className="text-xs text-gray-500 mt-1 ml-8 line-clamp-2">{node.summary}</p>
                  )}
                  
                  <div className="flex gap-1 mt-2 ml-8 flex-wrap">
                    {node.type !== 'scene' && (
                      <button
                        onClick={() => {
                          const nextType = node.type === 'volume' ? 'chapter' : node.type === 'chapter' ? 'section' : 'scene'
                          onAddChild(node.id!, nextType)
                        }}
                        className="text-xs px-2 py-1 bg-white/50 rounded hover:bg-white/80"
                      >
                        + {typeLabels[node.type === 'volume' ? 'chapter' : node.type === 'chapter' ? 'section' : 'scene']}
                      </button>
                    )}
                    <button
                      onClick={() => node.id && onDelete(node.id)}
                      className="text-xs px-2 py-1 bg-white/50 rounded hover:bg-red-50 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                {children.length > 0 && (
                  <div className="ml-4 mt-2 pl-4 border-l-2 border-gray-200">
                    <OutlineTree
                      nodes={children}
                      allNodes={allNodes}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddChild={onAddChild}
                      onOpenNode={onOpenNode}
                      activeNodeId={activeNodeId}
                      depth={depth + 1}
                      storylines={storylines}
                      chapterStorylineLinks={chapterStorylineLinks}
                      totalBookWords={totalBookWords}
                      totalBookGoal={totalBookGoal}
                    />
                  </div>
                )}
              </div>
            )}
          </Draggable>
        )
      })}
    </div>
  )
}
