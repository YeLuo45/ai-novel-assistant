import { useState, useRef, useEffect } from 'react'
import { AgentConfig, ChatMessage } from '../db'
import { db } from '../db'
import { getChatHistory, addUserMessage, addAssistantMessage, buildContextualPrompt, trimChatHistory } from '../ai/chatMemory'
import { streamLLM } from '../ai/llm'
import { PROVIDERS, MODELS, getProviderModels } from '../ai/providers'
import type { LLMEvent } from '../ai/types'

interface Props {
  agentConfigs: AgentConfig[]
  projectId?: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChat({ agentConfigs: _agentConfigs, projectId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini')
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ openai?: string; anthropic?: string; minimax?: string; google?: string }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<(() => void) | null>(null)

  // 加载 API keys and provider settings
  useEffect(() => {
    loadApiKeys()
    loadProviderSettings()
  }, [])

  // 加载聊天历史
  useEffect(() => {
    if (projectId) {
      loadChatHistory()
    }
  }, [projectId])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadApiKeys = async () => {
    const keys = await db.apiKeys.toArray()
    const keyMap: any = {}
    keys.forEach(k => { keyMap[k.provider] = k.key })
    setApiKeys(keyMap)
  }

  const loadChatHistory = async () => {
    if (!projectId) return
    try {
      const history = await getChatHistory(projectId)
      const msgs: Message[] = history.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
      setMessages(msgs)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const loadProviderSettings = () => {
    const savedProvider = localStorage.getItem('ai-novel-default-provider') || 'openai'
    const savedModel = localStorage.getItem('ai-novel-default-model') || 'gpt-4o-mini'
    const savedUseCustom = localStorage.getItem('ai-novel-use-custom-model') === 'true'
    const savedCustomModel = localStorage.getItem('ai-novel-custom-model') || ''
    setSelectedProvider(savedProvider)
    // Use custom model if enabled, otherwise use predefined model
    setSelectedModel(savedUseCustom && savedCustomModel ? savedCustomModel : savedModel)
  }

  const getApiKey = (provider: string): string | undefined => {
    return apiKeys[provider as keyof typeof apiKeys]
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !projectId) return

    const userContent = input.trim()
    
    // 添加用户消息到UI
    const userMessage: Message = { role: 'user', content: userContent, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 保存用户消息到数据库
    await addUserMessage(projectId, userContent)

    const apiKey = getApiKey(selectedProvider)
    if (!apiKey) {
      const errorMsg = '请先在设置页面配置API Key'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }])
      await addAssistantMessage(projectId, errorMsg)
      setIsLoading(false)
      return
    }

    // Set API key on provider
    const provider = PROVIDERS[selectedProvider]
    if (provider) {
      provider.apiKey = apiKey
    }

    try {
      // 获取对话历史用于上下文
      const history = await getChatHistory(projectId)
      const historyForLLM: ChatMessage[] = history.slice(0, -1) // 不包含刚添加的用户消息

      // 获取项目信息
      const project = await db.projects.get(projectId)
      const chapterCount = await db.outlineNodes
        .where('projectId')
        .equals(projectId)
        .filter(n => n.status === 'completed')
        .count()

      // 构建带上下文的 prompt
      const { messages: contextualMessages } = buildContextualPrompt(
        { title: project?.title || '', genre: project?.genre || '', chapterCount },
        historyForLLM,
        userContent
      )

      let accumulated = ''

      // 使用流式 API
      const observable = streamLLM({
        model: selectedModel,
        messages: contextualMessages,
        temperature: 0.7
      }, 'ai-chat')

      subscriptionRef.current = () => observable.unsubscribe()

      observable.subscribe((event: LLMEvent) => {
        if (event.type === 'done') {
          // 保存助手消息到数据库
          addAssistantMessage(projectId, accumulated)
          // 清理旧消息
          trimChatHistory(projectId)
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
          const errorMsg = `错误: ${event.content}`
          setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }])
          addAssistantMessage(projectId, errorMsg)
          setIsLoading(false)
        }
      })
    } catch (error: any) {
      const errorMsg = `错误: ${error.message}`
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }])
      await addAssistantMessage(projectId, errorMsg)
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCancel = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current()
      subscriptionRef.current = null
    }
    setIsLoading(false)
  }

  const clearChat = async () => {
    if (!projectId) return
    if (confirm('确定要清空对话历史吗？')) {
      const { clearChatHistory } = await import('../ai/chatMemory')
      await clearChatHistory(projectId)
      setMessages([])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Provider and Model Selection */}
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <select
          value={selectedProvider}
          onChange={e => {
            const newProvider = e.target.value
            setSelectedProvider(newProvider)
            const models = getProviderModels(newProvider)
            if (models.length > 0) {
              const provider = PROVIDERS[newProvider]
              setSelectedModel(provider?.defaultModel || models[0].id)
            }
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Object.entries(PROVIDERS).map(([id, provider]) => (
            <option key={id} value={id}>{provider.name}</option>
          ))}
        </select>
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {getProviderModels(selectedProvider).map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
        {projectId && messages.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-2 px-2 py-1 text-xs text-gray-400 hover:text-red-500"
            title="清空对话历史"
          >
            🗑️
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">开始和AI对话吧！</p>
            <p className="text-xs mt-2">可以询问大纲建议、情节发展、角色设定等</p>
            {projectId && (
              <p className="text-xs mt-1 text-indigo-400">AI会记住对话上下文</p>
            )}
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
              <p className="text-sm text-gray-500">思考中...</p>
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
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter发送，Shift+Enter换行)"
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
        <p className="text-xs text-gray-400 mt-1">
          {projectId ? `对话历史将保存在当前项目（最多10轮）` : '切换到项目后可保留对话历史'}
        </p>
      </div>
    </div>
  )
}
