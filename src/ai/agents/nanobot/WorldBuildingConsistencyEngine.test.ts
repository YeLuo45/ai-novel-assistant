import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addRule,
  addLore,
  addTimelineEvent,
  verifyLoreConsistency,
  checkRuleViolation,
  generateConsistencyReport,
  getRuleSummary,
  compareEraConsistency,
} from './WorldBuildingConsistencyEngine'

describe('createEmptyState', () => {
  it('should create empty world building state', () => {
    const s = createEmptyState()
    expect(s.rules).toEqual({})
    expect(s.lore).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('addRule', () => {
  it('should add a world rule', () => {
    let s = createEmptyState()
    s = addRule(s, 'Magic Burns', 'Magic always has a cost', 'magic', ['spellcasting', 'wizards'], 'strict')
    const ruleKey = Object.keys(s.rules)[0]
    expect(s.rules[ruleKey].name).toBe('Magic Burns')
    expect(s.rules[ruleKey].violationCount).toBe(0)
  })

  it('should set flexibility', () => {
    let s = createEmptyState()
    s = addRule(s, 'Gravity Works', 'Gravity applies to all', 'physical', ['movement'], 'strict')
    s = addRule(s, 'Heroes Win', 'Heroes always prevail', 'social', ['battles'], 'flexible')
    expect(s.rules['rule_gravity_works'].flexibility).toBe('strict')
  })
})

describe('addLore', () => {
  it('should add lore entry', () => {
    let s = createEmptyState()
    s = addLore(s, 'The Great War', 'A war that shaped the world', 'ch5', ['rule_great_war'])
    const loreKey = Object.keys(s.lore)[0]
    expect(s.lore[loreKey].name).toBe('The Great War')
    expect(s.lore[loreKey].consistencyStatus).toBe('pending')
  })
})

describe('addTimelineEvent', () => {
  it('should add timeline event', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 1000, 'Age of Heroes', 'The kingdom was founded')
    expect(s.timeline.length).toBe(1)
    expect(s.timeline[0].year).toBe(1000)
  })

  it('should sort timeline by year', () => {
    let s = createEmptyState()
    s = addTimelineEvent(s, 1000, 'Age of Heroes', 'Event A')
    s = addTimelineEvent(s, 500, 'Age of Darkness', 'Event B')
    s = addTimelineEvent(s, 1500, 'Age of Peace', 'Event C')
    expect(s.timeline[0].year).toBe(500)
    expect(s.timeline[1].year).toBe(1000)
    expect(s.timeline[2].year).toBe(1500)
  })
})

describe('verifyLoreConsistency', () => {
  it('should verify lore against rules', () => {
    let s = createEmptyState()
    s = addRule(s, 'Magic Burns', 'Magic has cost', 'magic', ['spells'], 'strict')
    s = addLore(s, 'Wizard Story', 'A wizard cast a spell', 'ch1', ['rule_magic_burns'])
    const loreKey = Object.keys(s.lore)[0]
    s = verifyLoreConsistency(s, loreKey)
    expect(s.lore[loreKey].consistencyStatus).toBe('verified')
  })
})

describe('checkRuleViolation', () => {
  it('should increment violation count', () => {
    let s = createEmptyState()
    s = addRule(s, 'No Flying', 'Humans cannot fly', 'physical', ['travel'])
    const ruleKey = Object.keys(s.rules)[0]
    s = checkRuleViolation(s, ruleKey, 'Character flew over wall')
    expect(s.rules[ruleKey].violationCount).toBe(1)
    s = checkRuleViolation(s, ruleKey, 'Another violation')
    expect(s.rules[ruleKey].violationCount).toBe(2)
  })

  it('should not count violations for breakable rules', () => {
    let s = createEmptyState()
    s = addRule(s, 'Heroes Win', 'Heroes always win', 'social', ['battles'], 'breakable')
    const ruleKey = Object.keys(s.rules)[0]
    s = checkRuleViolation(s, ruleKey, 'Hero lost')
    expect(s.rules[ruleKey].violationCount).toBe(0)
  })
})

describe('generateConsistencyReport', () => {
  it('should generate empty report', () => {
    const s = createEmptyState()
    const report = generateConsistencyReport(s)
    expect(report.totalRules).toBe(0)
    expect(report.overallCoherence).toBe(100)
  })

  it('should calculate coherence with violations', () => {
    let s = createEmptyState()
    s = addRule(s, 'Rule 1', 'A rule', 'physical', ['test'])
    const ruleKey = Object.keys(s.rules)[0]
    s = checkRuleViolation(s, ruleKey, 'violation')
    const report = generateConsistencyReport(s)
    expect(report.violatedRules).toBe(1)
    expect(report.overallCoherence).toBeLessThan(100)
  })
})

describe('getRuleSummary', () => {
  it('should return null for unknown rule', () => {
    const s = createEmptyState()
    expect(getRuleSummary(s, 'unknown')).toBeNull()
  })

  it('should return rule', () => {
    let s = createEmptyState()
    s = addRule(s, 'Magic Rule', 'Magic exists', 'magic', ['spells'])
    const ruleKey = Object.keys(s.rules)[0]
    const summary = getRuleSummary(s, ruleKey)
    expect(summary).not.toBeNull()
    expect(summary!.name).toBe('Magic Rule')
  })
})

describe('compareEraConsistency', () => {
  it('should compare eras', () => {
    let s = createEmptyState()
    s = addRule(s, 'Rule A', 'Rule for era1', 'physical', ['era1_region'], 'strict')
    const ruleKey = Object.keys(s.rules)[0]
    s = checkRuleViolation(s, ruleKey, 'violation')
    const result = compareEraConsistency(s, 'era1', 'era2')
    expect(result).toBeDefined()
  })
})
