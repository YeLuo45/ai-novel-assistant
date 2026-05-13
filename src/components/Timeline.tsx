/**
 * Timeline.tsx - V24
 * 竖向时间轴组件，支持拖拽排序和AI生成
 */

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { db, TimelineEvent, OutlineNode } from '../db'
import { generateTimelineEvents } from '../ai/fill'

interface Props {
  projectId: number
  events: TimelineEvent[]
  onEventsChange: (events: TimelineEvent[]) => void
  chapters: OutlineNode[]
}

export default function Timeline({ projectId, events, onEventsChange, chapters }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<number | null>(null)

  // Load events from DB on mount
  useEffect(() => {
    loadEvents()
  }, [projectId])

  const loadEvents = async () => {
    const loaded = await db.timelineEvents
      .where('projectId').equals(projectId)
      .sortBy('order')
    onEventsChange(loaded)
  }

  // Handle drag end
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const reordered = Array.from(events)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    // Update order
    const updated = reordered.map((e, idx) => ({ ...e, order: idx }))
    onEventsChange(updated)

    // Persist to DB
    for (const event of updated) {
      if (event.id) {
        await db.timelineEvents.update(event.id, { order: event.order })
      }
    }
  }

  // Add new event
  const handleAddEvent = async () => {
    const newEvent: Omit<TimelineEvent, 'id'> = {
      projectId,
      title: '新事件',
      description: '',
      order: events.length,
      chapterIds: []
    }
    const id = await db.timelineEvents.add(newEvent as TimelineEvent)
    onEventsChange([...events, { ...newEvent, id: id as number }])
  }

  // Delete event
  const handleDeleteEvent = async (id: number) => {
    await db.timelineEvents.delete(id)
    onEventsChange(events.filter(e => e.id !== id))
  }

  // Update event
  const handleUpdateEvent = async (id: number, updates: Partial<TimelineEvent>) => {
    await db.timelineEvents.update(id, updates)
    onEventsChange(events.map(e => e.id === id ? { ...e, ...updates } : e))
    setEditingEvent(null)
  }

  // AI generate events
  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      // Get storylines
      const storylines = await db.storylines.where('projectId').equals(projectId).toArray()
      
      // Convert chapters OutlineNode to ChapterPlan format
      const chapterPlans = chapters
        .filter(c => c.type === 'chapter')
        .map(c => ({
          index: c.order + 1,
          title: c.title,
          summary: c.summary
        }))

      const project = await db.projects.get(projectId)
      if (!project) return

      const generated = await generateTimelineEvents(project, storylines, chapterPlans)
      
      // Add projectId and save to DB
      const eventsWithProject = generated.map((e, idx) => ({
        ...e,
        projectId,
        order: events.length + idx
      }))

      for (const event of eventsWithProject) {
        await db.timelineEvents.add(event as TimelineEvent)
      }

      onEventsChange([...events, ...eventsWithProject])
    } catch (error) {
      console.error('AI生成时间线事件失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Get chapter title by ID
  const getChapterTitle = (chapterId: number) => {
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter?.title || `第${chapterId}章`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">📅 时间线</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200 transition-colors disabled:opacity-50"
          >
            {isGenerating ? '🤖 AI生成中...' : '🤖 AI提取关键事件'}
          </button>
          <button
            onClick={handleAddEvent}
            className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200 transition-colors"
          >
            + 添加事件
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <p>暂无时间线事件</p>
          <p className="text-sm">点击"AI提取"或"添加事件"开始</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timeline">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {events.map((event, index) => (
                  <Draggable key={event.id} draggableId={String(event.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-gray-50 rounded-lg p-3 border border-gray-200 ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-300' : ''
                        }`}
                      >
                        {editingEvent === event.id ? (
                          <EventEditor
                            event={event}
                            chapters={chapters}
                            onSave={(updates) => event.id && handleUpdateEvent(event.id, updates)}
                            onCancel={() => setEditingEvent(null)}
                          />
                        ) : (
                          <div className="flex items-start gap-3">
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {index + 1}
                              </div>
                              {index < events.length - 1 && (
                                <div className="w-0.5 h-8 bg-gray-300 mt-1" />
                              )}
                            </div>

                            {/* Event content */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-800">{event.title}</h4>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setEditingEvent(event.id)}
                                    className="p-1 text-gray-400 hover:text-indigo-600"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => event.id && handleDeleteEvent(event.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                              {event.chapterIds && event.chapterIds.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {event.chapterIds.map(chId => (
                                    <span
                                      key={chId}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs"
                                    >
                                      {getChapterTitle(chId)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

// Event editor sub-component
interface EventEditorProps {
  event: TimelineEvent
  chapters: OutlineNode[]
  onSave: (updates: Partial<TimelineEvent>) => void
  onCancel: () => void
}

function EventEditor({ event, chapters, onSave, onCancel }: EventEditorProps) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [selectedChapters, setSelectedChapters] = useState<number[]>(event.chapterIds || [])

  const handleSubmit = () => {
    onSave({ title, description, chapterIds: selectedChapters })
  }

  const toggleChapter = (chapterId: number) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="事件标题"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="事件描述"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
      />
      <div>
        <p className="text-xs text-gray-500 mb-1">关联章节：</p>
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {chapters.filter(c => c.type === 'chapter').map(chapter => (
            <button
              key={chapter.id}
              onClick={() => chapter.id && toggleChapter(chapter.id)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedChapters.includes(chapter.id!)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {chapter.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
        >
          保存
        </button>
      </div>
    </div>
  )
}
