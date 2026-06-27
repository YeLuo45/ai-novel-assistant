/**
 * index.test.ts (V2330) — 验证 public API 一致性
 *
 * 验证：所有 export 都能从 index 拿到；类型一致
 */

import { describe, it, expect } from 'vitest'
import * as API from './index'

describe('AgentRuntime index — public API', () => {
  it('exports AGENT_RUNTIME_VERSION', () => {
    expect(API.AGENT_RUNTIME_VERSION).toMatch(/^3\./)
  })

  it('exports ALL_ARCHETYPES (6)', () => {
    expect(API.ALL_ARCHETYPES.length).toBe(6)
  })

  it('exports ALL_CAPABILITY_TAGS (18)', () => {
    expect(API.ALL_CAPABILITY_TAGS.length).toBe(18)
  })

  it('exports Soul factory', () => {
    expect(typeof API.createSoul).toBe('function')
    expect(typeof API.cloneSoul).toBe('function')
    expect(typeof API.deriveSoul).toBe('function')
    expect(typeof API.mergeSouls).toBe('function')
    expect(typeof API.fromTemplate).toBe('function')
    expect(typeof API.diffSouls).toBe('function')
    expect(typeof API.checkSoul).toBe('function')
    expect(typeof API.bumpVersion).toBe('function')
  })

  it('exports User Binding factory', () => {
    expect(typeof API.createUserBinding).toBe('function')
    expect(typeof API.projectUserContext).toBe('function')
    expect(typeof API.aliasUser).toBe('function')
    expect(typeof API.buildSystemPromptFragment).toBe('function')
    expect(typeof API.validateBinding).toBe('function')
    expect(typeof API.deriveBinding).toBe('function')
  })

  it('exports Memory Scope factory + ACL', () => {
    expect(typeof API.createMemoryScope).toBe('function')
    expect(typeof API.canRead).toBe('function')
    expect(typeof API.canWrite).toBe('function')
    expect(typeof API.recordAccess).toBe('function')
    expect(typeof API.getAccessLog).toBe('function')
    expect(typeof API.trimAccessLog).toBe('function')
    expect(typeof API.checkEpisodicExpiry).toBe('function')
    expect(typeof API.checkWorkingCapacity).toBe('function')
    expect(typeof API.deriveMemoryScope).toBe('function')
  })

  it('exports utility functions', () => {
    expect(typeof API.clamp01).toBe('function')
    expect(typeof API.normalizeTone).toBe('function')
    expect(typeof API.normalizeDecisionPolicy).toBe('function')
    expect(typeof API.validateSoul).toBe('function')
  })

  it('exports preset inputs', () => {
    expect(API.NEUTRAL_ASSISTANT_INPUT.archetype).toBe('assistant')
    expect(API.CRITICAL_CRITIC_INPUT.archetype).toBe('critic')
  })
})

describe('AgentRuntime index — end-to-end smoke', () => {
  it('can create a soul + binding + scope, all immutable', () => {
    const soul = API.createSoul({
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'Test',
      capabilities: ['plot'],
    })
    const binding = API.createUserBinding({ agentId: 'a1' })
    const scope = API.createMemoryScope({ agentId: 'a1' })
    expect(Object.isFrozen(soul)).toBe(true)
    expect(Object.isFrozen(binding)).toBe(true)
    expect(scope.accessLog).toEqual([])
  })

  it('can project user context and check ACL', () => {
    const soul = API.createSoul({
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'Test',
      capabilities: ['plot'],
      memoryReadScope: 'team',
    })
    const binding = API.createUserBinding({
      agentId: 'a1',
      visibleUserFields: ['penName'],
      userAlias: 'X',
    })
    const slice = API.projectUserContext(binding, { penName: '青木' })
    expect(slice.alias).toBe('X')
    expect((slice.fields as Record<string, unknown>).penName).toBe('青木')
    const acl = API.canRead(soul.memoryReadScope, 'a1', 'a2', 'L3', false)
    expect(acl.allowed).toBe(true)
  })
})
