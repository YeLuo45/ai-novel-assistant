/**
 * plot-team-demo.ts (V2351)
 *
 * 完整 5 agent 团队 demo：Plot + Style + Dialogue + Critic + Continuity
 * 展示：spawn → tick → 协作 → 审计
 */

import {
  ManagedAgentRuntime,
  PLOT_ADVISOR_TEMPLATE,
  STYLE_COACH_TEMPLATE,
  DIALOGUE_MASTER_TEMPLATE,
  CRITIC_MASTER_TEMPLATE,
  CONTINUITY_GUARD_TEMPLATE,
  AgentHookEmitter,
  MetricsHook,
  AuditLogHook,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
  makePayload,
  type AgentHookEvent,
} from '../index'

/** 启动完整 5 agent 团队 */
export function startPlotTeamDemo(): {
  runtime: ManagedAgentRuntime
  metrics: MetricsHook
  audit: AuditLogHook
  team: ReturnType<ManagedAgentRuntime['list']>
} {
  // 1. 创建 runtime + hooks
  const runtime = new ManagedAgentRuntime({
    sandbox: 'default',
    lifecycle: { idleTimeoutMs: 60_000, hibernateAfterMs: 600_000 },
  })

  // 2. attach 内置 hooks
  const emitter = new AgentHookEmitter()
  const metrics = new MetricsHook()
  const audit = new AuditLogHook(500)
  metrics.attach(emitter)
  audit.attach(emitter)

  // 3. spawn 5 个 agent
  const teamIds = createBuiltinTeamIds()
  const team = teamIds.map((id: string, i: number) =>
    runtime.spawn({
      template: builtinTemplateByIndex(i),
      agentId: id,
      userBinding: { visibleUserFields: ['penName', 'voiceProfile'] },
      initialStatus: 'active',
    }),
  )

  // 4. 发射 spawn 事件（demo 演示）
  for (const a of team) {
    emitter.emitSync('agent.spawn.after', makePayload('agent.spawn.after', a.soul.agentId, {
      archetype: a.soul.archetype,
      displayName: a.soul.persona.displayName,
    }))
  }

  return { runtime, metrics, audit, team: runtime.list() }
}

/** 模拟一轮协作：plot → style → dialogue → critic → continuity */
export function simulateCollaboration(rt: ManagedAgentRuntime, chapter: string): {
  plot: string
  style: string
  dialogue: string
  critic: string
  continuity: string
} {
  // 简化：每步用一个 hook event 模拟
  const events: Array<[AgentHookEvent, string]> = [
    ['agent.execute.before', 'plot-1'],
    ['agent.execute.after', 'plot-1'],
    ['agent.execute.before', 'style-1'],
    ['agent.execute.after', 'style-1'],
    ['agent.execute.before', 'dialogue-1'],
    ['agent.execute.after', 'dialogue-1'],
    ['agent.execute.before', 'critic-1'],
    ['agent.execute.after', 'critic-1'],
    ['agent.execute.before', 'continuity-1'],
    ['agent.execute.after', 'continuity-1'],
  ]
  // 模拟执行（无实际操作，只为 demo）
  for (const [ev, agentId] of events) {
    rt.touch(agentId)
  }

  return {
    plot: `Plot review for: ${chapter.slice(0, 30)}...`,
    style: `Style suggestions: shorter sentences`,
    dialogue: `Dialogue review: 3 lines found`,
    critic: `Critic score: 8/10`,
    continuity: `Continuity check: passed`,
  }
}

/** 完整 demo 入口 */
export async function runDemo(): Promise<{
  teamSize: number
  metrics: ReturnType<MetricsHook['snapshot']>
  auditEntries: number
  collaboration: Awaited<ReturnType<typeof simulateCollaboration>>
}> {
  const { runtime, metrics, audit, team } = startPlotTeamDemo()
  const collab = simulateCollaboration(runtime, 'Chapter 1: The boy walked into the forest...')
  await new Promise(r => setTimeout(r, 10))
  return {
    teamSize: team.length,
    metrics: metrics.snapshot(),
    auditEntries: audit.count(),
    collaboration: collab,
  }
}
