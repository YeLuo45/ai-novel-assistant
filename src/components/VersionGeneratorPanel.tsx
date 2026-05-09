import { useState } from 'react'
import type { VersionOptions, VersionStrategy } from '@/ai/versioning/types'
import { VERSION_STRATEGIES } from '@/ai/versioning/versionConfig'

interface Props {
  onGenerate: (options: VersionOptions) => void
  isLoading?: boolean
}

export function VersionGeneratorPanel({ onGenerate, isLoading }: Props) {
  const [count, setCount] = useState<2 | 3 | 4>(2)
  const [strategy, setStrategy] = useState<VersionStrategy>('style_variation')
  const [showOptions, setShowOptions] = useState(false)

  const handleGenerate = () => {
    onGenerate({
      count,
      strategy,
      compareMode: 'side_by_side'
    })
  }

  return (
    <div className="version-generator-panel border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium ${
            isLoading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚙️</span>
              生成中...
            </span>
          ) : (
            '🔀 生成多版本'
          )}
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          {showOptions ? '收起选项' : '选项配置'}
        </button>
      </div>

      {/* 高级选项 */}
      {showOptions && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* 版本数量 */}
          <div>
            <label className="block text-sm font-medium mb-2">版本数量</label>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-3 py-1 rounded ${
                    count === n ? 'bg-purple-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  {n}个版本
                </button>
              ))}
            </div>
          </div>

          {/* 生成策略 */}
          <div>
            <label className="block text-sm font-medium mb-2">生成策略</label>
            <div className="grid grid-cols-2 gap-2">
              {VERSION_STRATEGIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className={`p-2 border rounded text-left ${
                    strategy === s.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}