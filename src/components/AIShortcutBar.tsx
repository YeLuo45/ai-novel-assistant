/**
 * 编辑器 AI 快捷工具栏
 * - 续写/润色/扩写/缩写快捷按钮
 * - 选中文字后点击按钮触发 AI 建议
 */

import { useState, useRef, useEffect } from 'react'
import InlineSuggestionPanel from './InlineSuggestionPanel'
import type { WritingAssistType } from '../ai/writingAssistant'

interface Props {
  selectedText: string
  content: string
  onApply: (text: string) => void
}

const BUTTONS: { type: WritingAssistType; label: string; icon: string }[] = [
  { type: 'continue', label: '续写', icon: '✍' },
  { type: 'polish', label: '润色', icon: '🖊' },
  { type: 'expand', label: '扩写', icon: '📖' },
  { type: 'summarize', label: '缩写', icon: '📝' }
]

export default function AIShortcutBar({ selectedText, content, onApply }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeType, setActiveType] = useState<WritingAssistType>('polish')
  const barRef = useRef<HTMLDivElement>(null)

  // 获取选中文字前后的上下文
  const getContextBefore = () => {
    if (!selectedText || !content) return ''
    const index = content.indexOf(selectedText)
    if (index <= 0) return ''
    return content.slice(Math.max(0, index - 200), index)
  }

  const getContextAfter = () => {
    if (!selectedText || !content) return ''
    const index = content.indexOf(selectedText)
    if (index < 0) return ''
    const endIndex = index + selectedText.length
    return content.slice(endIndex, endIndex + 200)
  }

  const handleButtonClick = (type: WritingAssistType) => {
    setActiveType(type)
    setIsOpen(true)
  }

  const handleApply = (text: string) => {
    onApply(text)
  }

  if (!isOpen) {
    return (
      <div
        ref={barRef}
        className="fixed bottom-20 right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex gap-1"
      >
        {BUTTONS.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleButtonClick(type)}
            disabled={type !== 'continue' && !selectedText}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              type !== 'continue' && !selectedText
                ? 'opacity-50 cursor-not-allowed text-gray-400'
                : 'hover:bg-indigo-50 text-indigo-600'
            }`}
            title={type === 'continue' ? '续写（基于全文）' : `润色选中文本：${label}`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      <InlineSuggestionPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        type={activeType}
        originalText={activeType === 'continue' ? content : selectedText}
        contextBefore={getContextBefore()}
        contextAfter={getContextAfter()}
        onApply={handleApply}
      />
    </>
  )
}
