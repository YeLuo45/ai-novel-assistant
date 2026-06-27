/**
 * collab/v3/demo/studio-integration-demo.ts (H26)
 * 端到端 demo：5 agent 工作室（使用 V3 Studio + 各种 panels）
 */

import { StudioStore, INITIAL_STUDIO_STATE, type StudioAgent } from '../../../ai/agent-runtime/protocol/StudioState'
import {
  SoulMarketplace, SoulTemplateRegistry, SoulAuthor,
  type SoulTemplate,
} from '../../../ai/agent-runtime/protocol/SoulMarketplace'
import { PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE, DIALOGUE_MASTER_TEMPLATE, CRITIC_MASTER_TEMPLATE, CONTINUITY_GUARD_TEMPLATE } from '../../../ai/agent-runtime/builtinSouls'
import { createSoul, createUserBinding, createMemoryScope } from '../../../ai/agent-runtime'
import { ExperimentRunner, type Variant } from '../../../ai/agent-runtime/protocol/ABTesting'
import { HealthCheckRunner, AlertManager } from '../../../ai/agent-runtime/protocol/AdaptationAndHealth'
import { AgentHookEmitter } from '../../../ai/agent-runtime/AgentHookEmitter'

export interface DemoResult {
  storeVersion: number
  agentCount: number
  connectionCount: number
  marketplaceListings: number
  installedCount: number
  experimentVariantCount: number
  healthCheckCount: number
  alertRuleCount: number
  hookEventCount: number
}

export async function runStudioIntegrationDemo(): Promise<DemoResult> {
  // 1. Studio store
  const store = new StudioStore()
  const templates = [PLOT_ADVISOR_TEMPLATE, STYLE_COACH_TEMPLATE, DIALOGUE_MASTER_TEMPLATE, CRITIC_MASTER_TEMPLATE, CONTINUITY_GUARD_TEMPLATE]
  templates.forEach((tpl, i) => {
    const agent: StudioAgent = {
      id: `a${i}`,
      soul: createSoul({
        agentId: `a${i}`,
        archetype: tpl.archetype,
        displayName: tpl.displayName,
        capabilities: tpl.baseCapabilities,
        persona: tpl.basePersona,
        decisionPolicy: tpl.basePersona.decisionPolicy,
      }),
      binding: createUserBinding({ agentId: `a${i}` }),
      memoryScope: createMemoryScope({ agentId: `a${i}` }),
      position: { x: i * 200, y: 0 },
      selected: false,
    }
    store.dispatch({ type: 'agent.add', agent })
  })
  // 2. 5 connections (line topology)
  for (let i = 0; i < templates.length - 1; i++) {
    store.dispatch({ type: 'connection.add', connection: { from: `a${i}`, to: `a${i + 1}`, type: i === 0 ? 'message' : i === 1 ? 'memory' : i === 2 ? 'delegation' : 'message' } })
  }

  // 3. Marketplace
  const marketplace = new SoulMarketplace(new SoulTemplateRegistry())
  const author: SoulAuthor = { authorId: 'demo', displayName: 'Demo' }
  templates.forEach(tpl => marketplace.publish(tpl, author, { description: tpl.description, tags: tpl.baseCapabilities }))
  marketplace.install(PLOT_ADVISOR_TEMPLATE.templateId)
  marketplace.install(STYLE_COACH_TEMPLATE.templateId)

  // 4. Experiment
  const variant1: Variant = { variantId: 'control', name: 'Control', weight: 50, payload: {} }
  const variant2: Variant = { variantId: 'experimental', name: 'Experimental', weight: 50, payload: {} }
  const runner = new ExperimentRunner({
    experimentId: 'demo',
    name: 'Demo Experiment',
    description: 'Studio integration demo',
    variants: [variant1, variant2],
    startTime: 0,
    status: 'running',
    significanceLevel: 0.05,
    minSampleSize: 100,
  })

  // 5. Health check + alert
  const health = new HealthCheckRunner()
  health.register({ name: 'memory', check: () => ({ name: 'memory', status: 'healthy' as const, durationMs: 1, checkedAt: 0 }) })
  const alerts = new AlertManager()
  alerts.addRule({ ruleId: 'high-errors', name: 'High errors', condition: (m: unknown) => ((m as { errors: number }).errors ?? 0) > 100, severity: 'critical', cooldownMs: 0, message: 'too many errors' })

  // 6. Hook emitter
  const emitter = new AgentHookEmitter()
  let hookEventCount = 0
  emitter.subscribe('agent.spawn.after' as any, () => { hookEventCount += 1 })
  await emitter.emit('agent.spawn.after' as any, {
    agentId: 'a0', archetype: 'critic', displayName: 'A0', timestamp: Date.now(),
  })

  return {
    storeVersion: store.getState().version,
    agentCount: store.getState().agents.length,
    connectionCount: store.getState().connections.length,
    marketplaceListings: marketplace.list().length,
    installedCount: marketplace.installed().length,
    experimentVariantCount: runner.results().length,
    healthCheckCount: health.count(),
    alertRuleCount: 1,
    hookEventCount,
  }
}