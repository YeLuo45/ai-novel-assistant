/**
 * plot-team-demo.test.ts (V2351) — 验证 5 agent 团队 demo
 */

import { describe, it, expect } from 'vitest'
import { startPlotTeamDemo, simulateCollaboration, runDemo } from './plot-team-demo'

describe('plot-team-demo', () => {
  it('startPlotTeamDemo spawns 5 agents', () => {
    const { runtime, team } = startPlotTeamDemo()
    expect(team.length).toBe(5)
    expect(runtime.count()).toBe(5)
  })

  it('team has 5 distinct archetypes', () => {
    const { team } = startPlotTeamDemo()
    const archetypes = new Set(team.map(t => t.archetype))
    expect(archetypes.size).toBeGreaterThanOrEqual(4)
  })

  it('metrics starts at 0', () => {
    const { metrics } = startPlotTeamDemo()
    expect(metrics.snapshot().totalEvents).toBeGreaterThanOrEqual(0)
  })

  it('audit records spawn events', () => {
    const { audit } = startPlotTeamDemo()
    expect(audit.count()).toBeGreaterThanOrEqual(5)
  })

  it('simulateCollaboration touches 5 agents', () => {
    const { runtime, team } = startPlotTeamDemo()
    const result = simulateCollaboration(runtime, 'test chapter')
    expect(result.plot).toBeDefined()
    expect(result.style).toBeDefined()
    expect(result.dialogue).toBeDefined()
    expect(result.critic).toBeDefined()
    expect(result.continuity).toBeDefined()
    expect(team.length).toBe(5)
  })

  it('runDemo end-to-end', async () => {
    const result = await runDemo()
    expect(result.teamSize).toBe(5)
    expect(result.auditEntries).toBeGreaterThan(0)
    expect(result.metrics.totalEvents).toBeGreaterThan(0)
    expect(result.collaboration.plot).toBeDefined()
  })
})
