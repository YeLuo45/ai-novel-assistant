import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore } from '../store'
import TimelineCard from './TimelineCard'
import TimelineControls from './TimelineControls'

interface TimelineViewProps {
  onEditNode: (nodeId: number) => void
  onOpenNode: (nodeId: number) => void
}

export default function TimelineView({ onEditNode, onOpenNode }: TimelineViewProps) {
  const { outlineNodes, storylines, chapterStorylineLinks } = useStore()
  
  const [zoom, setZoom] = useState(1)
  const [filterStorylineId, setFilterStorylineId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'flow'>('timeline')
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get root nodes (volumes or top-level chapters)
  const rootNodes = useMemo(() => {
    let nodes = outlineNodes.filter(n => n.parentId === null)
    
    // If no volumes, show top-level chapters
    if (nodes.length === 0) {
      nodes = outlineNodes.filter(n => n.parentId === null && n.type === 'chapter')
    }
    
    return nodes.sort((a, b) => a.order - b.order)
  }, [outlineNodes])

  // Get chapters grouped by volume
  const chaptersByVolume = useMemo(() => {
    const chapters = outlineNodes.filter(n => n.type === 'chapter')
    const grouped: { volume: typeof chapters[0] | null; chapters: typeof chapters }[] = []
    
    const volumes = rootNodes.filter(n => n.type === 'volume')
    
    if (volumes.length > 0) {
      volumes.forEach(volume => {
        const volumeChapters = chapters
          .filter(c => c.parentId === volume.id)
          .sort((a, b) => a.order - b.order)
        grouped.push({ volume, chapters: volumeChapters })
      })
    } else {
      // No volumes, show all chapters directly
      grouped.push({ volume: null, chapters: chapters.sort((a, b) => a.order - b.order) })
    }
    
    return grouped
  }, [outlineNodes, rootNodes])

  // Filter chapters by storyline
  const filteredChaptersByVolume = useMemo(() => {
    if (!filterStorylineId) return chaptersByVolume
    
    return chaptersByVolume.map(group => ({
      ...group,
      chapters: group.chapters.filter(chapter => 
        chapterStorylineLinks.some(
          link => link.chapterId === chapter.id && link.storylineId === filterStorylineId
        )
      )
    })).filter(group => group.chapters.length > 0)
  }, [chaptersByVolume, filterStorylineId, chapterStorylineLinks])

  // Calculate total timeline height
  const timelineHeight = useMemo(() => {
    const cardHeight = 160 // Estimated card height
    const rowGap = 80
    let totalChapters = 0
    filteredChaptersByVolume.forEach(group => {
      totalChapters += group.chapters.length
    })
    return Math.max(600, (totalChapters * (cardHeight + rowGap)) / 2 + 200)
  }, [filteredChaptersByVolume])

  // Handle scroll
  const handleScroll = (direction: 'left' | 'right' | 'top' | 'bottom') => {
    const container = containerRef.current
    if (!container) return
    
    const scrollAmount = 200
    switch (direction) {
      case 'left':
        container.scrollLeft -= scrollAmount
        setScrollPosition(container.scrollLeft - scrollAmount)
        break
      case 'right':
        container.scrollLeft += scrollAmount
        setScrollPosition(container.scrollLeft + scrollAmount)
        break
      case 'top':
        container.scrollTop -= scrollAmount
        break
      case 'bottom':
        container.scrollTop += scrollAmount
        break
    }
  }

  // Reset scroll position when filter changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0
      setScrollPosition(0)
    }
  }, [filterStorylineId])

  // Empty state
  if (outlineNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">暂无内容</h3>
          <p className="text-sm text-gray-500">请先在大纲中创建章节</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Controls */}
      <TimelineControls
        zoom={zoom}
        onZoomChange={setZoom}
        filterStorylineId={filterStorylineId}
        onFilterStorylineChange={setFilterStorylineId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Timeline Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        style={{ perspective: '1000px' }}
      >
        {/* Horizontal scroll controls */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <button
            onClick={() => handleScroll('left')}
            className="w-10 h-10 rounded-full bg-white shadow hover:shadow-md flex items-center justify-center text-gray-600 transition-all"
          >
            ←
          </button>
          <div className="text-sm text-gray-600">
            滚动浏览章节时间线
          </div>
          <button
            onClick={() => handleScroll('right')}
            className="w-10 h-10 rounded-full bg-white shadow hover:shadow-md flex items-center justify-center text-gray-600 transition-all"
          >
            →
          </button>
        </div>

        {/* Timeline */}
        <div 
          className="relative py-8 px-4"
          style={{ 
            minHeight: `${timelineHeight}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300" />

          {/* Volume sections */}
          {filteredChaptersByVolume.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-8">
              {/* Volume header */}
              {group.volume && (
                <div className="mb-6 text-center">
                  <div className="inline-block px-6 py-2 bg-purple-100 rounded-full">
                    <span className="text-lg font-semibold text-purple-700">
                      📚 {group.volume.title}
                    </span>
                  </div>
                </div>
              )}

              {/* Chapter cards in zigzag pattern */}
              <div className="relative">
                {group.chapters.map((chapter, index) => {
                  const position = index % 2 === 0 ? 'left' : 'right'
                  const isActive = false // Could be connected to currentNodeId
                  
                  return (
                    <div
                      key={chapter.id}
                      className="relative mb-16"
                      style={{ minHeight: '140px' }}
                    >
                      {/* Connector line */}
                      <div 
                        className={`absolute top-1/2 w-8 h-0.5 bg-indigo-300 ${
                          position === 'left' 
                            ? 'left-[41.67%] border-l-2 border-indigo-300' 
                            : 'right-[41.67%] border-r-2 border-indigo-300'
                        }`}
                      />
                      
                      {/* Timeline node */}
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow ${
                          position === 'left' ? '-left-2' : '-right-2'
                        }`}
                      />

                      {/* Card */}
                      <TimelineCard
                        node={chapter}
                        storylines={storylines}
                        chapterStorylineLinks={chapterStorylineLinks}
                        onEdit={onEditNode}
                        onOpen={onOpenNode}
                        isActive={isActive}
                        position={position}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Empty filter state */}
          {filteredChaptersByVolume.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">无匹配章节</h3>
              <p className="text-sm text-gray-500">
                当前筛选条件下没有章节，请尝试其他故事线
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-3 py-2 text-sm text-gray-600">
        按住 Ctrl + 滚轮可缩放
      </div>
    </div>
  )
}
