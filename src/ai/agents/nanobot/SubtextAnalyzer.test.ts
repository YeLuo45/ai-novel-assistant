/**
 * SubtextAnalyzer Tests - V169
 * Tests for Dialogue Subtext & Unspoken Meaning Detection Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySubtextState,
  analyzeDialogueSubtext,
  resolveSubtext,
  advanceChapter,
  getUnresolvedSubtextCount,
  getChapterSubtextIntensity,
  getMostCommonSubtextType,
  findSubtextByCharacter,
  formatSubtextSummary,
  formatSubtextDashboard,
} from './SubtextAnalyzer'

describe('createEmptySubtextState', () => {
  it('should create empty state', () => {
    const state = createEmptySubtextState()
    expect(state.findings.length).toBe(0)
    expect(state.undercurrents.length).toBe(0)
    expect(state.currentChapter).toBe(0)
    expect(state.unresolvedSubtext.length).toBe(0)
  })
})

describe('analyzeDialogueSubtext', () => {
  it('should not create finding for plain text', () => {
    const state = createEmptySubtextState()
    const result = analyzeDialogueSubtext(state, 'alice', 'Hello, how are you today?')
    expect(result.findings.length).toBe(0)
  })

  it('should detect irony', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh wonderful, another meeting. I am just thrilled to be here.')
    expect(state.findings.length).toBeGreaterThan(0)
    expect(state.findings.some(f => f.type === 'irony' || f.type === 'sarcasm')).toBeTruthy()
  })

  it('should detect verbal irony from patterns', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 2)
    state = analyzeDialogueSubtext(state, 'bob', 'Congratulations on your achievement. You must be so proud.')
    // 'congratulations' triggers verbal irony/sarcasm detection
    expect(state.findings.length).toBeGreaterThan(0)
  })

  it('should detect concealment', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 3)
    state = analyzeDialogueSubtext(state, 'carol', "It's nothing. I'm fine. Don't worry about it.")
    expect(state.findings.some(f => f.type === 'concealment')).toBeTruthy()
  })

  it('should detect longing', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 4)
    state = analyzeDialogueSubtext(state, 'dave', 'I wish things could be the way they used to be. I miss those days.')
    expect(state.findings.some(f => f.type === 'longing')).toBeTruthy()
  })

  it('should detect manipulation', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 5)
    state = analyzeDialogueSubtext(state, 'eve', 'You should really think about what\'s best for everyone here.')
    expect(state.findings.some(f => f.type === 'manipulation')).toBeTruthy()
  })

  it('should detect power struggle', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 6)
    state = analyzeDialogueSubtext(state, 'frank', 'I told you, you never listen to me. Do as I say this time.')
    expect(state.findings.some(f => f.type === 'power_struggle')).toBeTruthy()
  })

  it('should record speaker and chapter', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 7)
    state = analyzeDialogueSubtext(state, 'alice', 'Right, of course. Obviously you know everything. That is just perfect and wonderful.')
    const finding = state.findings.find(f => f.speakerId === 'alice')
    expect(finding).toBeTruthy()
    expect(finding?.chapter).toBe(7)
  })

  it('should accumulate findings', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Right, sure, totally perfect and wonderful.')
    state = analyzeDialogueSubtext(state, 'bob', 'Obviously, clearly great.')
    expect(state.findings.length).toBe(2)
  })

  it('should update subtext arc', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh perfect, just what I needed.')
    expect(state.subtextArc.length).toBe(1)
    expect(state.subtextArc[0].chapter).toBe(1)
  })

  it('should update character tensions', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 2)
    state = analyzeDialogueSubtext(state, 'char', 'You should do this. You need to do that.')
    expect(state.characterTensions.get('char')).toBeGreaterThan(0)
  })
})

describe('resolveSubtext', () => {
  it('should remove finding from unresolved', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh wonderful, another problem.')
    expect(state.unresolvedSubtext.length).toBeGreaterThan(0)
    
    const findingId = state.unresolvedSubtext[0].findingId
    state = resolveSubtext(state, findingId)
    expect(state.unresolvedSubtext.find(f => f.findingId === findingId)).toBeUndefined()
  })
})

describe('advanceChapter', () => {
  it('should update current chapter', () => {
    const state = createEmptySubtextState()
    const result = advanceChapter(state, 10)
    expect(result.currentChapter).toBe(10)
  })
})

describe('getUnresolvedSubtextCount', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptySubtextState()
    expect(getUnresolvedSubtextCount(state)).toBe(0)
  })

  it('should return count of unresolved findings', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh great, just wonderful.')
    expect(getUnresolvedSubtextCount(state)).toBeGreaterThan(0)
  })
})

describe('getChapterSubtextIntensity', () => {
  it('should return 0 for chapter with no findings', () => {
    const state = createEmptySubtextState()
    expect(getChapterSubtextIntensity(state, 1)).toBe(0)
  })

  it('should return average intensity for chapter', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 3)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh wonderful, another meeting. I am just thrilled to be here.')
    const intensity = getChapterSubtextIntensity(state, 3)
    expect(intensity).toBeGreaterThan(0)
  })
})

describe('getMostCommonSubtextType', () => {
  it('should return null for empty state', () => {
    const state = createEmptySubtextState()
    expect(getMostCommonSubtextType(state)).toBeNull()
  })

  it('should return most common type', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh great, just wonderful.')
    state = advanceChapter(state, 2)
    state = analyzeDialogueSubtext(state, 'bob', 'Oh perfect, fantastic.')
    const mostCommon = getMostCommonSubtextType(state)
    expect(mostCommon).not.toBeNull()
  })
})

describe('findSubtextByCharacter', () => {
  it('should return empty for unknown character', () => {
    const state = createEmptySubtextState()
    const findings = findSubtextByCharacter(state, 'unknown')
    expect(findings.length).toBe(0)
  })

  it('should return findings for character', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh wonderful.')
    const findings = findSubtextByCharacter(state, 'alice')
    expect(findings.length).toBeGreaterThan(0)
  })
})

describe('formatSubtextSummary', () => {
  it('should show findings count', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh great, just wonderful.')
    const summary = formatSubtextSummary(state)
    expect(summary).toContain('Total Findings:')
    expect(summary).toContain('Unresolved:')
  })

  it('should show most common type', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Right, sure, obviously.')
    const summary = formatSubtextSummary(state)
    expect(summary).toContain('Most Common Type')
  })
})

describe('formatSubtextDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 5)
    const dashboard = formatSubtextDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show subtext arc', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Oh wonderful.')
    const dashboard = formatSubtextDashboard(state)
    expect(dashboard).toContain('Subtext Arc')
  })

  it('should show unresolved subtext', () => {
    let state = createEmptySubtextState()
    state = advanceChapter(state, 1)
    state = analyzeDialogueSubtext(state, 'alice', 'Right, obviously. That is just great and perfect!')
    const dashboard = formatSubtextDashboard(state)
    expect(dashboard).toContain('Unresolved Subtext')
  })
})
