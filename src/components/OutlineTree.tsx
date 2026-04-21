import { Draggable } from 'react-beautiful-dnd'
import { OutlineNode } from '../db'

interface Props {
  nodes: OutlineNode[]
  allNodes: OutlineNode[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onAddChild: (parentId: number | null, type: 'volume' | 'chapter' | 'section' | 'scene') => void
  depth?: number
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

export default function OutlineTree({ nodes, allNodes, onEdit, onDelete, onAddChild, depth = 0 }: Props) {
  return (
    <div>
      {nodes.map((node, index) => {
        const children = allNodes.filter(n => n.parentId === node.id)
        
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
                  className={`p-3 bg-white rounded-lg border ${typeColors[node.type]} ${
                    snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">{statusIcons[node.status]}</span>
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-white/50 rounded">
                      {typeLabels[node.type]}
                    </span>
                    <button
                      onClick={() => node.id && onEdit(node.id)}
                      className="flex-1 text-left text-sm font-medium hover:text-indigo-600 truncate"
                    >
                      {node.title}
                    </button>
                  </div>
                  
                  {node.summary && (
                    <p className="text-xs text-gray-500 mt-1 ml-8 line-clamp-2">{node.summary}</p>
                  )}
                  
                  <div className="flex gap-1 mt-2 ml-8">
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
                      depth={depth + 1}
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
