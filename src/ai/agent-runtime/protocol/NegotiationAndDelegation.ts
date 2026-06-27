/**
 * protocol/NegotiationAndDelegation.ts (V2366-V2375)
 *
 * 合并 10 个 engines：
 * - V2366 NegotiationRoom: 多 agent 协商（OFFER/ACCEPT/REJECT）
 * - V2367 VoteCollector: 投票收集
 * - V2368 WeightedVoting: 加权投票
 * - V2369 ConsensusBuilder: 共识构建
 * - V2370 NegotiationLog: 协商历史
 * - V2371 DelegationChain: 委派链
 * - V2372 DelegationScope: 委派 scope 限制
 * - V2373 ArbitrationRoom: 仲裁
 * - V2374 ConflictResolver: 冲突解决
 * - V2375 DelegationLog: 委派历史
 */

import {
  createOffer,
  createAccept,
  createReject,
  createVote,
  createDelegate,
  createReturn,
  type MessageEnvelope,
  type VotePayload,
  type DelegatePayload,
  type ReturnPayload,
} from './types'

// =============================================================================
// V2366: NegotiationRoom
// =============================================================================

export interface NegotiationProposal {
  proposalId: string
  initiator: string
  proposal: string
  terms: Record<string, unknown>
  status: 'open' | 'accepted' | 'rejected' | 'expired'
  participants: string[]
  createdAt: number
  expiresAt?: number
  responses: Map<string, 'accept' | 'reject'>
}

export class NegotiationRoom {
  private _proposals: Map<string, NegotiationProposal> = new Map()

  /** 创建协商（生成 proposalId） */
  open(initiator: string, proposal: string, terms: Record<string, unknown>, options?: { participants?: string[]; expiresAt?: number }): NegotiationProposal {
    const id = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const p: NegotiationProposal = {
      proposalId: id,
      initiator,
      proposal,
      terms,
      status: 'open',
      participants: options?.participants ?? [],
      createdAt: Date.now(),
      expiresAt: options?.expiresAt,
      responses: new Map(),
    }
    this._proposals.set(id, p)
    return p
  }

  /** 接受 */
  accept(proposalId: string, by: string): { ok: boolean; reason?: string } {
    const p = this._proposals.get(proposalId)
    if (!p) return { ok: false, reason: 'proposal not found' }
    if (p.status !== 'open') return { ok: false, reason: `proposal ${p.status}` }
    p.responses.set(by, 'accept')
    if (p.responses.size >= p.participants.length) {
      p.status = 'accepted'
    }
    return { ok: true }
  }

  /** 拒绝 */
  reject(proposalId: string, by: string, _reason?: string): { ok: boolean; reason?: string } {
    const p = this._proposals.get(proposalId)
    if (!p) return { ok: false, reason: 'proposal not found' }
    if (p.status !== 'open') return { ok: false, reason: `proposal ${p.status}` }
    p.responses.set(by, 'reject')
    p.status = 'rejected'
    return { ok: true }
  }

  get(proposalId: string): NegotiationProposal | undefined {
    return this._proposals.get(proposalId)
  }

  list(filter?: { status?: NegotiationProposal['status']; initiator?: string }): NegotiationProposal[] {
    let arr = Array.from(this._proposals.values())
    if (filter?.status) arr = arr.filter(p => p.status === filter.status)
    if (filter?.initiator) arr = arr.filter(p => p.initiator === filter.initiator)
    return arr
  }

  count(): number {
    return this._proposals.size
  }
}

// =============================================================================
// V2367: VoteCollector
// =============================================================================

export interface VoteRecord {
  voter: string
  choice: string
  weight: number
  rationale?: string
  votedAt: number
}

export class VoteCollector {
  private _topics: Map<string, VoteRecord[]> = new Map()

  record(topic: string, vote: VoteRecord): void {
    if (!this._topics.has(topic)) this._topics.set(topic, [])
    this._topics.get(topic)!.push(vote)
  }

  votesFor(topic: string): VoteRecord[] {
    return [...(this._topics.get(topic) ?? [])]
  }

  topics(): string[] {
    return Array.from(this._topics.keys())
  }

  voterCount(topic: string): number {
    return this.votesFor(topic).length
  }

  clear(topic: string): boolean {
    return this._topics.delete(topic)
  }
}

// =============================================================================
// V2368: WeightedVoting
// =============================================================================

export interface WeightedVoteResult {
  winner: string
  weights: Map<string, number>
  totalWeight: number
  tied: boolean
}

export function tallyWeighted(votes: VoteRecord[]): WeightedVoteResult {
  const weights = new Map<string, number>()
  let total = 0
  for (const v of votes) {
    const w = v.weight
    weights.set(v.choice, (weights.get(v.choice) ?? 0) + w)
    total += w
  }
  let winner = ''
  let maxW = -1
  let tied = false
  for (const [choice, w] of weights) {
    if (w > maxW) { winner = choice; maxW = w; tied = false }
    else if (w === maxW) tied = true
  }
  return { winner, weights, totalWeight: total, tied }
}

// =============================================================================
// V2369: ConsensusBuilder
// =============================================================================

export type ConsensusStrategy = 'majority' | 'unanimous' | 'weighted' | 'any' | 'all'

export interface ConsensusResult {
  reached: boolean
  choice?: string
  reason: string
}

export function buildConsensus(
  votes: VoteRecord[],
  strategy: ConsensusStrategy,
  options?: { threshold?: number },
): ConsensusResult {
  if (votes.length === 0) return { reached: false, reason: 'no votes' }
  const total = votes.length
  if (strategy === 'all' || strategy === 'unanimous') {
    const choices = new Set(votes.map(v => v.choice))
    if (choices.size === 1) {
      return { reached: true, choice: votes[0].choice, reason: 'all agree' }
    }
    return { reached: false, reason: 'disagreement' }
  }
  if (strategy === 'any') {
    return { reached: true, choice: votes[0].choice, reason: 'any accepted' }
  }
  if (strategy === 'majority') {
    const counts = new Map<string, number>()
    for (const v of votes) {
      counts.set(v.choice, (counts.get(v.choice) ?? 0) + 1)
    }
    const threshold = options?.threshold ?? 0.5
    for (const [choice, c] of counts) {
      if (c / total > threshold) {
        return { reached: true, choice, reason: `majority ${c}/${total}` }
      }
    }
    return { reached: false, reason: 'no majority' }
  }
  if (strategy === 'weighted') {
    const tally = tallyWeighted(votes)
    if (tally.tied) return { reached: false, reason: 'tied weights' }
    return { reached: true, choice: tally.winner, reason: `weighted winner` }
  }
  return { reached: false, reason: 'unknown strategy' }
}

// =============================================================================
// V2370: NegotiationLog
// =============================================================================

export interface NegotiationLogEntry {
  timestamp: number
  proposalId: string
  actor: string
  action: 'open' | 'accept' | 'reject' | 'expire' | 'complete'
  details?: string
}

export class NegotiationLog {
  private _entries: NegotiationLogEntry[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  record(entry: Omit<NegotiationLogEntry, 'timestamp'>): void {
    this._entries.push({ ...entry, timestamp: Date.now() })
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries)
    }
  }

  entries(filter?: { proposalId?: string; actor?: string }): NegotiationLogEntry[] {
    let arr = [...this._entries].reverse()
    if (filter?.proposalId) arr = arr.filter(e => e.proposalId === filter.proposalId)
    if (filter?.actor) arr = arr.filter(e => e.actor === filter.actor)
    return arr
  }

  count(): number {
    return this._entries.length
  }

  clear(): void {
    this._entries = []
  }
}

// =============================================================================
// V2371: DelegationChain
// =============================================================================

export interface DelegationNode {
  delegateId: string
  from: string
  to: string
  task: string
  input?: unknown
  parentId?: string
  children: string[]
  result?: unknown
  error?: string
  success?: boolean
  durationMs?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout'
  createdAt: number
}

export class DelegationChain {
  private _nodes: Map<string, DelegationNode> = new Map()

  add(node: DelegationNode): void {
    this._nodes.set(node.delegateId, node)
    if (node.parentId) {
      const parent = this._nodes.get(node.parentId)
      if (parent) parent.children.push(node.delegateId)
    }
  }

  get(id: string): DelegationNode | undefined {
    return this._nodes.get(id)
  }

  complete(id: string, result: unknown, durationMs: number): boolean {
    const n = this._nodes.get(id)
    if (!n) return false
    n.result = result
    n.success = true
    n.status = 'completed'
    n.durationMs = durationMs
    return true
  }

  fail(id: string, error: string): boolean {
    const n = this._nodes.get(id)
    if (!n) return false
    n.error = error
    n.success = false
    n.status = 'failed'
    return true
  }

  /** 取 root-to-leaf 路径 */
  pathToRoot(id: string): DelegationNode[] {
    const path: DelegationNode[] = []
    let cur = this._nodes.get(id)
    while (cur) {
      path.unshift(cur)
      cur = cur.parentId ? this._nodes.get(cur.parentId) : undefined
    }
    return path
  }

  /** 子节点 */
  children(id: string): DelegationNode[] {
    const n = this._nodes.get(id)
    if (!n) return []
    return n.children.map(cid => this._nodes.get(cid)).filter((x): x is DelegationNode => !!x)
  }

  size(): number {
    return this._nodes.size
  }

  all(): DelegationNode[] {
    return Array.from(this._nodes.values())
  }
}

// =============================================================================
// V2372: DelegationScope
// =============================================================================

export interface DelegationScope {
  read?: 'self' | 'team' | 'public' | 'all'
  write?: 'self' | 'team' | 'public'
  tools?: string[]
  maxDepth?: number
}

export function isScopeAllowed(
  scope: DelegationScope | undefined,
  action: 'read' | 'write' | 'tool',
  target: { level?: string; agentId?: string; tool?: string; readerAgentId?: string },
  depth: number = 0,
): boolean {
  if (!scope) return true
  if (action === 'read' && scope.read) {
    const valid = ['self', 'team', 'public', 'all']
    if (!valid.includes(scope.read)) return false
    if (scope.read === 'self') {
      if (target.agentId && target.readerAgentId && target.agentId !== target.readerAgentId) {
        return false
      }
      if (target.agentId && target.agentId !== 'self' && !target.readerAgentId) {
        return false
      }
    }
  }
  if (action === 'write' && scope.write) {
    const valid = ['self', 'team', 'public']
    if (!valid.includes(scope.write)) return false
    if (scope.write === 'self') {
      if (target.agentId && target.readerAgentId && target.agentId !== target.readerAgentId) {
        return false
      }
      if (target.agentId && target.agentId !== 'self' && !target.readerAgentId) {
        return false
      }
    }
  }
  if (action === 'tool' && scope.tools) {
    if (target.tool && !scope.tools.includes(target.tool)) return false
  }
  if (scope.maxDepth !== undefined && depth > scope.maxDepth) return false
  return true
}

// =============================================================================
// V2373: ArbitrationRoom
// =============================================================================

export interface ArbitrationCase {
  caseId: string
  parties: string[]
  issue: string
  status: 'open' | 'resolved' | 'rejected'
  resolution?: string
  openedAt: number
  resolvedAt?: number
}

export class ArbitrationRoom {
  private _cases: Map<string, ArbitrationCase> = new Map()

  open(parties: string[], issue: string): ArbitrationCase {
    const id = `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const c: ArbitrationCase = {
      caseId: id, parties, issue, status: 'open', openedAt: Date.now(),
    }
    this._cases.set(id, c)
    return c
  }

  resolve(caseId: string, resolution: string): boolean {
    const c = this._cases.get(caseId)
    if (!c || c.status !== 'open') return false
    c.status = 'resolved'
    c.resolution = resolution
    c.resolvedAt = Date.now()
    return true
  }

  reject(caseId: string, reason: string): boolean {
    const c = this._cases.get(caseId)
    if (!c || c.status !== 'open') return false
    c.status = 'rejected'
    c.resolution = reason
    c.resolvedAt = Date.now()
    return true
  }

  get(caseId: string): ArbitrationCase | undefined {
    return this._cases.get(caseId)
  }

  openCases(): ArbitrationCase[] {
    return this.list().filter(c => c.status === 'open')
  }

  list(): ArbitrationCase[] {
    return Array.from(this._cases.values())
  }
}

// =============================================================================
// V2374: ConflictResolver
// =============================================================================

export type ResolutionStrategy = 'first-wins' | 'last-wins' | 'majority' | 'arbitration'

export interface ConflictItem<T> {
  source: string
  value: T
  weight?: number
}

export function resolveConflict<T>(
  items: ConflictItem<T>[],
  strategy: ResolutionStrategy,
  options?: { arbitrator?: (items: ConflictItem<T>[]) => T },
): { winner: ConflictItem<T>; resolved: T } {
  if (items.length === 0) {
    throw new Error('resolveConflict: no items')
  }
  if (items.length === 1) {
    return { winner: items[0], resolved: items[0].value }
  }
  switch (strategy) {
    case 'first-wins':
      return { winner: items[0], resolved: items[0].value }
    case 'last-wins':
      return { winner: items[items.length - 1], resolved: items[items.length - 1].value }
    case 'majority': {
      const counts = new Map<string, number>()
      for (const i of items) {
        const k = JSON.stringify(i.value)
        counts.set(k, (counts.get(k) ?? 0) + 1)
      }
      let best = items[0]
      let bestCount = -1
      for (const i of items) {
        const c = counts.get(JSON.stringify(i.value)) ?? 0
        if (c > bestCount) { best = i; bestCount = c }
      }
      return { winner: best, resolved: best.value }
    }
    case 'arbitration':
      if (!options?.arbitrator) {
        throw new Error('arbitration strategy requires arbitrator function')
      }
      const resolved = options.arbitrator(items)
      const winner = items.find(i => i.value === resolved) ?? items[0]
      return { winner, resolved }
  }
}

// =============================================================================
// V2375: DelegationLog
// =============================================================================

export interface DelegationLogEntry {
  timestamp: number
  delegateId: string
  from: string
  to: string
  task: string
  status: 'start' | 'complete' | 'fail' | 'timeout'
  details?: string
}

export class DelegationLog {
  private _entries: DelegationLogEntry[] = []
  private _maxEntries: number

  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries
  }

  record(entry: Omit<DelegationLogEntry, 'timestamp'>): void {
    this._entries.push({ ...entry, timestamp: Date.now() })
    if (this._entries.length > this._maxEntries) {
      this._entries = this._entries.slice(-this._maxEntries)
    }
  }

  entries(filter?: { delegateId?: string; from?: string; to?: string }): DelegationLogEntry[] {
    let arr = [...this._entries].reverse()
    if (filter?.delegateId) arr = arr.filter(e => e.delegateId === filter.delegateId)
    if (filter?.from) arr = arr.filter(e => e.from === filter.from)
    if (filter?.to) arr = arr.filter(e => e.to === filter.to)
    return arr
  }

  count(): number {
    return this._entries.length
  }

  clear(): void {
    this._entries = []
  }
}
