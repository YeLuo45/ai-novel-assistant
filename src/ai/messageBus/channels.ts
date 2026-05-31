/**
 * V36 MessageBus - Channel 常量定义
 * 定义 Agent 协作中使用的所有事件通道
 */

// Agent 执行阶段
export const CHANNEL = {
  // Agent 生命周期事件
  AGENT_START: 'agent.start',
  AGENT_COMPLETE: 'agent.complete',
  AGENT_ERROR: 'agent.error',
  AGENT_PROGRESS: 'agent.progress',

  // PlotExpert 专属通道
  PLOT_EXPERT_START: 'plotExpert.start',
  PLOT_EXPERT_COMPLETE: 'plotExpert.complete',
  PLOT_EXPERT_OUTPUT: 'plotExpert.output',

  // DialogueMaster 专属通道
  DIALOGUE_MASTER_START: 'dialogueMaster.start',
  DIALOGUE_MASTER_COMPLETE: 'dialogueMaster.complete',
  DIALOGUE_MASTER_OUTPUT: 'dialogueMaster.output',

  // StyleGuard 专属通道
  STYLE_GUARD_START: 'styleGuard.start',
  STYLE_GUARD_COMPLETE: 'styleGuard.complete',
  STYLE_GUARD_OUTPUT: 'styleGuard.output',

  // CriticAgent 专属通道
  CRITIC_AGENT_START: 'criticAgent.start',
  CRITIC_AGENT_COMPLETE: 'criticAgent.complete',
  CRITIC_AGENT_OUTPUT: 'criticAgent.output',

  // 编排器事件
  ORCHESTRATOR_START: 'orchestrator.start',
  ORCHESTRATOR_TASK_READY: 'orchestrator.taskReady',
  ORCHESTRATOR_TASK_COMPLETE: 'orchestrator.taskComplete',
  ORCHESTRATOR_PROGRESS: 'orchestrator.progress',
  ORCHESTRATOR_COMPLETE: 'orchestrator.complete',
  ORCHESTRATOR_ERROR: 'orchestrator.error',
  ORCHESTRATOR_INTERVENTION: 'orchestrator.intervention',

  // 协作事件
  COLLABORATION_START: 'collaboration.start',
  COLLABORATION_SYNC: 'collaboration.sync',
  COLLABORATION_RESULT: 'collaboration.result',

  // 一致性检查事件
  CONSISTENCY_CHECK: 'consistency.check',
  CONSISTENCY_RESULT: 'consistency.result',

  // 记忆事件
  MEMORY_LOAD: 'memory.load',
  MEMORY_SAVE: 'memory.save',

  // 干预事件
  INTERVENTION_TRIGGER: 'intervention.trigger',
  INTERVENTION_RESUME: 'intervention.resume',
} as const

export type ChannelName = typeof CHANNEL[keyof typeof CHANNEL]