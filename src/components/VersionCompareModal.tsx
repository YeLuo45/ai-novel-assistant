import type { WritingVersion, VersionComparison } from '@/ai/versioning/types'
import { VersionCompare } from './VersionCompare'

interface Props {
  versions: WritingVersion[]
  comparison: VersionComparison
  onSelect: (versionId: string) => void
  onMerge: (selections: { [versionId: string]: number[] }) => void
  onClose: () => void
}

export function VersionCompareModal({ versions, comparison, onSelect, onMerge, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">🔀 多版本对比</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <VersionCompare 
            versions={versions}
            comparison={comparison}
            onSelect={onSelect}
            onMerge={onMerge}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={() => {
              // 触发合并
              const allSelections = versions.reduce((acc, v) => {
                acc[v.id] = []
                return acc
              }, {} as { [versionId: string]: number[] })
              onMerge(allSelections)
              onClose()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            合并版本
          </button>
        </div>
      </div>
    </div>
  )
}