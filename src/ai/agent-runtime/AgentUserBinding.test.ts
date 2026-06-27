/**
 * AgentUserBinding.test.ts (V2328) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  createUserBinding,
  projectUserContext,
  aliasUser,
  buildSystemPromptFragment,
  validateBinding,
  deriveBinding,
} from './AgentUserBinding'

const sampleUser = {
  name: '李雷',
  penName: '青木',
  age: 28,
  email: 'lilei@example.com',
  voiceProfile: { formality: 0.7, warmth: 0.5 },
  plotOutline: { act1: '...', act2: '...', act3: '...' },
  preferences: { genre: 'scifi' },
}

describe('AgentUserBinding — createUserBinding', () => {
  it('creates a valid binding with defaults', () => {
    const b = createUserBinding({ agentId: 'a1' })
    expect(b.agentId).toBe('a1')
    expect(b.visibleUserFields).toEqual([])
    expect(b.userAlias).toContain('a1')
    expect(b.customInstructions).toBe('')
    expect(b.baseContext).toEqual({})
  })

  it('returns frozen object', () => {
    const b = createUserBinding({ agentId: 'a1' })
    expect(Object.isFrozen(b)).toBe(true)
  })

  it('dedupes array copy of visibleUserFields', () => {
    const b = createUserBinding({ agentId: 'a1', visibleUserFields: ['a', 'b', 'a'] })
    expect(b.visibleUserFields).toEqual(['a', 'b'])
  })
})

describe('AgentUserBinding — projectUserContext', () => {
  const b = createUserBinding({
    agentId: 'plot-1',
    visibleUserFields: ['penName', 'plotOutline', 'voiceProfile'],
    userAlias: 'user-plot-1',
  })

  it('returns only visible fields', () => {
    const slice = projectUserContext(b, sampleUser)
    expect(slice.fields.penName).toBe('青木')
    expect(slice.fields.plotOutline).toBeDefined()
    expect(slice.fields.voiceProfile).toBeDefined()
    expect((slice.fields as Record<string, unknown>).email).toBeUndefined()
  })

  it('reports missing fields', () => {
    const b2 = createUserBinding({
      agentId: 'a',
      visibleUserFields: ['penName', 'nonexistentField'],
    })
    const slice = projectUserContext(b2, sampleUser)
    expect(slice.missingFields).toEqual(['nonexistentField'])
  })

  it('uses custom alias', () => {
    const slice = projectUserContext(b, sampleUser)
    expect(slice.alias).toBe('user-plot-1')
  })

  it('injects baseContext', () => {
    const b2 = createUserBinding({
      agentId: 'a',
      visibleUserFields: ['penName'],
      baseContext: { appVersion: '3.0.0' },
    })
    const slice = projectUserContext(b2, sampleUser)
    expect((slice.fields as Record<string, unknown>).appVersion).toBe('3.0.0')
    expect(slice.fields.penName).toBe('青木')
  })
})

describe('AgentUserBinding — aliasUser', () => {
  const b = createUserBinding({
    agentId: 'a',
    userAlias: 'USER-ALIAS',
  })

  it('replaces real name with alias in English text', () => {
    const out = aliasUser(b, 'Hello LiLei, your task is ready.', { name: 'LiLei' })
    expect(out).toContain('USER-ALIAS')
    expect(out).not.toContain('LiLei')
  })

  it('replaces real name with alias in Chinese text', () => {
    const out = aliasUser(b, '李雷你好，今天要写科幻。', { name: '李雷' })
    expect(out).toContain('USER-ALIAS')
    expect(out).not.toContain('李雷')
  })

  it('replaces penName if present', () => {
    const out = aliasUser(b, '青木 wrote this chapter', { penName: '青木' })
    expect(out).toContain('USER-ALIAS')
  })

  it('does not affect text without name match', () => {
    const text = 'The chapter discusses plot structure.'
    expect(aliasUser(b, text, { name: 'XYZ' })).toBe(text)
  })

  it('handles missing name gracefully', () => {
    expect(aliasUser(b, 'Hello', {})).toBe('Hello')
  })
})

describe('AgentUserBinding — buildSystemPromptFragment', () => {
  it('includes alias', () => {
    const b = createUserBinding({ agentId: 'a', userAlias: 'X' })
    const f = buildSystemPromptFragment(b, {}, {})
    expect(f).toContain('X')
    expect(f).toContain('alias')
  })

  it('includes customInstructions', () => {
    const b = createUserBinding({ agentId: 'a', customInstructions: 'be brief' })
    const f = buildSystemPromptFragment(b, {}, {})
    expect(f).toContain('be brief')
  })

  it('includes projected fields as YAML-like list', () => {
    const b = createUserBinding({ agentId: 'a' })
    const f = buildSystemPromptFragment(b, { foo: 'bar', n: 42 }, {})
    expect(f).toContain('foo: bar')
    expect(f).toContain('n: 42')
  })

  it('truncates long string values', () => {
    const b = createUserBinding({ agentId: 'a' })
    const long = 'x'.repeat(200)
    const f = buildSystemPromptFragment(b, { l: long }, {})
    expect(f).toContain('...')
  })
})

describe('AgentUserBinding — validateBinding', () => {
  it('accepts valid binding with no issues', () => {
    const b = createUserBinding({
      agentId: 'a',
      visibleUserFields: ['penName'],
      userAlias: 'X',
    })
    const r = validateBinding(b, sampleUser)
    expect(r.valid).toBe(true)
    expect(r.warnings).toEqual([])
  })

  it('warns on missing visibleUserField', () => {
    const b = createUserBinding({
      agentId: 'a',
      visibleUserFields: ['nonexistentField'],
    })
    const r = validateBinding(b, sampleUser)
    expect(r.warnings.some(w => w.includes('nonexistentField'))).toBe(true)
  })

  it('warns on empty alias', () => {
    const b = createUserBinding({ agentId: 'a' })
    // 强制清空 alias（绕过 freeze 是不行的；改用 empty alias 直接构造）
    const b2 = { ...b, userAlias: '' }
    const r = validateBinding(b2, sampleUser)
    expect(r.warnings.some(w => w.includes('privacy'))).toBe(true)
  })

  it('errors on empty agentId', () => {
    const b = createUserBinding({ agentId: 'a' })
    const b2 = { ...b, agentId: '' }
    const r = validateBinding(b2, sampleUser)
    expect(r.valid).toBe(false)
  })
})

describe('AgentUserBinding — deriveBinding', () => {
  it('preserves agentId', () => {
    const parent = createUserBinding({ agentId: 'a1', visibleUserFields: ['x'] })
    const child = deriveBinding(parent, { visibleUserFields: ['y'] })
    expect(child.agentId).toBe('a1')
    expect(child.visibleUserFields).toEqual(['y'])
  })
})
