/**
 * protocol/demo/memory-sharing-demo.ts (V2411)
 *
 * 5 agent memory 三层隔离 demo：
 * - 私有：每个 agent 自己的 L0/L1/L2
 * - 团队共享：L4 (teamKB) 通过 lease 临时共享
 * - 公开：L3 (projectKB) 通过 auction 申请+批准
 */

import {
  ManagedAgentRuntime,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
} from '../../index'
import { AgentMessageBus } from '../AgentMessageBus'
import { AgentMemoryStore, type MemoryEntry } from '../MemoryStore'
import { MemoryScopeGuard, MemoryLeaseManager } from '../MemoryGuard'
import { MemoryAuction, MemoryEventLog, MemoryReplayEngine } from '../MemoryReplayAndAuction'

/** 启动 5 agent memory 隔离 demo */
export function startMemorySharingDemo(): {
  runtime: ManagedAgentRuntime
  bus: AgentMessageBus
  stores: Map<string, AgentMemoryStore>
  guards: Map<string, MemoryScopeGuard>
  leases: MemoryLeaseManager
  auctions: MemoryAuction
  events: MemoryEventLog
} {
  const runtime = new ManagedAgentRuntime()
  const bus = new AgentMessageBus()
  const stores = new Map<string, AgentMemoryStore>()
  const guards = new Map<string, MemoryScopeGuard>()
  const leases = new MemoryLeaseManager()
  const auctions = new MemoryAuction()
  const events = new MemoryEventLog()

  const teamIds = createBuiltinTeamIds()
  for (const id of teamIds) {
    runtime.spawn({ template: builtinTemplateByIndex(teamIds.indexOf(id)), agentId: id })
    stores.set(id, new AgentMemoryStore())
    guards.set(id, new MemoryScopeGuard({ readScope: 'team', writeScope: 'self' }))
  }
  return { runtime, bus, stores, guards, leases, auctions, events }
}

/** 模拟：plot advisor 写私有 + 申请共享给 style coach */
export function simulateMemorySharing(
  rt: ManagedAgentRuntime,
  stores: Map<string, AgentMemoryStore>,
  guards: Map<string, MemoryScopeGuard>,
  leases: MemoryLeaseManager,
  auctions: MemoryAuction,
  events: MemoryEventLog,
): {
  privateWritten: number
  sharedViaLease: number
  approvedRequests: number
  replaySteps: number
} {
  // 1. plot 写私有记忆
  const plotStore = stores.get('plot-1')!
  const entry1: MemoryEntry = {
    id: 'plot-pacing-1',
    agentId: 'plot-1',
    level: 'L2',
    content: 'Chapter 1 pacing: slow start, then accelerate',
    tags: ['pacing'],
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 0,
    importance: 80,
    metadata: {},
  }
  plotStore.add(entry1)
  events.record({ timestamp: Date.now(), type: 'add', entryId: entry1.id, agentId: 'plot-1', payload: { importance: 80 } })

  // 2. style coach 申请 lease 访问
  const lease = leases.grant(entry1.id, 'plot-1', 'style-1', 60_000, 'read')
  const canAccess = leases.canAccess(lease.leaseId, 'style-1', 'read')

  // 3. style coach 申请 auction 公开
  const req = auctions.request(entry1.id, 'style-1', '*', 'style reference', 'read')
  auctions.approve(req.requestId)

  // 4. replay
  const engine = new MemoryReplayEngine(plotStore, events)
  const steps = engine.steps('plot-1')

  return {
    privateWritten: 1,
    sharedViaLease: canAccess ? 1 : 0,
    approvedRequests: 1,
    replaySteps: steps.length,
  }
}

/** 完整 demo 入口 */
export function runMemorySharingDemo(): {
  teamSize: number
  result: ReturnType<typeof simulateMemorySharing>
} {
  const { runtime, stores, guards, leases, auctions, events } = startMemorySharingDemo()
  const result = simulateMemorySharing(runtime, stores, guards, leases, auctions, events)
  return { teamSize: stores.size, result }
}
