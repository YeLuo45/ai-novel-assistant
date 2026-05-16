/**
 * Diff对比组件
 * 以行为单位计算diff，绿色显示新增行，红色显示删除行
 * V31: 使用 diff npm 包进行对比
 */

import { useMemo } from 'react'
import { diffLines } from 'diff'

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

interface Props {
  oldContent: string
  newContent: string
  oldVersionLabel?: string
  newVersionLabel?: string
  onOldVersionChange?: (version: string) => void
  onNewVersionChange?: (version: string) => void
  versions?: { label: string; content: string }[]
}

export default function DiffViewer({
  oldContent,
  newContent,
  oldVersionLabel = '旧版本',
  newVersionLabel = '新版本',
  versions
}: Props) {
  // Compute diff using diff package
  const diffResult = useMemo(() => {
    return diffLines(oldContent, newContent)
  }, [oldContent, newContent])

  // Statistics
  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    let unchanged = 0
    
    diffResult.forEach(part => {
      if (part.added) {
        added += part.count || 1
      } else if (part.removed) {
        removed += part.count || 1
      } else {
        unchanged += part.count || 1
      }
    })
    
    return { added, removed, unchanged }
  }, [diffResult])

  // Convert to display lines
  const diffLines = useMemo(() => {
    const lines: DiffLine[] = []
    let lineNum = 1
    
    diffResult.forEach(part => {
      const partLines = part.value.split('\n')
      // Remove last empty entry if the part ends with newline
      if (partLines[partLines.length - 1] === '') {
        partLines.pop()
      }
      
      partLines.forEach(line => {
        if (part.added) {
          lines.push({ type: 'added', content: line, lineNumber: lineNum++ })
        } else if (part.removed) {
          lines.push({ type: 'removed', content: line })
        } else {
          lines.push({ type: 'unchanged', content: line, lineNumber: lineNum++ })
        }
      })
    })
    
    return lines
  }, [diffResult])

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header with stats */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600">+{stats.added} 新增</span>
          <span className="text-red-600">-{stats.removed} 删除</span>
          <span className="text-gray-500">{stats.unchanged} 未变</span>
        </div>
      </div>
      
      {/* Version labels */}
      <div className="flex border-b border-gray-200">
        <div className="flex-1 px-4 py-2 text-sm text-red-600 bg-red-50 border-r border-gray-200">
          ← {oldVersionLabel}
        </div>
        <div className="flex-1 px-4 py-2 text-sm text-green-600 bg-green-50">
          → {newVersionLabel}
        </div>
      </div>
      
      {/* Diff content */}
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`flex ${
              line.type === 'added' ? 'bg-green-50 text-green-800' :
              line.type === 'removed' ? 'bg-red-50 text-red-800' :
              'text-gray-700'
            }`}
          >
            <div className="w-12 px-2 py-0.5 text-right text-gray-400 border-r border-gray-200 select-none">
              {line.lineNumber || ''}
            </div>
            <div className="w-6 px-1 py-0.5 text-center select-none">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
            </div>
            <div className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
              {line.content || '\u00A0'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
