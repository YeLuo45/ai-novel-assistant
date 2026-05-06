import { useEffect, useState } from 'react'
import { db } from '../db'
import { useStore } from '../store'
import BackupPanel from '../components/BackupPanel'
import MilestonePanel from '../components/MilestonePanel'
import { reminderService } from '../services/ReminderService'
import { ThemeToggle } from '../components/ThemeToggle'
import { PROVIDERS, MODELS, getProviderModels } from '../ai/providers'

type SettingsTab = 'api' | 'backup' | 'milestones' | 'reminders' | 'appearance' | 'providers'

export default function Settings() {
  const { currentProject } = useStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('api')
  const [apiKeys, setApiKeys] = useState<{
    openai: string
    anthropic: string
    minimax: string
    google: string
  }>({
    openai: '',
    anthropic: '',
    minimax: '',
    google: ''
  })
  
  // Provider settings state
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [defaultModel, setDefaultModel] = useState<string>('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBackup, setShowBackup] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const { theme } = useStore()
  
  // Reminder settings state
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [reminderDays, setReminderDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0])
  const [autoRemindMilestones, setAutoRemindMilestones] = useState(true)
  const [minWordCount, setMinWordCount] = useState(500)

  useEffect(() => {
    loadKeys()
    loadReminderSettings()
  }, [])

  useEffect(() => {
    if (currentProject) {
      loadReminderSettings()
    }
  }, [currentProject])

  const loadReminderSettings = async () => {
    if (!currentProject || currentProject.id === undefined) return
    const settings = await db.reminderSettings.where('projectId').equals(currentProject.id as number).first()
    if (settings) {
      setReminderEnabled(settings.enabled)
      setReminderTime(settings.dailyReminderTime)
      setReminderDays(settings.reminderDays)
      setAutoRemindMilestones(settings.autoRemindMilestones)
      setMinWordCount(settings.minWordCountForReminder)
    }
  }

  const loadKeys = async () => {
    const keys = await db.apiKeys.toArray()
    const keyMap: any = {}
    keys.forEach(k => { keyMap[k.provider] = k.key })
    setApiKeys({
      openai: keyMap.openai || '',
      anthropic: keyMap.anthropic || '',
      minimax: keyMap.minimax || '',
      google: keyMap.google || ''
    })
    
    // Load provider settings from localStorage
    const savedProvider = localStorage.getItem('ai-novel-default-provider')
    const savedModel = localStorage.getItem('ai-novel-default-model')
    if (savedProvider) setSelectedProvider(savedProvider)
    if (savedModel) setDefaultModel(savedModel)
    
    setLoading(false)
  }

  const handleSave = async () => {
    // 删除旧的
    await db.apiKeys.clear()
    
    // 添加新的
    const providers = ['openai', 'anthropic', 'minimax', 'google'] as const
    for (const provider of providers) {
      if (apiKeys[provider].trim()) {
        await db.apiKeys.add({
          provider,
          key: apiKeys[provider].trim()
        })
      }
    }
    
    // Save provider settings
    localStorage.setItem('ai-novel-default-provider', selectedProvider)
    localStorage.setItem('ai-novel-default-model', defaultModel)
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveReminderSettings = async () => {
    if (!currentProject || currentProject.id === undefined) return
    const pid = currentProject.id as number
    await db.reminderSettings.where('projectId').equals(pid).delete()
    await db.reminderSettings.add({
      projectId: pid,
      enabled: reminderEnabled,
      dailyReminderTime: reminderTime,
      reminderDays,
      autoRemindMilestones,
      minWordCountForReminder: minWordCount,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Restart reminder service with new settings
    reminderService.stop()
    reminderService.start({
      projectId: pid,
      enabled: reminderEnabled,
      dailyReminderTime: reminderTime,
      reminderDays,
      autoRemindMilestones,
      minWordCountForReminder: minWordCount
    })
    
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🎨 外观
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔑 API设置
        </button>
        <button
          onClick={() => { setActiveTab('backup'); setShowBackup(true) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💾 备份与同步
        </button>
        <button
          onClick={() => { setActiveTab('milestones'); setShowMilestone(true) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🏆 里程碑
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'reminders'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⏰ 写作提醒
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'providers'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🤖 AI模型
        </button>
      </div>

      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-6">🎨 外观设置</h2>
          
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                主题模式
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => useStore.getState().setTheme('light')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">☀️</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">浅色</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">适合明亮环境</div>
                </button>
                <button
                  onClick={() => useStore.getState().setTheme('dark')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🌙</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">深色</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">适合夜间写作</div>
                </button>
                <button
                  onClick={() => useStore.getState().setTheme('system')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === 'system'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">💻</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">跟随系统</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">自动适配</div>
                </button>
              </div>
            </div>

            {/* Current Theme Preview */}
            <div className="p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-xl">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">当前效果预览</div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-dark-bg" />
                <div className="w-8 h-8 rounded-lg bg-indigo-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">配色方案</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <>
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

              {/* Google */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google API Key
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  用于Gemini系列模型对话
                </p>
                <input
                  type="password"
                  value={apiKeys.google}
                  onChange={e => setApiKeys({ ...apiKeys, google: e.target.value })}
                  placeholder="AIza..."
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
        </>
      )}

      {activeTab === 'backup' && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-2xl mb-2">💾</div>
          <p>点击上方「备份与同步」按钮打开备份面板</p>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🏆 里程碑管理</h2>
          {showMilestone && currentProject ? (
            <MilestonePanel
              isOpen={showMilestone}
              projectId={currentProject.id ?? 0}
              onClose={() => setShowMilestone(false)}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">点击按钮管理您的写作里程碑</p>
              <button
                onClick={() => setShowMilestone(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                打开里程碑面板
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">⏰ 写作提醒设置</h2>
          
          <div className="space-y-6">
            {/* Enable Reminders */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-800">启用写作提醒</label>
                <p className="text-sm text-gray-500">定时提醒您进行写作练习</p>
              </div>
              <button
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  reminderEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  reminderEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Reminder Time */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">每日提醒时间</label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                disabled={!reminderEnabled}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">提醒日期</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { day: 0, label: '日' },
                  { day: 1, label: '一' },
                  { day: 2, label: '二' },
                  { day: 3, label: '三' },
                  { day: 4, label: '四' },
                  { day: 5, label: '五' },
                  { day: 6, label: '六' },
                ].map(({ day, label }) => (
                  <button
                    key={day}
                    onClick={() => {
                      if (reminderDays.includes(day)) {
                        setReminderDays(reminderDays.filter(d => d !== day))
                      } else {
                        setReminderDays([...reminderDays, day])
                      }
                    }}
                    disabled={!reminderEnabled}
                    className={`w-10 h-10 rounded-full font-medium transition-colors ${
                      reminderDays.includes(day)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Remind Milestones */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-800">里程碑自动提醒</label>
                <p className="text-sm text-gray-500">当接近里程碑目标时自动提醒</p>
              </div>
              <button
                onClick={() => setAutoRemindMilestones(!autoRemindMilestones)}
                disabled={!reminderEnabled}
                className={`w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  autoRemindMilestones ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  autoRemindMilestones ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Min Word Count */}
            <div>
              <label className="block font-medium text-gray-800 mb-2">
                最低字数要求 ({minWordCount} 字)
              </label>
              <p className="text-xs text-gray-500 mb-2">当天写作达到此字数才不提醒</p>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={minWordCount}
                onChange={e => setMinWordCount(Number(e.target.value))}
                disabled={!reminderEnabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100字</span>
                <span>5000字</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-4">
              {saved && (
                <span className="text-sm text-green-600">已保存 ✓</span>
              )}
              <button
                onClick={handleSaveReminderSettings}
                disabled={!reminderEnabled || !currentProject}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                保存提醒设置
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'providers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🤖 AI模型设置</h2>

          {/* Default Provider Selection */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-800 mb-4">默认AI提供商</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(PROVIDERS).map(([id, provider]) => {
                const models = getProviderModels(id)
                const hasApiKey = apiKeys[id as keyof typeof apiKeys]?.trim()
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedProvider(id)
                      if (models.length > 0) {
                        setDefaultModel(provider.defaultModel || models[0].id)
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedProvider === id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{provider.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {models.length} 个模型
                    </div>
                    <div className={`text-xs mt-1 ${
                      hasApiKey ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {hasApiKey ? '✓ 已配置API Key' : '✗ 未配置API Key'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Default Model Selection */}
          {selectedProvider && (
            <div className="mb-8">
              <h3 className="font-medium text-gray-800 mb-4">默认模型</h3>
              <div className="space-y-2">
                {getProviderModels(selectedProvider).map(model => (
                  <label
                    key={model.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      defaultModel === model.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultModel"
                      checked={defaultModel === model.id}
                      onChange={() => setDefaultModel(model.id)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{model.name}</div>
                      <div className="text-xs text-gray-500">
                        上下文窗口: {model.contextWindow?.toLocaleString() || 'N/A'} tokens
                        | 最大输出: {model.maxOutputTokens?.toLocaleString() || 'N/A'} tokens
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {model.capabilities.vision && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">视觉</span>
                      )}
                      {model.thinking?.supported && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">思考</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Provider Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-800 mb-3">模型说明</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="font-medium text-indigo-600 w-24">Claude 3.5</span>
                <span>擅长长文本创作和角色一致性分析</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-indigo-600 w-24">GPT-4</span>
                <span>综合能力强，适合复杂的小说结构设计</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-indigo-600 w-24">Gemini</span>
                <span>Google大模型，上下文窗口大，适合超长文本处理</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-indigo-600 w-24">DeepSeek</span>
                <span>国产高性能模型，性价比高</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <p className="text-xs text-gray-400">
              切换AI提供商后，直接生效无需刷新页面
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
      )}

      {/* Backup Panel Modal */}
      <BackupPanel 
        isOpen={showBackup} 
        onClose={() => setShowBackup(false)} 
      />

      {/* Milestone Panel Modal */}
      {showMilestone && currentProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <MilestonePanel
              isOpen={showMilestone}
              projectId={currentProject.id ?? 0}
              onClose={() => setShowMilestone(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
