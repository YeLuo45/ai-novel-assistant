import { useState, useRef, useEffect } from 'react'
import { AgentConfig } from '../db'
import { db } from '../db'

interface Props {
  agentConfigs: AgentConfig[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChat({ agentConfigs: _agentConfigs }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ openai?: string; anthropic?: string; minimax?: string }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    const keys = await db.apiKeys.toArray()
    const keyMap: any = {}
    keys.forEach(k => { keyMap[k.provider] = k.key })
    setApiKeys(keyMap)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const apiKey = selectedModel.startsWith('gpt') ? apiKeys.openai : 
                     selectedModel.startsWith('claude') ? apiKeys.anthropic : apiKeys.minimax
      
      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '请先在设置页面配置API Key',
          timestamp: new Date()
        }])
        setIsLoading(false)
        return
      }

      // 构建提示词
      const systemPrompt = `你是一位专业的小说创作助手，帮助作者进行小说大纲规划、情节设计、角色塑造等工作。`
      
      let response: string
      if (selectedModel.startsWith('gpt')) {
        response = await callOpenAI(apiKey, selectedModel, systemPrompt, input.trim())
      } else if (selectedModel.startsWith('claude')) {
        response = await callClaude(apiKey, selectedModel, systemPrompt, input.trim())
      } else {
        response = await callMiniMax(apiKey, input.trim())
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `错误: ${error.message}`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const callOpenAI = async (apiKey: string, model: string, system: string, userInput: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'API请求失败')
    }
    
    const data = await response.json()
    return data.choices[0].message.content
  }

  const callClaude = async (apiKey: string, model: string, system: string, userInput: string): Promise<string> => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userInput }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'API请求失败')
    }

    const data = await response.json()
    return data.content[0].text
  }

  const callMiniMax = async (apiKey: string, userInput: string): Promise<string> => {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'abab5.5-chat',
        messages: [{ role: 'user', content: userInput }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'API请求失败')
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">开始和AI对话吧！</p>
            <p className="text-xs mt-2">可以询问大纲建议、情节发展、角色设定等</p>
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
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
