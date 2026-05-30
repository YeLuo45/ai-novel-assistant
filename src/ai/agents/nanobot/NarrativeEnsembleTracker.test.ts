import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addCastMember,
  registerInteraction,
  updateScreenTime,
  generateEnsembleReport,
  getCharacterInteractions,
  getCharacterByRole,
} from './NarrativeEnsembleTracker'

describe('createEmptyState', () => {
  it('should create empty ensemble state', () => {
    const s = createEmptyState()
    expect(s.cast).toEqual([])
    expect(s.interactions).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addCastMember', () => {
  it('should add cast member', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist', 90)
    expect(s.cast.length).toBe(1)
    expect(s.cast[0].name).toBe('Hero')
    expect(s.cast[0].role).toBe('protagonist')
  })

  it('should assign sequential IDs', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist')
    s = addCastMember(s, 'Villain', 'deuteragonist')
    expect(s.cast[0].id).not.toBe(s.cast[1].id)
  })
})

describe('registerInteraction', () => {
  it('should register interaction', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist')
    s = addCastMember(s, 'Villain', 'deuteragonist')
    const id1 = s.cast[0].id, id2 = s.cast[1].id
    s = registerInteraction(s, id1, id2, 'conflict', 80)
    expect(s.interactions.length).toBe(1)
    expect(s.interactions[0].relationshipType).toBe('conflict')
  })

  it('should increment scene count for duplicate', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist')
    s = addCastMember(s, 'Friend', 'supporting')
    const id1 = s.cast[0].id, id2 = s.cast[1].id
    s = registerInteraction(s, id1, id2, 'alliance', 40)
    s = registerInteraction(s, id1, id2, 'alliance', 50)
    expect(s.interactions[0].sceneCount).toBe(2)
  })
})

describe('updateScreenTime', () => {
  it('should update screen time', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist')
    const charId = s.cast[0].id
    s = updateScreenTime(s, charId, 20)
    expect(s.cast[0].screenTime).toBe(20)
  })
})

describe('generateEnsembleReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateEnsembleReport(s)
    expect(report.totalCast).toBe(0)
    expect(report.castBalance).toBe(0)
  })

  it('should analyze cast balance', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist', 90)
    s = addCastMember(s, 'Friend', 'supporting', 50)
    s = updateScreenTime(s, s.cast[0].id, 100)
    s = updateScreenTime(s, s.cast[1].id, 80)
    const report = generateEnsembleReport(s)
    expect(report.totalCast).toBe(2)
    expect(report.mainCastSize).toBe(1)
  })

  it('should count roles', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero', 'protagonist')
    s = addCastMember(s, 'Friend', 'supporting')
    s = addCastMember(s, 'Extra', 'minor')
    const report = generateEnsembleReport(s)
    expect(report.characterRoles['protagonist']).toBe(1)
    expect(report.characterRoles['minor']).toBe(1)
  })
})

describe('getCharacterInteractions', () => {
  it('should return character interactions', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'A', 'protagonist')
    s = addCastMember(s, 'B', 'supporting')
    s = addCastMember(s, 'C', 'minor')
    const idA = s.cast[0].id, idB = s.cast[1].id, idC = s.cast[2].id
    s = registerInteraction(s, idA, idB, 'alliance')
    s = registerInteraction(s, idA, idC, 'neutral')
    const interactions = getCharacterInteractions(s, idA)
    expect(interactions.length).toBe(2)
  })
})

describe('getCharacterByRole', () => {
  it('should return characters by role', () => {
    let s = createEmptyState()
    s = addCastMember(s, 'Hero1', 'protagonist')
    s = addCastMember(s, 'Hero2', 'protagonist')
    s = addCastMember(s, 'Villain', 'deuteragonist')
    const protagonists = getCharacterByRole(s, 'protagonist')
    expect(protagonists.length).toBe(2)
  })
})
