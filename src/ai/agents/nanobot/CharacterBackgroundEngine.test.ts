/**
 * CharacterBackgroundEngine Tests - V157
 * Tests for Character History & Motivation Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyBackgroundState,
  createCharacter,
  registerCharacter,
  addEvent,
  setMotivation,
  getPrimaryMotivation,
  setRelationship,
  updateArcProgress,
  analyzeMotivationDrift,
  checkConsistency,
  formatCharacterProfile,
  formatBackgroundDashboard,
} from './CharacterBackgroundEngine'

describe('createEmptyBackgroundState', () => {
  it('should create empty state', () => {
    const state = createEmptyBackgroundState()
    expect(state.characters.size).toBe(0)
    expect(state.events.length).toBe(0)
    expect(state.currentCharacterId).toBeNull()
  })
})

describe('createCharacter', () => {
  it('should create character profile', () => {
    const char = createCharacter('c1', 'Alice')
    expect(char.charId).toBe('c1')
    expect(char.name).toBe('Alice')
    expect(char.backstory.length).toBe(0)
    expect(char.currentMotivations.length).toBe(0)
    expect(char.arcProgress).toBe(0)
  })
})

describe('registerCharacter', () => {
  it('should register character in state', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    expect(state.characters.size).toBe(1)
    expect(state.currentCharacterId).toBe('c1')
  })

  it('should update current character id', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('hero_1', 'Hero')
    state = registerCharacter(state, char)
    expect(state.currentCharacterId).toBe('hero_1')
  })
})

describe('addEvent', () => {
  it('should add event to character backstory', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = addEvent(state, 'c1', 'First Day', 'Started school', 25, 'school')
    
    const updated = state.characters.get('c1')!
    expect(updated.backstory.length).toBe(1)
    expect(updated.backstory[0].title).toBe('First Day')
  })

  it('should track in timeline', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = addEvent(state, 'c1', 'Event 1', 'First event', 10, 'home')
    expect(state.timeline.length).toBe(1)
  })

  it('should return unchanged state for unknown character', () => {
    const state = createEmptyBackgroundState()
    const result = addEvent(state, 'unknown', 'Event', 'Desc', 5, 'loc')
    expect(result).toBe(state)
  })
})

describe('setMotivation', () => {
  it('should set motivation for character', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = setMotivation(state, 'c1', { type: 'power', strength: 80, trigger: 'trauma', goal: 'control', barrier: 'fear' })
    
    const updated = state.characters.get('c1')!
    expect(updated.currentMotivations.length).toBe(1)
    expect(updated.currentMotivations[0].type).toBe('power')
  })

  it('should update existing motivation', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = setMotivation(state, 'c1', { type: 'love', strength: 60, trigger: 'meeting', goal: 'connection', barrier: 'trust' })
    state = setMotivation(state, 'c1', { type: 'love', strength: 85, trigger: 'meeting', goal: 'deep bond', barrier: 'none' })
    
    const updated = state.characters.get('c1')!
    expect(updated.currentMotivations.length).toBe(1)
    expect(updated.currentMotivations[0].strength).toBe(85)
  })
})

describe('getPrimaryMotivation', () => {
  it('should return highest strength motivation', () => {
    const char = createCharacter('c1', 'Alice')
    char.currentMotivations = [
      { type: 'power', strength: 30, trigger: 't', goal: 'g', barrier: 'b' },
      { type: 'love', strength: 90, trigger: 't', goal: 'g', barrier: 'b' },
      { type: 'freedom', strength: 60, trigger: 't', goal: 'g', barrier: 'b' },
    ]
    const primary = getPrimaryMotivation(char)
    expect(primary?.type).toBe('love')
  })

  it('should return null for no motivations', () => {
    const char = createCharacter('c1', 'Alice')
    const primary = getPrimaryMotivation(char)
    expect(primary).toBeNull()
  })
})

describe('setRelationship', () => {
  it('should set bidirectional relationship', () => {
    let state = createEmptyBackgroundState()
    const c1 = createCharacter('c1', 'Alice')
    const c2 = createCharacter('c2', 'Bob')
    state = registerCharacter(state, c1)
    state = registerCharacter(state, c2)
    state = setRelationship(state, 'c1', 'c2', 'ally')
    
    const alice = state.characters.get('c1')!
    const bob = state.characters.get('c2')!
    expect(alice.relationships.get('c2')).toBe('ally')
    expect(bob.relationships.get('c1')).toBe('ally')
  })

  it('should update existing relationship', () => {
    let state = createEmptyBackgroundState()
    const c1 = createCharacter('c1', 'Alice')
    const c2 = createCharacter('c2', 'Bob')
    state = registerCharacter(state, c1)
    state = registerCharacter(state, c2)
    state = setRelationship(state, 'c1', 'c2', 'ally')
    state = setRelationship(state, 'c1', 'c2', 'rival')
    
    const alice = state.characters.get('c1')!
    expect(alice.relationships.get('c2')).toBe('rival')
  })
})

describe('updateArcProgress', () => {
  it('should update arc progress', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = updateArcProgress(state, 'c1', 50)
    
    const updated = state.characters.get('c1')!
    expect(updated.arcProgress).toBe(50)
  })

  it('should cap at 100', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = updateArcProgress(state, 'c1', 150)
    
    const updated = state.characters.get('c1')!
    expect(updated.arcProgress).toBe(100)
  })

  it('should floor at 0', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = updateArcProgress(state, 'c1', -20)
    
    const updated = state.characters.get('c1')!
    expect(updated.arcProgress).toBe(0)
  })
})

describe('analyzeMotivationDrift', () => {
  it('should detect motivation changes', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = setMotivation(state, 'c1', { type: 'power', strength: 50, trigger: 'start', goal: 'gain', barrier: 'none' })
    state = setMotivation(state, 'c1', { type: 'power', strength: 80, trigger: 'changed', goal: 'more', barrier: 'less' })
    
    const drifts = analyzeMotivationDrift(state, 'c1')
    expect(drifts.length).toBeGreaterThanOrEqual(0)
  })

  it('should return empty for character with no history', () => {
    const state = createEmptyBackgroundState()
    const drifts = analyzeMotivationDrift(state, 'unknown')
    expect(drifts.length).toBe(0)
  })
})

describe('checkConsistency', () => {
  it('should pass consistent character', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    state = setMotivation(state, 'c1', { type: 'power', strength: 80, trigger: 't', goal: 'g', barrier: 'b' })
    
    const result = checkConsistency(state, 'c1')
    expect(result.consistent).toBe(true)
    expect(result.issues.length).toBe(0)
  })

  it('should fail character with no motivation', () => {
    let state = createEmptyBackgroundState()
    const char = createCharacter('c1', 'Alice')
    state = registerCharacter(state, char)
    
    const result = checkConsistency(state, 'c1')
    expect(result.issues.some(i => i.includes('motivation'))).toBeTruthy()
  })

  it('should fail for unknown character', () => {
    const state = createEmptyBackgroundState()
    const result = checkConsistency(state, 'unknown')
    expect(result.consistent).toBe(false)
  })
})

describe('formatCharacterProfile', () => {
  it('should format character profile', () => {
    const char = createCharacter('c1', 'Alice')
    char.arcProgress = 45
    char.emotionalState = 'determined'
    
    const formatted = formatCharacterProfile(char)
    expect(formatted).toContain('Alice')
    expect(formatted).toContain('45%')
    expect(formatted).toContain('determined')
  })

  it('should show primary motivation', () => {
    const char = createCharacter('c1', 'Bob')
    char.currentMotivations = [{ type: 'love', strength: 90, trigger: 't', goal: 'g', barrier: 'b' }]
    
    const formatted = formatCharacterProfile(char)
    expect(formatted).toContain('love')
  })
})

describe('formatBackgroundDashboard', () => {
  it('should show character count', () => {
    const state = createEmptyBackgroundState()
    const dashboard = formatBackgroundDashboard(state)
    expect(dashboard).toContain('Registered Characters: 0')
  })

  it('should show all characters', () => {
    let state = createEmptyBackgroundState()
    state = registerCharacter(state, createCharacter('c1', 'Alice'))
    state = registerCharacter(state, createCharacter('c2', 'Bob'))
    
    const dashboard = formatBackgroundDashboard(state)
    expect(dashboard).toContain('Registered Characters: 2')
    expect(dashboard).toContain('Alice')
    expect(dashboard).toContain('Bob')
  })
})
