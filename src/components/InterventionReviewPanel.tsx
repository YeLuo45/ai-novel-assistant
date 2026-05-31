import { useState } from 'react'
import type { InterventionPoint, UserAction } from '@/ai/intervention/types'

interface Props {
  point: InterventionPoint
  onAction: (action: UserAction) => void
  onCancel: () => void
}

export function InterventionReviewPanel({ point, onAction, onCancel }: Props) {
  const [editedContent, setEditedContent] = useState(point.content)
  const [showEditor, setShowEditor] = useState(false)
  const [comment, setComment] = useState('')

  const handleApprove = () => {
    onAction({ type: 'approve', userComment: comment })
  }

  const handleReject = () => {
    onAction({ type: 'reject', userComment: comment })
  }

  const handleModify = () => {
    if (showEditor) {
      onAction({
        type: 'modify',
        modifiedContent: editedContent,
        userComment: comment
      })
    } else {
      setShowEditor(true)
    }
  }

  const handleRerun = () => {
    onAction({
      type: 'rerun',
      targetAgent: point.agentId || undefined,
      newPrompt: editedContent
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold">需要您的确认</h3>
              <p className="text-sm text-gray-600">
                {point.agentId || 'Agent'} 的输出需要您审核
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Agent输出</h4>
            <div className="p-4 bg-gray-50 border rounded-lg">
              {showEditor ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-48 p-2 border rounded text-sm"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">{point.content}</pre>
              )}
            </div>
          </div>

          {point.suggestedEdit && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">建议修改</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-blue-700">{point.suggestedEdit}</pre>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">您的意见（可选）</h4>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="可以输入您的意见或修改原因..."
              className="w-full h-20 p-2 border rounded text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            取消
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              ↻ 重新生成
            </button>
            <button
              onClick={handleModify}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showEditor ? '确认修改' : '✎ 修改内容'}
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ✕ 拒绝
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✓ 确认
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
