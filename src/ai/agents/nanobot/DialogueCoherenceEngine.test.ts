/**
 * DialogueCoherenceEngine Tests - V177
 * Tests for Dialogue Flow & Turn-Taking Coherence Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyDialogueState,
  recordDialogueTurn,
  endConversation,
  getConversationFlow,
  getSpeakerTurns,
  getDialogueIssues,
  formatDialogueSummary,
  formatDialogueDashboard,
} from './DialogueCoherenceEngine'

describe('createEmptyDialogueState', () => {
  it('should create empty state', () => {
    const state = createEmptyDialogueState()
    expect(state.turns.length).toBe(0)
    expect(state.conversations.length).toBe(0)
    expect(state.currentConversation).toBeNull()
  })
})

describe('recordDialogueTurn', () => {
  it('should add turn to state', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello Bob, how are you?', 'neutral', null, 1)
    expect(state.turns.length).toBe(1)
    expect(state.turns[0].speakerId).toBe('alice')
  })

  it('should record topic extraction', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'The weather is nice today. Let us go outside.', 'joy', null, 1)
    expect(state.turns[0].topics.length).toBeGreaterThan(0)
  })

  it('should create conversation', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello Bob!', 'joy', null, 1)
    expect(state.conversations.length).toBe(1)
    expect(state.currentConversation).not.toBeNull()
  })

  it('should track speaker in conversation', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    state = recordDialogueTurn(state, 'bob', 'Hi Alice!', 'joy', null, 2)
    const conv = state.conversations[0]
    expect(conv.participants).toContain('alice')
    expect(conv.participants).toContain('bob')
  })

  it('should detect runon sentence issue', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'I think that we should consider all the options carefully before making any hasty decisions because there are many factors to think about and we need to be thorough.', 'neutral', null, 1)
    state = recordDialogueTurn(state, 'alice', 'Also we should remember that there are multiple perspectives to consider and many different approaches we could take to solve this problem and we should think carefully about each one before deciding.', 'neutral', null, 2)
    expect(state.issues.some(i => i.type === 'runon_sentence')).toBeTruthy()
  })

  it('should link response to previous turn', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'The weather is nice.', 'joy', null, 1)
    const aliceTurnId = state.turns[0].turnId
    state = recordDialogueTurn(state, 'bob', 'Yes, it is perfect for a walk.', 'joy', aliceTurnId, 2)
    expect(state.turns[1].responseTo).toBe(aliceTurnId)
  })
})

describe('endConversation', () => {
  it('should clear current conversation', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    expect(state.currentConversation).not.toBeNull()
    state = endConversation(state)
    expect(state.currentConversation).toBeNull()
  })
})

describe('getConversationFlow', () => {
  it('should return empty for unknown conversation', () => {
    const state = createEmptyDialogueState()
    const flow = getConversationFlow(state, 'unknown_conv')
    expect(flow.length).toBe(0)
  })

  it('should return conversation turns', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    state = recordDialogueTurn(state, 'bob', 'Hi!', 'joy', null, 2)
    const convId = state.currentConversation!
    const flow = getConversationFlow(state, convId)
    expect(flow.length).toBe(2)
  })
})

describe('getSpeakerTurns', () => {
  it('should return empty for unknown speaker', () => {
    const state = createEmptyDialogueState()
    const turns = getSpeakerTurns(state, 'unknown')
    expect(turns.length).toBe(0)
  })

  it('should return speaker turns', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    state = recordDialogueTurn(state, 'bob', 'Hi!', 'joy', null, 2)
    state = recordDialogueTurn(state, 'alice', 'Good to see you!', 'joy', null, 3)
    const turns = getSpeakerTurns(state, 'alice')
    expect(turns.length).toBe(2)
  })
})

describe('getDialogueIssues', () => {
  it('should return empty for clean dialogue', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello Bob!', 'joy', null, 1)
    state = recordDialogueTurn(state, 'bob', 'Hi Alice!', 'joy', null, 2)
    expect(getDialogueIssues(state).length).toBe(0)
  })

  it('should return issues above severity threshold', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'I think that we should consider all the options carefully before making any hasty decisions.', 'neutral', null, 1)
    state = recordDialogueTurn(state, 'alice', 'Also we should think about multiple perspectives and approaches before making any choices about the solution.', 'neutral', null, 2)
    const issues = getDialogueIssues(state)
    expect(issues.length).toBeGreaterThanOrEqual(0)
  })
})

describe('formatDialogueSummary', () => {
  it('should show turn count', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    state = recordDialogueTurn(state, 'bob', 'Hi!', 'joy', null, 2)
    const summary = formatDialogueSummary(state)
    expect(summary).toContain('Total Turns: 2')
  })

  it('should show conversation count', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello!', 'joy', null, 1)
    const summary = formatDialogueSummary(state)
    expect(summary).toContain('Conversations: 1')
  })
})

describe('formatDialogueDashboard', () => {
  it('should show recent turns', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'Hello Bob!', 'joy', null, 1)
    const dashboard = formatDialogueDashboard(state)
    expect(dashboard).toContain('Recent Turns')
  })

  it('should show dialogue issues when present', () => {
    let state = createEmptyDialogueState()
    state = recordDialogueTurn(state, 'alice', 'I think we should consider all the different options carefully before making any decisions about our approach to this problem.', 'neutral', null, 1)
    state = recordDialogueTurn(state, 'alice', 'Additionally we should think about all the various perspectives and potential solutions to ensure we have thoroughly analyzed every aspect of this situation before proceeding.', 'neutral', null, 2)
    const dashboard = formatDialogueDashboard(state)
    expect(dashboard).toContain('Dialogue Issues')
  })
})
