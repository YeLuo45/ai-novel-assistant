import { useState, useRef, useEffect } from 'react'
import { AIAssistType, PROMPTS } from '../utils/ai-assist'
import { streamLLM } from '../ai/llm'

interface Props {
  selectedText: string
  content: string
  onApply: (text: string) => void
}

const BUTTONS: { type: AIAssistType; label: string; icon: string }[] = [
  { type: 'continue', label: '续写', icon: '▶' },
  { type: 'polish', label: '润色', icon: '✎' },
  { type: 'expand', label: '扩写', icon: '↗' },
  { type: 'summarize', label: '缩写', icon: '↙' },
  { type: 'grammar', label: '语法检查', icon: '✓' }
]

export default function AIAssistBar({ selectedText, content, onApply }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState<AIAssistType | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [streamingResult, setStreamingResult] = useState('')  // 流式输出中间结果
  const [isStreaming, setIsStreaming] = useState(false)      // 是否正在流式输出
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini')
  const barRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<(() => void) | null>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = async (type: AIAssistType) => {
    if (loading) return
    
    setLoading(type)
    setResult(null)
    setStreamingResult('')
    setIsStreaming(true)
    setError(null)
    
    // 构建 prompt
    const prompt = type === 'continue' 
      ? PROMPTS.continue(content) 
      : PROMPTS[type](selectedText)
    
    // 用于在回调中累积流式结果
    let accumulated = ''
    
    try {
      // 使用流式 API，边收边显示
      const observable = await streamLLM({
        model: selectedModel,
        messages: [
          { role: 'system', content: '你是一位专业的小说创作助手，擅长写作润色、语法纠错、情节扩写缩写等工作。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }, 'ai-assist')
      
      subscriptionRef.current = observable.subscribe((event: any) => {
        if (event.type === 'done') {
          setIsStreaming(false)
          setResult(accumulated)
        } else if (event.type === 'text' && event.content) {
          accumulated += event.content
          setStreamingResult(accumulated)
        } else if (event.type === 'error') {
          setError(event.content || 'Unknown error')
          setIsStreaming(false)
        }
      })
    } catch (error: any) {
      setError(`错误: ${error.message}`)
      setIsStreaming(false)
    } finally {
      setLoading(null)
    }
  }

  const handleApply = () => {
    if (result) {
      onApply(result)
      setResult(null)
      setStreamingResult('')
      setIsOpen(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleCancel = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current()
      subscriptionRef.current = null
    }
    setLoading(null)
    setIsStreaming(false)
    setError(null)
    setStreamingResult('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-xl"
        title="AI 辅助"
      >
        ✨
      </button>
    )
  }

  return (
    <div
      ref={barRef}
      className="fixed bottom-20 right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-800">AI 辅助写作</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 模型选择 */}
      <select
        value={selectedModel}
        onChange={e => setSelectedModel(e.target.value)}
        className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <optgroup label="OpenAI">
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </optgroup>
        <optgroup label="Anthropic">
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        </optgroup>
        <optgroup label="MiniMax">
          <option value="minimax">MiniMax</option>
        </optgroup>
      </select>

      {/* 功能按钮 */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {BUTTONS.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleAction(type)}
            disabled={loading !== null}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              loading === type
                ? 'bg-indigo-100 cursor-not-allowed text-indigo-400'
                : 'hover:bg-indigo-50 text-indigo-600'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>

      {/* 加载/流式状态 */}
      {(loading || isStreaming) && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
            <span>{isStreaming ? '生成中...' : '思考中...'}</span>
            <button
              onClick={handleCancel}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              取消
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
            {streamingResult || <span className="animate-pulse">正在等待响应...</span>}
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-red-500 mb-2 flex items-center gap-1">
            <span>⚠</span> {error}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm"
            >
              重试
            </button>
            <button
              onClick={() => setError(null)}
              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 结果预览 */}
      {result && !isStreaming && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs text-gray-500 mb-2">预览结果：</div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
            {result}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setResult(null)}
              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              应用
            </button>
          </div>
        </div>
      )}

      {/* 提示文字 */}
      {!selectedText && !loading && !result && !error && (
        <div className="text-xs text-gray-400 text-center">
          选中文字后可使用润色、扩写、缩写、语法检查功能
        </div>
      )}
    </div>
  )
}
