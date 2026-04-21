import { useEffect, useState } from 'react'
import { db } from '../db'

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<{
    openai: string
    anthropic: string
    minimax: string
  }>({
    openai: '',
    anthropic: '',
    minimax: ''
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    const keys = await db.apiKeys.toArray()
    const keyMap: any = {}
    keys.forEach(k => { keyMap[k.provider] = k.key })
    setApiKeys({
      openai: keyMap.openai || '',
      anthropic: keyMap.anthropic || '',
      minimax: keyMap.minimax || ''
    })
    setLoading(false)
  }

  const handleSave = async () => {
    // 删除旧的
    await db.apiKeys.clear()
    
    // 添加新的
    const providers = ['openai', 'anthropic', 'minimax'] as const
    for (const provider of providers) {
      if (apiKeys[provider].trim()) {
        await db.apiKeys.add({
          provider,
          key: apiKeys[provider].trim()
        })
      }
    }
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">API设置</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* OpenAI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              用于GPT-4/GPT-3.5-Turbo模型对话
            </p>
            <input
              type="password"
              value={apiKeys.openai}
              onChange={e => setApiKeys({ ...apiKeys, openai: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Anthropic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anthropic API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              用于Claude-3系列模型对话
            </p>
            <input
              type="password"
              value={apiKeys.anthropic}
              onChange={e => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* MiniMax */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MiniMax API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              用于MiniMax模型对话
            </p>
            <input
              type="password"
              value={apiKeys.minimax}
              onChange={e => setApiKeys({ ...apiKeys, minimax: e.target.value })}
              placeholder="..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <p className="text-xs text-gray-400">
            API密钥仅保存在本地浏览器中
          </p>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="text-sm text-green-600">已保存 ✓</span>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>

      {/* 模型说明 */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-medium text-gray-800 mb-4">支持的模型</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="font-medium text-indigo-600 w-24">GPT-4</span>
            <span className="text-gray-600">最强大的模型，适合复杂的小说结构设计</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-indigo-600 w-24">GPT-3.5</span>
            <span className="text-gray-600">速度快，成本低，适合日常对话</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-indigo-600 w-24">Claude 3</span>
            <span className="text-gray-600">擅长长文本创作和角色一致性</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-medium text-indigo-600 w-24">MiniMax</span>
            <span className="text-gray-600">国产模型，中文支持好</span>
          </div>
        </div>
      </div>
    </div>
  )
}
