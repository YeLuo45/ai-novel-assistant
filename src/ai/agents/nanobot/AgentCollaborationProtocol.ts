/**
 * AgentCollaborationProtocol - V132
 * Multi-Agent Communication & Consensus System
 * 
 * Inspired by:
 * - chatdev: multi-agent communication and role-based negotiation
 * - nanobot: distributed mesh communication
 * - generic-agent: autonomous decision making and consensus
 * 
 * Provides:
 * - Message passing between agents
 * - Role-based message filtering
 * - Consensus voting mechanism
 * - Proposal and response protocol
 * - Message priority and queuing
 */

import type { AgentCoordinationSuiteState } from './AgentCoordinationSuite'

// =============================================================================
// Types
// =============================================================================

export type MessageType = 'proposal' | 'response' | 'vote' | 'query' | 'info' | 'warning' | 'error' | 'consensus'
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical'
export type VoteOutcome = 'approved' | 'rejected' | 'abstained'
export type ConsensusState = 'proposing' | 'voting' | 'decided' | 'expired'

export interface AgentMessage {
  id: string
  type: MessageType
  fromAgentId: string
  toAgentId: string | 'broadcast'    // specific agent or broadcast
  subject: string
  content: string
  timestamp: number
  priority: MessagePriority
  replyTo: string | null             // message ID this is replying to
  payload: Record<string, any>      // structured data
  expiresAt: number | null           // for time-limited messages
}

export interface ConsensusProposal {
  id: string
  proposerId: string
  subject: string
  description: string
  voteStartTime: number
  voteDeadline: number
  votes: Map<string, VoteRecord>     // agentId -> vote
  requiredApprovals: number          // minimum yes votes
  state: ConsensusState
  outcome: VoteOutcome | null
  voters: string[]                   // agents eligible to vote
}

export interface VoteRecord {
  agentId: string
  decision: 'approve' | 'reject' | 'abstain'
  reason: string | null
  timestamp: number
}

export interface AgentInbox {
  agentId: string
  messages: AgentMessage[]
  unreadCount: number
  priorityCount: number
  lastChecked: number
}

export interface CollaborationProtocolState {
  messages: Map<string, AgentMessage>       // messageId -> message
  messageQueue: string[]                     // pending delivery message IDs
  consensusProposals: Map<string, ConsensusProposal>
  inboxes: Map<string, AgentInbox>           // agentId -> inbox
  broadcastHistory: string[]                 // recent broadcast message IDs
  messageCounter: number
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyCollaborationState(): CollaborationProtocolState {
  return {
    messages: new Map(),
    messageQueue: [],
    consensusProposals: new Map(),
    inboxes: new Map(),
    broadcastHistory: [],
    messageCounter: 0,
  }
}

// =============================================================================
// Message Creation
// =============================================================================

function generateMessageId(state: CollaborationProtocolState): string {
  state.messageCounter++
  return `msg_${Date.now()}_${state.messageCounter}`
}

export function createMessage(
  state: CollaborationProtocolState,
  type: MessageType,
  fromAgentId: string,
  toAgentId: string | 'broadcast',
  subject: string,
  content: string,
  options?: {
    priority?: MessagePriority
    replyTo?: string
    payload?: Record<string, any>
    expiresAt?: number
  }
): { state: CollaborationProtocolState; messageId: string } {
  const id = generateMessageId(state)

  const message: AgentMessage = {
    id,
    type,
    fromAgentId,
    toAgentId,
    subject,
    content,
    timestamp: Date.now(),
    priority: options?.priority ?? 'normal',
    replyTo: options?.replyTo ?? null,
    payload: options?.payload ?? {},
    expiresAt: options?.expiresAt ?? null,
  }

  const newMessages = new Map(state.messages)
  newMessages.set(id, message)

  const newQueue = [...state.messageQueue, id]

  return {
    state: { ...state, messages: newMessages, messageQueue: newQueue },
    messageId: id,
  }
}

export function sendDirectMessage(
  state: CollaborationProtocolState,
  fromAgentId: string,
  toAgentId: string,
  subject: string,
  content: string,
  options?: { priority?: MessagePriority; replyTo?: string; payload?: Record<string, any> }
): { state: CollaborationProtocolState; messageId: string } {
  return createMessage(state, 'info', fromAgentId, toAgentId, subject, content, options)
}

export function sendBroadcast(
  state: CollaborationProtocolState,
  fromAgentId: string,
  subject: string,
  content: string,
  options?: { priority?: MessagePriority; payload?: Record<string, any> }
): { state: CollaborationProtocolState; messageId: string } {
  const result = createMessage(state, 'info', fromAgentId, 'broadcast', subject, content, options)

  const newHistory = [result.messageId, ...state.broadcastHistory].slice(0, 50)

  return {
    state: { ...state, broadcastHistory: newHistory },
    messageId: result.messageId,
  }
}

// =============================================================================
// Inbox Management
// =============================================================================

export function deliverMessage(
  state: CollaborationProtocolState,
  messageId: string,
  recipientAgentId: string
): CollaborationProtocolState {
  const message = state.messages.get(messageId)
  if (!message) return state

  // Create or update inbox for recipient
  const existingInbox = state.inboxes.get(recipientAgentId)
  const newInboxes = new Map(state.inboxes)

  if (existingInbox) {
    newInboxes.set(recipientAgentId, {
      ...existingInbox,
      messages: [messageId, ...existingInbox.messages],
      unreadCount: existingInbox.unreadCount + 1,
      priorityCount: message.priority === 'high' || message.priority === 'critical'
        ? existingInbox.priorityCount + 1
        : existingInbox.priorityCount,
    })
  } else {
    newInboxes.set(recipientAgentId, {
      agentId: recipientAgentId,
      messages: [messageId],
      unreadCount: 1,
      priorityCount: message.priority === 'high' || message.priority === 'critical' ? 1 : 0,
      lastChecked: 0,
    })
  }

  // Remove from queue
  const newQueue = state.messageQueue.filter(id => id !== messageId)

  return {
    ...state,
    inboxes: newInboxes,
    messageQueue: newQueue,
  }
}

export function deliverAllPendingMessages(state: CollaborationProtocolState): CollaborationProtocolState {
  let newState = state

  for (const messageId of state.messageQueue) {
    const message = newState.messages.get(messageId)
    if (!message) continue

    if (message.toAgentId === 'broadcast') {
      // Deliver to all known agents
      for (const agentId of newState.inboxes.keys()) {
        newState = deliverMessage(newState, messageId, agentId)
      }
    } else {
      newState = deliverMessage(newState, messageId, message.toAgentId)
    }
  }

  return newState
}

export function markInboxRead(
  state: CollaborationProtocolState,
  agentId: string
): CollaborationProtocolState {
  const inbox = state.inboxes.get(agentId)
  if (!inbox) return state

  const newInboxes = new Map(state.inboxes)
  newInboxes.set(agentId, {
    ...inbox,
    unreadCount: 0,
    priorityCount: 0,
    lastChecked: Date.now(),
  })

  return { ...state, inboxes: newInboxes }
}

export function getAgentInbox(
  state: CollaborationProtocolState,
  agentId: string,
  options?: { unreadOnly?: boolean; priorityOnly?: boolean }
): AgentMessage[] {
  const inbox = state.inboxes.get(agentId)
  if (!inbox) return []

  let messageIds = inbox.messages

  if (options?.unreadOnly) {
    // We don't track read/unread per message, just count
    // For simplicity, return all messages if unreadCount > 0
    if (inbox.unreadCount === 0) return []
  }

  if (options?.priorityOnly) {
    messageIds = messageIds.slice(0, inbox.priorityCount)
  }

  return messageIds
    .map(id => state.messages.get(id))
    .filter((m): m is AgentMessage => m !== undefined)
    .filter(m => !m.expiresAt || m.expiresAt > Date.now())
}

// =============================================================================
// Consensus Protocol
// =============================================================================

export function createConsensusProposal(
  state: CollaborationProtocolState,
  proposerId: string,
  subject: string,
  description: string,
  voters: string[],
  options?: {
    voteDurationMs?: number
    requiredApprovals?: number
  }
): { state: CollaborationProtocolState; proposalId: string } {
  const id = `consensus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const now = Date.now()
  const proposal: ConsensusProposal = {
    id,
    proposerId,
    subject,
    description,
    voteStartTime: now,
    voteDeadline: now + (options?.voteDurationMs ?? 60000),
    votes: new Map(),
    requiredApprovals: options?.requiredApprovals ?? Math.floor(voters.length / 2) + 1,
    state: 'proposing',
    outcome: null,
    voters,
  }

  const newConsensus = new Map(state.consensusProposals)
  newConsensus.set(id, proposal)

  return {
    state: { ...state, consensusProposals: newConsensus },
    proposalId: id,
  }
}

export function castVote(
  state: CollaborationProtocolState,
  proposalId: string,
  agentId: string,
  decision: 'approve' | 'reject' | 'abstain',
  reason?: string
): CollaborationProtocolState {
  const proposal = state.consensusProposals.get(proposalId)
  if (!proposal) return state
  if (proposal.state !== 'proposing' && proposal.state !== 'voting') return state
  if (!proposal.voters.includes(agentId)) return state

  const newVotes = new Map(proposal.votes)
  newVotes.set(agentId, {
    agentId,
    decision,
    reason: reason ?? null,
    timestamp: Date.now(),
  })

  const updatedProposal: ConsensusProposal = {
    ...proposal,
    votes: newVotes,
    state: 'voting',
  }

  // Check if deadline passed
  if (Date.now() > proposal.voteDeadline) {
    updatedProposal.state = 'decided'
    updatedProposal.outcome = determineOutcome(updatedProposal)
  }

  const newConsensus = new Map(state.consensusProposals)
  newConsensus.set(proposalId, updatedProposal)

  return { ...state, consensusProposals: newConsensus }
}

function determineOutcome(proposal: ConsensusProposal): VoteOutcome {
  const yesVotes = Array.from(proposal.votes.values()).filter(v => v.decision === 'approve').length
  const noVotes = Array.from(proposal.votes.values()).filter(v => v.decision === 'reject').length

  if (yesVotes >= proposal.requiredApprovals) return 'approved'
  if (noVotes > proposal.voters.length - proposal.requiredApprovals) return 'rejected'
  return 'abstained'
}

export function finalizeConsensus(
  state: CollaborationProtocolState,
  proposalId: string
): CollaborationProtocolState {
  const proposal = state.consensusProposals.get(proposalId)
  if (!proposal) return state
  if (proposal.state === 'decided') return state

  const updatedProposal: ConsensusProposal = {
    ...proposal,
    state: 'decided',
    outcome: determineOutcome(proposal),
  }

  const newConsensus = new Map(state.consensusProposals)
  newConsensus.set(proposalId, updatedProposal)

  return { ...state, consensusProposals: newConsensus }
}

// =============================================================================
// Message Filtering
// =============================================================================

export function filterMessagesByType(
  state: CollaborationProtocolState,
  agentId: string,
  type: MessageType
): AgentMessage[] {
  const inbox = state.inboxes.get(agentId)
  if (!inbox) return []

  return inbox.messages
    .map(id => state.messages.get(id))
    .filter((m): m is AgentMessage => m !== undefined && m.type === type)
}

export function filterMessagesBySender(
  state: CollaborationProtocolState,
  agentId: string,
  senderId: string
): AgentMessage[] {
  const inbox = state.inboxes.get(agentId)
  if (!inbox) return []

  return inbox.messages
    .map(id => state.messages.get(id))
    .filter((m): m is AgentMessage => m !== undefined && m.fromAgentId === senderId)
}

export function filterExpiredMessages(state: CollaborationProtocolState): CollaborationProtocolState {
  const now = Date.now()

  const newMessages = new Map(state.messages)
  const expiredIds: string[] = []

  for (const [id, message] of Array.from(newMessages.entries())) {
    if (message.expiresAt && message.expiresAt < now) {
      newMessages.delete(id)
      expiredIds.push(id)
    }
  }

  const newQueue = state.messageQueue.filter(id => !expiredIds.includes(id))

  return {
    ...state,
    messages: newMessages,
    messageQueue: newQueue,
  }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatInboxSummary(state: CollaborationProtocolState, agentId: string): string {
  const inbox = state.inboxes.get(agentId)
  if (!inbox) return `Inbox for ${agentId}: empty`

  const lines = [
    `=== Inbox: ${agentId} ===`,
    `Total: ${inbox.messages.length} | Unread: ${inbox.unreadCount} | Priority: ${inbox.priorityCount}`,
    '',
  ]

  const recentMessages = inbox.messages.slice(0, 5)
  for (const msgId of recentMessages) {
    const msg = state.messages.get(msgId)
    if (!msg) continue

    const marker = msg.priority === 'critical' ? '❗' : msg.priority === 'high' ? '↑' : '·'
    lines.push(`${marker} [${msg.type}] ${msg.fromAgentId} -> ${msg.toAgentId}: ${msg.subject}`)
  }

  return lines.join('\n')
}

export function formatConsensusStatus(state: CollaborationProtocolState, proposalId: string): string {
  const proposal = state.consensusProposals.get(proposalId)
  if (!proposal) return `Proposal ${proposalId} not found`

  const yesVotes = Array.from(proposal.votes.values()).filter(v => v.decision === 'approve').length
  const noVotes = Array.from(proposal.votes.values()).filter(v => v.decision === 'reject').length
  const abstain = Array.from(proposal.votes.values()).filter(v => v.decision === 'abstain').length

  const lines = [
    `=== Consensus: ${proposal.subject} ===`,
    `Proposer: ${proposal.proposerId} | State: ${proposal.state}`,
    `Votes: ${yesVotes} yes | ${noVotes} no | ${abstain} abstain`,
    `Required: ${proposal.requiredApprovals} of ${proposal.voters.length} voters`,
    `Deadline: ${new Date(proposal.voteDeadline).toLocaleString()}`,
    proposal.outcome ? `Outcome: ${proposal.outcome}` : '',
  ]

  return lines.filter(Boolean).join('\n')
}

export function formatCollaborationDashboard(state: CollaborationProtocolState): string {
  const lines = [
    '=== Collaboration Protocol Dashboard ===',
    `Messages: ${state.messages.size} | Pending: ${state.messageQueue.length}`,
    `Consensus Proposals: ${state.consensusProposals.size}`,
    `Inboxes: ${state.inboxes.size}`,
    '',
  ]

  const activeProposals = Array.from(state.consensusProposals.values())
    .filter(p => p.state === 'proposing' || p.state === 'voting')

  if (activeProposals.length > 0) {
    lines.push('--- Active Consensus ---')
    for (const p of activeProposals.slice(0, 3)) {
      lines.push(`  ${p.subject}: ${p.state} (${p.votes.size}/${p.voters.length} voted)`)
    }
  }

  return lines.join('\n')
}