import { useStore } from '../store'

interface TimelineControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  filterStorylineId: number | null
  onFilterStorylineChange: (id: number | null) => void
  viewMode: 'timeline' | 'flow'
  onViewModeChange: (mode: 'timeline' | 'flow') => void
}

export default function TimelineControls({
  zoom,
  onZoomChange,
  filterStorylineId,
  onFilterStorylineChange,
  viewMode,
  onViewModeChange
}: TimelineControlsProps) {
  const { storylines } = useStore()

  return (
    <div className="flex items-center gap-4 p-3 bg-white border-b border-gray-200">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">视图:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('timeline')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'timeline' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📅 时间线
          </button>
          <button
            onClick={() => onViewModeChange('flow')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'flow' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🌊 流程图
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">缩放:</span>
        <button
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          −
        </button>
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${(zoom / 2) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Storyline Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">筛选:</span>
        <select
          value={filterStorylineId || ''}
          onChange={(e) => onFilterStorylineChange(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部故事线</option>
          {storylines.map(storyline => (
            <option key={storyline.id} value={storyline.id}>
              {storyline.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Zoom Presets */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onZoomChange(0.5)}
          className={`px-2 py-1 text-xs rounded ${
            Math.abs(zoom - 0.5) < 0.01 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          50%
        </button>
        <button
          onClick={() => onZoomChange(1)}
          className={`px-2 py-1 text-xs rounded ${
            Math.abs(zoom - 1) < 0.01 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          100%
        </button>
        <button
          onClick={() => onZoomChange(1.5)}
          className={`px-2 py-1 text-xs rounded ${
            Math.abs(zoom - 1.5) < 0.01 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          150%
        </button>
        <button
          onClick={() => onZoomChange(2)}
          className={`px-2 py-1 text-xs rounded ${
            Math.abs(zoom - 2) < 0.01 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          200%
        </button>
      </div>
    </div>
  )
}
