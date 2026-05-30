import { useState } from 'react'
import type { WritingVersion, VersionComparison } from '@/ai/versioning/types'

interface Props {
  versions: WritingVersion[]
  comparison: VersionComparison
  onSelect: (versionId: string) => void
  onMerge: (selections: { [versionId: string]: number[] }) => void
}

export function VersionCompare({ versions, comparison, onSelect, onMerge }: Props) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'side_by_side' | 'unified_diff' | 'sequential'>('side_by_side')
  const [diffHighlight, setDiffHighlight] = useState(0)
  const [selections, setSelections] = useState<{ [versionId: string]: number[] }>({})

  const renderSideBySide = () => (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${versions.length}, 1fr)` }}>
      {versions.map(version => (
        <div 
          key={version.id} 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedVersion === version.id 
              ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50' 
              : 'border-gray-200 hover:border-purple-300'
          }`}
          onClick={() => {
            setSelectedVersion(version.id)
            onSelect(version.id)
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">版本 {version.versionNumber}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              version.metadata.strategy === 'style_variation' ? 'bg-blue-100 text-blue-700' :
              version.metadata.strategy === 'plot_branch' ? 'bg-green-100 text-green-700' :
              version.metadata.strategy === 'pov_switch' ? 'bg-purple-100 text-purple-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {version.metadata.strategy === 'style_variation' ? '风格' :
               version.metadata.strategy === 'plot_branch' ? '情节' :
               version.metadata.strategy === 'pov_switch' ? '视角' : '语气'}
            </span>
          </div>
          
          {/* 分析指标 */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="text-center p-1 bg-gray-50 rounded">
              <div className="font-medium">{version.analysis.tone}</div>
              <div className="text-gray-500">基调</div>
            </div>
            <div className="text-center p-1 bg-gray-50 rounded">
              <div className="font-medium">{version.analysis.pacing}</div>
              <div className="text-gray-500">节奏</div>
            </div>
            <div className="text-center p-1 bg-gray-50 rounded">
              <div className="font-medium">{version.analysis.conflictLevel}</div>
              <div className="text-gray-500">冲突</div>
            </div>
          </div>
          
          {/* 内容预览 */}
          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {version.content.slice(0, 300)}...
          </div>
        </div>
      ))}
    </div>
  )

  const renderUnifiedDiff = () => {
    const differences = comparison.differences
    const currentDiff = differences[diffHighlight] || differences[0]

    return (
      <div className="space-y-4">
        {/* 差异导航 */}
        {differences.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
            <span className="text-sm text-gray-600">差异位置：</span>
            {differences.map((_, i) => (
              <button
                key={i}
                onClick={() => setDiffHighlight(i)}
                className={`px-2 py-1 rounded text-sm ${
                  diffHighlight === i ? 'bg-purple-500 text-white' : 'bg-white'
                }`}
              >
                #{i + 1}
              </button>
            ))}
          </div>
        )}
        
        {/* 差异内容 */}
        {currentDiff ? (
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-2">
              段落 {currentDiff.location.paragraph + 1}
              <span className="ml-2 px-2 py-0.5 bg-purple-100 rounded text-purple-700">
                {currentDiff.type === 'plot' ? '情节' :
                 currentDiff.type === 'style' ? '风格' :
                 currentDiff.type === 'tone' ? '语气' : '角色'}
              </span>
            </div>
            
            <div className="space-y-3">
              {versions.map(version => (
                <div 
                  key={version.id}
                  className={`p-3 rounded border cursor-pointer ${
                    selectedVersion === version.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedVersion(version.id)
                    onSelect(version.id)
                  }}
                >
                  <div className="font-medium text-sm mb-1">版本 {version.versionNumber}</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {currentDiff.versions[version.id] || '(无)'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">各版本内容相似</div>
        )}
      </div>
    )
  }

  const renderSequential = () => (
    <div className="space-y-4">
      {versions.map(version => (
        <div 
          key={version.id} 
          className={`border rounded-lg p-4 ${
            selectedVersion === version.id ? 'border-purple-500' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">版本 {version.versionNumber}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedVersion(version.id)
                  onSelect(version.id)
                }}
                className={`px-3 py-1 rounded text-sm ${
                  selectedVersion === version.id 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                选择此版本
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {version.content}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="version-compare p-4">
      {/* 视图切换 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">对比模式：</span>
        {(['side_by_side', 'unified_diff', 'sequential'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === mode ? 'bg-purple-500 text-white' : 'bg-gray-100'
            }`}
          >
            {mode === 'side_by_side' ? '并排' : mode === 'unified_diff' ? '差异' : '顺序'}
          </button>
        ))}
      </div>

      {/* 渲染模式 */}
      {viewMode === 'side_by_side' && renderSideBySide()}
      {viewMode === 'unified_diff' && renderUnifiedDiff()}
      {viewMode === 'sequential' && renderSequential()}

      {/* 推荐 */}
      {comparison.recommendations.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium mb-2">💡 推荐</h4>
          <div className="space-y-2">
            {comparison.recommendations.slice(0, 2).map((rec, i) => {
              const version = versions.find(v => v.id === rec.versionId)
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-medium bg-green-500 text-white px-2 py-0.5 rounded">
                    推荐
                  </span>
                  <span className="font-medium">版本 {version?.versionNumber}</span>
                  <span className="text-gray-600">({rec.score}分) {rec.reason}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}