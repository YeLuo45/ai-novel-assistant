import type { Workflow } from './types'

export const BUILT_IN_WORKFLOWS: Workflow[] = [
  {
    id: 'quick_write',
    name: '快速写作',
    description: '单Agent快速生成初稿',
    isBuiltIn: true,
    steps: [
      { id: 's1', name: '生成初稿', agentId: 'plot_expert', prompt: '{input}', input: 'original' }
    ]
  },
  {
    id: 'standard',
    name: '标准协作',
    description: '4Agent标准协作流程',
    isBuiltIn: true,
    steps: [
      { id: 's1', name: '情节设计', agentId: 'plot_expert', prompt: '{input}', input: 'original' },
      { id: 's2', name: '对话生成', agentId: 'dialogue_master', prompt: '{previous}', input: 'previous' },
      { id: 's3', name: '文风检查', agentId: 'style_guard', prompt: '{previous}', input: 'previous' },
      { id: 's4', name: '批评反馈', agentId: 'critic_agent', prompt: '{previous}', input: 'previous' }
    ]
  },
  {
    id: 'revision',
    name: '精修模式',
    description: '生成后精修迭代',
    isBuiltIn: true,
    steps: [
      { id: 's1', name: '生成初稿', agentId: 'plot_expert', prompt: '{input}', input: 'original' },
      { id: 's2', name: '精修', agentId: 'plot_expert', prompt: '请精修以下内容：{previous}', input: 'previous' }
    ]
  }
]
