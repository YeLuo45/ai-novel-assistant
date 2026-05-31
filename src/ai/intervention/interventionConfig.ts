import type { PauseCondition } from './types'

export const DEFAULT_PAUSE_CONDITIONS: PauseCondition[] = [
  {
    id: 'every_other_agent',
    name: '每个Agent输出后',
    description: '每个Agent完成后暂停，让用户审核',
    trigger: 'agent_complete',
    params: { afterCount: 1 }
  },
  {
    id: 'long_output',
    name: '输出过长时',
    description: '当Agent输出超过2000字时暂停',
    trigger: 'agent_complete',
    params: { ifContentLengthOver: 2000 }
  },
  {
    id: 'critical_issues',
    name: '检测到严重问题时',
    description: '当检测到严重问题时暂停',
    trigger: 'threshold',
    params: { ifSeverityOver: 'critical' }
  }
]

export const DEFAULT_INTERVENTION_OPTIONS = [
  { id: 'approve', name: '确认', shortcut: 'Enter' },
  { id: 'reject', name: '拒绝', shortcut: 'Esc' },
  { id: 'modify', name: '修改', shortcut: 'M' },
  { id: 'rerun', name: '重跑', shortcut: 'R' },
  { id: 'skip', name: '跳过', shortcut: 'S' }
]

export const DEFAULT_INTERVENTION_CONFIG = {
  pauseConditions: DEFAULT_PAUSE_CONDITIONS,
  interventionOptions: DEFAULT_INTERVENTION_OPTIONS,
  autoResume: false,
  autoResumeTimeout: 30
}