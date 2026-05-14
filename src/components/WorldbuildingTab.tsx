/**
 * 世界观助手 Tab
 * 基于项目素材卡进行设定问答
 */

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { streamLLM } from '../ai/llm'
import type { LLMEvent } from '../ai/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_QUESTIONS = [
  '帮我梳理主角的关系网',
  '检查设定有没有矛盾',
  '这个场景需要什么道具？',
  '介绍下这个世界的力量体系',
  '有哪些潜在的角色冲突？'
]

export default function WorldbuildingTab() {
  const { currentProject, materialCards, outlineNodes } = useStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 格式化素材卡内容
  const formatMaterialCards = () => {
    if (materialCards.length === 0) {
      return '（暂无素材卡）'
    }

    const byType = {
      character: materialCards.filter(c => c.type === 'character'),
      location: materialCards.filter(c => c.type === 'location'),
      item: materialCards.filter(c => c.type === 'item')
    }

    let formatted = ''

    if (byType.character.length > 0) {
      formatted += '【角色】\n'
      byType.character.forEach(card => {
        formatted += `• ${card.name}\n`
        Object.entries(card.fields).forEach(([key, value]) => {
          formatted += `  - ${key}: ${value}\n`
        })
      })
      formatted += '\n'
    }

    if (byType.location.length > 0) {
      formatted += '【地点】\n'
      byType.location.forEach(card => {
        formatted += `• ${card.name}\n`
        Object.entries(card.fields).forEach(([key, value]) => {
          formatted += `  - ${key}: ${value}\n`
        })
      })
      formatted += '\n'
    }

    if (byType.item.length > 0) {
      formatted += '【物品】\n'
      byType.item.forEach(card => {
        formatted += `• ${card.name}\n`
        Object.entries(card.fields).forEach(([key, value]) => {
          formatted += `  - ${key}: ${value}\n`
        })
      })
      formatted += '\n'
    }

    return formatted
  }

  // 格式化大纲概要
  const formatOutlineSummary = () => {
    if (outlineNodes.length === 0) {
      return '（暂无大纲）'
    }

    const volumes = outlineNodes.filter(n => n.type === 'volume' && n.parentId === null)
    let summary = ''

    volumes.forEach(volume => {
      summary += `【${volume.title}】\n`
      const chapters = outlineNodes.filter(n => n.parentId === volume.id)
      chapters.forEach(chapter => {
        const status = chapter.status === 'completed' ? '✓' : chapter.status === 'writing' ? '...' : '○'
        summary += `  ${status} ${chapter.title}\n`
      })
    })

    return summary || '（暂无大纲）'
  }

  const buildSystemPrompt = () => {
    return `你是一位专业的小说世界观助手，基于项目的素材库回答用户关于角色、地点、物品设定的问题。
如果发现设定矛盾或逻辑漏洞，请指出。

以下是当前项目的素材库：
${formatMaterialCards()}

当前项目大纲：
${formatOutlineSummary()}

项目名称：${currentProject?.title || '未命名项目'}
项目类型：${currentProject?.genre || '未知'}`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    let accumulated = ''

    try {
      const observable = await streamLLM({
        model: selectedModel,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: input.trim() }
        ],
        temperature: 0.7
      }, 'worldbuilding')

      subscriptionRef.current = observable.subscribe((event: LLMEvent) => {
          if (event.type === 'done') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: accumulated,
              timestamp: new Date()
            }])
            setIsLoading(false)
          } else if (event.type === 'text' && event.content) {
            accumulated += event.content
            setMessages(prev => {
              const last = prev[prev.length - 1]
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content: accumulated }]
              }
              return [...prev, { role: 'assistant', content: accumulated, timestamp: new Date() }]
            })
          } else if (event.type === 'error') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `错误: ${event.content}`,
              timestamp: new Date()
            }])
            setIsLoading(false)
          }
        })
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `错误: ${error.message}`,
        timestamp: new Date()
      }])
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  const handleCancel = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current()
      subscriptionRef.current = null
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 模型选择 */}
      <div className="p-3 border-b border-gray-200">
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <optgroup label="OpenAI">
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </optgroup>
        </select>
      </div>

      {/* 快捷问题 */}
      <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => handleQuickQuestion(q)}
            className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">向 AI 询问关于世界观设定的问题</p>
            <p className="text-xs mt-2">可以问角色信息、地点设定、物品设定等</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-500">AI 思考中...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="询问世界观设定..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              取消
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
