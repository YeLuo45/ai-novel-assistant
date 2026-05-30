import { useState } from 'react'
import { cacheManager } from '@/ai/optimization/CacheManager'
import { draftMode } from '@/ai/optimization/DraftMode'

interface Props {
  cacheEnabled: boolean
  onCacheToggle: (enabled: boolean) => void
  parallelEnabled: boolean
  onParallelToggle: (enabled: boolean) => void
  draftEnabled: boolean
  onDraftToggle: (enabled: boolean) => void
}

export function OptimizationPanel({
  cacheEnabled,
  onCacheToggle,
  parallelEnabled,
  onParallelToggle,
  draftEnabled,
  onDraftToggle
}: Props) {
  const [stats, setStats] = useState(() => cacheManager.getStats())
  
  const handleRefreshStats = () => {
    setStats(cacheManager.getStats())
  }
  
  const handleClearCache = () => {
    cacheManager.clear()
    setStats(cacheManager.getStats())
  }
  
  return (
    <div className="optimization-panel p-4 bg-white border rounded-lg">
      <h3 className="font-bold mb-4">⚡ 协作优化</h3>
      
      <div className="space-y-4">
        {/* 缓存开关 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Agent输出缓存</div>
            <div className="text-sm text-gray-500">相似任务复用结果</div>
          </div>
          <button
            onClick={() => onCacheToggle(!cacheEnabled)}
            className={`px-4 py-2 rounded text-sm ${
              cacheEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {cacheEnabled ? '已启用' : '已禁用'}
          </button>
        </div>
        
        {/* 并行执行开关 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">并行执行</div>
            <div className="text-sm text-gray-500">独立任务同时执行</div>
          </div>
          <button
            onClick={() => onParallelToggle(!parallelEnabled)}
            className={`px-4 py-2 rounded text-sm ${
              parallelEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {parallelEnabled ? '已启用' : '已禁用'}
          </button>
        </div>
        
        {/* 草稿模式开关 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">草稿模式</div>
            <div className="text-sm text-gray-500">先生成再精修</div>
          </div>
          <button
            onClick={() => onDraftToggle(!draftEnabled)}
            className={`px-4 py-2 rounded text-sm ${
              draftEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {draftEnabled ? '已启用' : '已禁用'}
          </button>
        </div>
        
        {/* 统计信息 */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">缓存统计</span>
            <button
              onClick={handleRefreshStats}
              className="text-sm text-purple-500 hover:underline"
            >
              刷新
            </button>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>缓存条目: {stats.size}</div>
            <div>命中率: {stats.hitRate.toFixed(2)}</div>
          </div>
          
          <button
            onClick={handleClearCache}
            className="mt-2 text-sm text-red-500 hover:underline"
          >
            清除缓存
          </button>
        </div>
      </div>
    </div>
  )
}
