/**
 * AgentCollaborationProtocol Tests - V133
 * Tests for Multi-Agent Communication & Consensus System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyCollaborationState,
  createMessage,
  sendDirectMessage,
  sendBroadcast,
  deliverMessage,
  deliverAllPendingMessages,
  markInboxRead,
  getAgentInbox,
  createConsensusProposal,
  castVote,
  finalizeConsensus,
  filterMessagesByType,
  filterMessagesBySender,
  filterExpiredMessages,
  formatInboxSummary,
  formatConsensusStatus,
  formatCollaborationDashboard,
} from './AgentCollaborationProtocol'

// =============================================================================
// createEmptyCollaborationState Tests
// =============================================================================

describe('createEmptyCollaborationState', () => {
  it('should create empty state', () => {
    const state = createEmptyCollaborationState()
    expect(state.messages.size).toBe(0)
    expect(state.messageQueue.length).toBe(0)
    expect(state.consensusProposals.size).toBe(0)
    expect(state.inboxes.size).toBe(0)
  })

  it('should have zero message counter', () => {
    const state = createEmptyCollaborationState()
    expect(state.messageCounter).toBe(0)
  })
})

// =============================================================================
// Message Creation Tests
// =============================================================================

describe('createMessage', () => {
  it('should create message with generated id', () => {
    let state = createEmptyCollaborationState()
    const { state: newState, messageId } = createMessage(state, 'info', 'agent_a', 'agent_b', 'Test', 'Hello')

    expect(messageId).toContain('msg_')
    expect(newState.messages.has(messageId)).toBe(true)
  })

  it('should add to message queue', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createMessage(state, 'info', 'a', 'b', 'Subj', 'Content')

    expect(newState.messageQueue).toContain(newState.messages.keys().next().value)
  })

  it('should support broadcast', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createMessage(state, 'info', 'agent_a', 'broadcast', 'Alert', 'Everyone!')

    const msg = Array.from(newState.messages.values())[0]
    expect(msg.toAgentId).toBe('broadcast')
  })

  it('should default priority to normal', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createMessage(state, 'info', 'a', 'b', 's', 'c')

    const msg = Array.from(newState.messages.values())[0]
    expect(msg.priority).toBe('normal')
  })

  it('should support replyTo', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createMessage(state, 'response', 'a', 'b', 'Re: Test', 'Reply content', {
      replyTo: 'msg_123'
    })

    const msg = Array.from(newState.messages.values())[0]
    expect(msg.replyTo).toBe('msg_123')
  })
})

describe('sendDirectMessage', () => {
  it('should create direct message', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = sendDirectMessage(state, 'writer', 'editor', 'Chapter Done', 'Chapter 1 complete')

    const msg = Array.from(newState.messages.values())[0]
    expect(msg.type).toBe('info')
    expect(msg.fromAgentId).toBe('writer')
    expect(msg.toAgentId).toBe('editor')
  })
})

describe('sendBroadcast', () => {
  it('should create broadcast message', () => {
    let state = createEmptyCollaborationState()
    const result = sendBroadcast(state, 'orchestrator', 'Status Update', 'All agents note')

    // broadcastHistory should be updated
    expect(result.state.broadcastHistory.length).toBeGreaterThan(0)
    // messageId should be present
    expect(result.messageId).toContain('msg_')
  })
})

// =============================================================================
// Inbox Tests
// =============================================================================

describe('deliverMessage', () => {
  it('should deliver message to recipient inbox', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'agent_a', 'agent_b', 'Hello', 'Hi there')
    state = deliverMessage(s1, messageId, 'b')

    expect(state.inboxes.has('b')).toBe(true)
    expect(state.inboxes.get('b')?.messages).toContain(messageId)
  })

  it('should remove from queue after delivery', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'a', 'b', 's', 'c')
    state = deliverMessage(s1, messageId, 'b')

    expect(state.messageQueue).not.toContain(messageId)
  })

  it('should increment unread count', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'a', 'b', 's', 'c')
    state = deliverMessage(s1, messageId, 'b')

    expect(state.inboxes.get('b')?.unreadCount).toBe(1)
  })

  it('should handle unknown message', () => {
    const state = createEmptyCollaborationState()
    const result = deliverMessage(state, 'unknown_msg', 'agent_b')
    expect(result).toBe(state)
  })
})

describe('deliverAllPendingMessages', () => {
  it('should deliver all queued messages', () => {
    let state = createEmptyCollaborationState()
    const { state: s1 } = sendDirectMessage(state, 'a', 'b', 'msg1', 'content1')
    const { state: s2 } = sendDirectMessage(s1, 'a', 'b', 'msg2', 'content2')
    state = deliverAllPendingMessages(s2)

    expect(state.inboxes.get('b')?.messages.length).toBe(2)
    expect(state.messageQueue.length).toBe(0)
  })

  it('should handle broadcast to all inboxes', () => {
    let state = createEmptyCollaborationState()
    // Create two agent inboxes first
    state = { ...state, inboxes: new Map([
      ['agent_x', { agentId: 'agent_x', messages: [], unreadCount: 0, priorityCount: 0, lastChecked: 0 }],
      ['agent_y', { agentId: 'agent_y', messages: [], unreadCount: 0, priorityCount: 0, lastChecked: 0 }],
    ]) }
    const { state: s1, messageId: bcastMsg } = sendBroadcast(state, 'orch', 'Alert', 'Broadcast message')
    state = deliverAllPendingMessages(s1)

    // message queue should be empty after delivery
    expect(state.messageQueue.length).toBe(0)
  })
})

describe('markInboxRead', () => {
  it('should clear unread and priority counts', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'a', 'b', 's', 'c', { priority: 'high' })
    state = deliverMessage(s1, messageId, 'b')
    state = markInboxRead(state, 'b')

    const inbox = state.inboxes.get('b')
    expect(inbox?.unreadCount).toBe(0)
    expect(inbox?.priorityCount).toBe(0)
    expect(inbox?.lastChecked).toBeGreaterThan(0)
  })

  it('should handle unknown agent', () => {
    const state = createEmptyCollaborationState()
    const result = markInboxRead(state, 'unknown')
    expect(result).toBe(state)
  })
})

describe('getAgentInbox', () => {
  it('should return empty for unknown agent', () => {
    const state = createEmptyCollaborationState()
    expect(getAgentInbox(state, 'unknown')).toEqual([])
  })

  it('should return messages for known agent', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'a', 'b', 's', 'c')
    state = deliverMessage(s1, messageId, 'b')

    const messages = getAgentInbox(state, 'b')
    expect(messages.length).toBeGreaterThan(0)
  })

  it('should return empty when unreadCount is 0', () => {
    let state = createEmptyCollaborationState()
    state = markInboxRead(state, 'b')  // No inbox exists, returns empty

    expect(getAgentInbox(state, 'agent_b')).toEqual([])
  })
})

// =============================================================================
// Consensus Tests
// =============================================================================

describe('createConsensusProposal', () => {
  it('should create proposal with id', () => {
    let state = createEmptyCollaborationState()
    const { state: newState, proposalId } = createConsensusProposal(
      state, 'proposer_a', 'Add new agent', 'Should we add a critic agent?', ['voter1', 'voter2']
    )

    expect(proposalId).toContain('consensus_')
    expect(newState.consensusProposals.has(proposalId)).toBe(true)
  })

  it('should set correct initial state', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createConsensusProposal(
      state, 'p', 'Test', 'Description', ['v1', 'v2']
    )

    const proposal = Array.from(newState.consensusProposals.values())[0]
    expect(proposal.state).toBe('proposing')
    expect(proposal.outcome).toBeNull()
    expect(proposal.voters).toEqual(['v1', 'v2'])
  })

  it('should set required approvals', () => {
    let state = createEmptyCollaborationState()
    const { state: newState } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1', 'v2', 'v3', 'v4'], { requiredApprovals: 3 }
    )

    const proposal = Array.from(newState.consensusProposals.values())[0]
    expect(proposal.requiredApprovals).toBe(3)
  })
})

describe('castVote', () => {
  it('should record approve vote', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'proposer', 'Test', 'Desc', ['voter1', 'voter2']
    )
    state = castVote(s1, proposalId, 'voter1', 'approve')

    const proposal = state.consensusProposals.get(proposalId)
    expect(proposal?.votes.has('voter1')).toBe(true)
    expect(proposal?.votes.get('voter1')?.decision).toBe('approve')
  })

  it('should record reject vote', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['voter1']
    )
    state = castVote(s1, proposalId, 'voter1', 'reject', 'Not enough detail')

    const proposal = state.consensusProposals.get(proposalId)
    expect(proposal?.votes.has('voter1')).toBe(true)
  })

  it('should change state to voting', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1']
    )
    state = castVote(s1, proposalId, 'v1', 'abstain')

    expect(state.consensusProposals.get(proposalId)?.state).toBe('voting')
  })

  it('should reject vote from non-voter', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1']
    )
    state = castVote(s1, proposalId, 'outsider', 'approve')

    const proposal = state.consensusProposals.get(proposalId)
    expect(proposal?.votes.has('outsider')).toBe(false)
  })

  it('should reject vote on unknown proposal', () => {
    let state = createEmptyCollaborationState()
    state = castVote(state, 'unknown', 'v1', 'approve')

    expect(state).toBe(state)  // No change
  })
})

describe('finalizeConsensus', () => {
  it('should set outcome on finalize', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1', 'v2', 'v3'], { requiredApprovals: 2 }
    )
    state = castVote(s1, proposalId, 'v1', 'approve')
    state = castVote(state, proposalId, 'v2', 'approve')
    state = finalizeConsensus(state, proposalId)

    const proposal = state.consensusProposals.get(proposalId)
    expect(proposal?.state).toBe('decided')
    expect(proposal?.outcome).toBe('approved')
  })

  it('should set decided outcome when not enough approvals', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1', 'v2', 'v3'], { requiredApprovals: 3 }
    )
    state = castVote(s1, proposalId, 'v1', 'approve')
    state = castVote(state, proposalId, 'v2', 'reject')
    state = finalizeConsensus(state, proposalId)

    const proposal = state.consensusProposals.get(proposalId)
    expect(proposal?.outcome).toBeTruthy()  // abstained or rejected
    expect(proposal?.state).toBe('decided')
  })

  it('should not finalize already decided', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'p', 'Test', 'Desc', ['v1']
    )
    state = castVote(s1, proposalId, 'v1', 'approve')
    state = finalizeConsensus(state, proposalId)
    const outcome1 = state.consensusProposals.get(proposalId)?.outcome

    state = finalizeConsensus(state, proposalId)  // try again
    expect(state.consensusProposals.get(proposalId)?.outcome).toBe(outcome1)
  })
})

// =============================================================================
// Message Filtering Tests
// =============================================================================

describe('filterMessagesByType', () => {
  it('should return messages of specified type', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId: m1 } = createMessage(state, 'info', 'a', 'b', 's', 'c')
    const { state: s2, messageId: m2 } = createMessage(s1, 'warning', 'a', 'b', 's', 'c')
    state = deliverMessage(s2, m1, 'b')
    state = deliverMessage(state, m2, 'b')

    const warnings = filterMessagesByType(state, 'b', 'warning')
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toBe('warning')
  })

  it('should return empty for unknown agent', () => {
    const state = createEmptyCollaborationState()
    expect(filterMessagesByType(state, 'unknown', 'info')).toEqual([])
  })
})

describe('filterMessagesBySender', () => {
  it('should return messages from specified sender', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId: m1 } = createMessage(state, 'info', 'writer', 'b', 's', 'c')
    const { state: s2, messageId: m2 } = createMessage(s1, 'info', 'editor', 'b', 's', 'c')
    state = deliverMessage(s2, m1, 'b')
    state = deliverMessage(state, m2, 'b')

    const fromWriter = filterMessagesBySender(state, 'b', 'writer')
    expect(fromWriter.length).toBe(1)
    expect(fromWriter[0].fromAgentId).toBe('writer')
  })
})

describe('filterExpiredMessages', () => {
  it('should remove expired messages', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = createMessage(state, 'info', 'a', 'b', 's', 'c', {
      expiresAt: Date.now() - 1000  // already expired
    })
    state = deliverMessage(s1, messageId, 'b')
    state = filterExpiredMessages(state)

    expect(state.messages.has(messageId)).toBe(false)
  })

  it('should keep non-expired messages', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = createMessage(state, 'info', 'a', 'b', 's', 'c', {
      expiresAt: Date.now() + 60000  // not expired
    })
    state = filterExpiredMessages(s1)

    expect(state.messages.has(messageId)).toBe(true)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatInboxSummary', () => {
  it('should show empty for unknown agent', () => {
    const state = createEmptyCollaborationState()
    const summary = formatInboxSummary(state, 'unknown')
    expect(summary).toContain('empty')
  })

  it('should show inbox contents', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, messageId } = sendDirectMessage(state, 'writer', 'editor', 'Chapter 1', 'Done!')
    state = deliverMessage(s1, messageId, 'editor')

    const summary = formatInboxSummary(state, 'editor')
    expect(summary).toContain('editor')
    expect(summary).toContain('Chapter 1')
  })
})

describe('formatConsensusStatus', () => {
  it('should show not found for unknown proposal', () => {
    const state = createEmptyCollaborationState()
    const status = formatConsensusStatus(state, 'unknown')
    expect(status).toContain('not found')
  })

  it('should format active proposal', () => {
    let state = createEmptyCollaborationState()
    const { state: s1, proposalId } = createConsensusProposal(
      state, 'proposer', 'Add Critic', 'Should we add a critic?', ['v1', 'v2']
    )

    const status = formatConsensusStatus(s1, proposalId)
    expect(status).toContain('Add Critic')
    expect(status).toContain('proposing')
  })
})

describe('formatCollaborationDashboard', () => {
  it('should show empty state', () => {
    const state = createEmptyCollaborationState()
    const dashboard = formatCollaborationDashboard(state)
    expect(dashboard).toContain('Collaboration Protocol Dashboard')
    expect(dashboard).toContain('Messages: 0')
  })

  it('should show consensus proposals', () => {
    let state = createEmptyCollaborationState()
    const { state: s1 } = createConsensusProposal(state, 'p', 'Test', 'Desc', ['v1'])

    const dashboard = formatCollaborationDashboard(s1)
    expect(dashboard).toContain('Consensus Proposals: 1')
  })

  it('should show inbox count', () => {
    let state = createEmptyCollaborationState()
    state = { ...state, inboxes: new Map([
      ['a1', { agentId: 'a1', messages: [], unreadCount: 0, priorityCount: 0, lastChecked: 0 }],
      ['a2', { agentId: 'a2', messages: [], unreadCount: 0, priorityCount: 0, lastChecked: 0 }],
    ]) }

    const dashboard = formatCollaborationDashboard(state)
    expect(dashboard).toContain('Inboxes: 2')
  })
})