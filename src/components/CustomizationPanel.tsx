import { useState, useEffect } from 'react'
import { customizationManager } from '@/ai/customization/CustomizationManager'
import type { AgentConfig, StyleTemplate, Workflow, Language } from '@/ai/customization/types'
import { BUILT_IN_TEMPLATES } from '@/ai/customization/agentTemplates'
import { t } from '@/ai/customization/i18n'

type TabType = 'agent' | 'style' | 'workflow' | 'language'

interface AgentEditModalProps {
  agent: AgentConfig | null
  isOpen: boolean
  onClose: () => void
  onSave: (config: AgentConfig) => void
  onDelete?: (id: string) => void
}

function AgentEditModal({ agent, isOpen, onClose, onSave, onDelete }: AgentEditModalProps) {
  const [formData, setFormData] = useState<AgentConfig | null>(null)

  useEffect(() => {
    if (agent) {
      setFormData({ ...agent })
    }
  }, [agent])

  if (!isOpen || !formData) return null

  const isBuiltIn = BUILT_IN_TEMPLATES.some(t => t.id === formData.id)

  const handleSave = () => {
    if (formData) {
      onSave(formData)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">编辑 Agent - {formData.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
            <textarea
              value={formData.systemPrompt}
              onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature ({formData.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500">0=确定, 1=创意</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens ({formData.maxTokens})</label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={e => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 1000 })}
                min={100}
                max={8000}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输出格式</label>
            <select
              value={formData.outputFormat}
              onChange={e => setFormData({ ...formData, outputFormat: e.target.value as AgentConfig['outputFormat'] })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="plain">纯文本</option>
              <option value="structured">结构化</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">能力标签</label>
            <div className="flex flex-wrap gap-2">
              {formData.capabilities.map(cap => (
                <span key={cap} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between">
          <div>
            {!isBuiltIn && onDelete && (
              <button
                onClick={() => {
                  if (confirm('确定要删除这个 Agent 吗？')) {
                    onDelete(formData.id)
                    onClose()
                  }
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CustomizationPanelProps {
  onAgentChange?: (agentId: string) => void
  onStyleChange?: (styleId: string) => void
  onWorkflowChange?: (workflowId: string) => void
  onLanguageChange?: (language: Language) => void
}

export function CustomizationPanel({
  onAgentChange,
  onStyleChange,
  onWorkflowChange,
  onLanguageChange
}: CustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('agent')
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [styles, setStyles] = useState<StyleTemplate[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [currentLanguage, setCurrentLanguage] = useState<Language>('zh-CN')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selectedStyleId, setSelectedStyleId] = useState<string>('realistic')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('standard')
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null)
  const [showAgentModal, setShowAgentModal] = useState(false)

  // Load data on mount
  useEffect(() => {
    const loadedAgents = customizationManager.getAgentConfigs()
    const loadedStyles = customizationManager.getStyleTemplates()
    const loadedWorkflows = customizationManager.getWorkflows()
    const loadedLanguage = customizationManager.getCurrentLanguage()
    const currentAgent = customizationManager.getCurrentAgent()
    const currentStyle = customizationManager.getCurrentStyle()
    const currentWorkflow = customizationManager.getCurrentWorkflow()

    setAgents(loadedAgents)
    setStyles(loadedStyles)
    setWorkflows(loadedWorkflows)
    setCurrentLanguage(loadedLanguage)
    setSelectedAgentId(currentAgent)
    setSelectedStyleId(currentStyle)
    setSelectedWorkflowId(currentWorkflow)
  }, [])

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId)
    customizationManager.setCurrentAgent(agentId)
    onAgentChange?.(agentId)
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyleId(styleId)
    customizationManager.setCurrentStyle(styleId)
    onStyleChange?.(styleId)
  }

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId)
    customizationManager.setCurrentWorkflow(workflowId)
    onWorkflowChange?.(workflowId)
  }

  const handleLanguageSelect = (lang: Language) => {
    setCurrentLanguage(lang)
    customizationManager.setCurrentLanguage(lang)
    onLanguageChange?.(lang)
  }

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent)
    setShowAgentModal(true)
  }

  const handleSaveAgent = (config: AgentConfig) => {
    customizationManager.saveAgentConfig(config)
    setAgents(customizationManager.getAgentConfigs())
  }

  const handleDeleteAgent = (id: string) => {
    customizationManager.deleteAgentConfig(id)
    setAgents(customizationManager.getAgentConfigs())
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'agent', label: 'Agent' },
    { id: 'style', label: t('ui.style', currentLanguage) },
    { id: 'workflow', label: t('ui.workflow', currentLanguage) },
    { id: 'language', label: t('ui.language', currentLanguage) }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Agent Tab */}
        {activeTab === 'agent' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">选择一个 Agent 用于写作协作</p>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentSelect(agent.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAgentId === agent.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {BUILT_IN_TEMPLATES.some(t => t.id === agent.id) && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">内置</span>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleEditAgent(agent)
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded"
                      title="编辑"
                    >
                      ✎
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Style Tab */}
        {activeTab === 'style' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">选择写作风格</p>
            {styles.map(style => (
              <div
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStyleId === style.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{style.name}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </div>
                  {selectedStyleId === style.id && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    句长: {style.features.sentenceLength}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    对话: {style.features.dialogueRatio}%
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    情感: {style.features.emotionalIntensity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">选择工作流程</p>
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                onClick={() => handleWorkflowSelect(workflow.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedWorkflowId === workflow.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{workflow.name}</div>
                    <div className="text-sm text-gray-500">{workflow.description}</div>
                  </div>
                  {selectedWorkflowId === workflow.id && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {workflow.steps.map(step => (
                    <span key={step.id} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      {step.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Language Tab */}
        {activeTab === 'language' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">选择界面语言</p>
            {(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'] as Language[]).map(lang => (
              <div
                key={lang}
                onClick={() => handleLanguageSelect(lang)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentLanguage === lang
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {lang === 'zh-CN' && '简体中文'}
                      {lang === 'en-US' && 'English'}
                      {lang === 'ja-JP' && '日本語'}
                      {lang === 'ko-KR' && '한국어'}
                    </div>
                  </div>
                  {currentLanguage === lang && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Edit Modal */}
      <AgentEditModal
        agent={editingAgent}
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onSave={handleSaveAgent}
        onDelete={handleDeleteAgent}
      />
    </div>
  )
}
