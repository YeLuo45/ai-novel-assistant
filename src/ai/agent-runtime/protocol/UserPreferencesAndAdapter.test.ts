/**
 * protocol/UserPreferencesAndAdapter.test.ts (V2426-V2440) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  UserPreferenceStore,
  filterPreferences,
  mergePreferences,
  injectPreferences,
  snapshotUserContext,
  diffUserContext,
  mergeUserContexts,
  UserContextCache,
  upgradeContext,
  adaptExternalUser,
  validateUserContext,
  DEFAULT_CONTEXT_SCHEMA,
  validateAgainstSchema,
  migrateContext,
  exportUserContext,
  importUserContext,
  type UserPreference,
  type UserContext,
} from './UserPreferencesAndAdapter'

const sampleUser: UserContext = {
  userId: 'u1',
  penName: '青木',
  realName: '李雷',
  email: 'lilei@example.com',
  voiceProfile: { formality: 0.7 },
  plotOutline: { act1: '...' },
  preferences: { genre: 'scifi' },
}

describe('UserPreferenceStore', () => {
  it('set + get', () => {
    const s = new UserPreferenceStore()
    const p: UserPreference = { key: 'genre', value: 'scifi', category: 'meta', scope: 'global', updatedAt: 0 }
    s.set(p)
    expect(s.get('genre')?.value).toBe('scifi')
  })

  it('delete', () => {
    const s = new UserPreferenceStore()
    s.set({ key: 'x', value: 1, category: 'meta', scope: 'global', updatedAt: 0 })
    expect(s.delete('x')).toBe(true)
  })

  it('byCategory', () => {
    const s = new UserPreferenceStore()
    s.set({ key: 'a', value: 1, category: 'style', scope: 'global', updatedAt: 0 })
    s.set({ key: 'b', value: 1, category: 'plot', scope: 'global', updatedAt: 0 })
    expect(s.byCategory('style').length).toBe(1)
  })

  it('clear', () => {
    const s = new UserPreferenceStore()
    s.set({ key: 'a', value: 1, category: 'meta', scope: 'global', updatedAt: 0 })
    s.clear()
    expect(s.count()).toBe(0)
  })
})

describe('filterPreferences + mergePreferences', () => {
  const prefs: UserPreference[] = [
    { key: 'a', value: 1, category: 'style', scope: 'global', updatedAt: 0 },
    { key: 'b', value: 1, category: 'plot', scope: 'project', updatedAt: 0 },
  ]

  it('filter by category', () => {
    expect(filterPreferences(prefs, { categories: ['style'] }).length).toBe(1)
  })

  it('filter by scope', () => {
    expect(filterPreferences(prefs, { scopes: ['project'] }).length).toBe(1)
  })

  it('merge later wins', () => {
    const a = new UserPreferenceStore()
    const b = new UserPreferenceStore()
    a.set({ key: 'x', value: 1, category: 'meta', scope: 'global', updatedAt: 100 })
    b.set({ key: 'x', value: 2, category: 'meta', scope: 'global', updatedAt: 200 })
    const m = mergePreferences(a, b)
    expect(m.get('x')?.value).toBe(2)
  })
})

describe('injectPreferences', () => {
  it('injects values into context', () => {
    const s = new UserPreferenceStore()
    s.set({ key: 'genre', value: 'scifi', category: 'meta', scope: 'global', updatedAt: 0 })
    const u = injectPreferences(sampleUser, s, [{ field: 'genreChoice', sourceKey: 'genre' }])
    expect((u as Record<string, unknown>).genreChoice).toBe('scifi')
  })

  it('uses fallback when missing', () => {
    const u = injectPreferences(sampleUser, new UserPreferenceStore(), [
      { field: 'missing', sourceKey: 'not-here', fallback: 'default' },
    ])
    expect((u as Record<string, unknown>).missing).toBe('default')
  })
})

describe('snapshotUserContext + diffUserContext', () => {
  it('snapshot captures all', () => {
    const s = new UserPreferenceStore()
    s.set({ key: 'a', value: 1, category: 'meta', scope: 'global', updatedAt: 0 })
    const snap = snapshotUserContext(sampleUser, s)
    expect(snap.preferences.length).toBe(1)
    expect(snap.userId).toBe('u1')
  })

  it('diff: added', () => {
    const d = diffUserContext({ userId: 'a' }, { userId: 'a', penName: 'X' })
    expect(d.added).toContain('penName')
  })

  it('diff: removed', () => {
    const d = diffUserContext({ userId: 'a', penName: 'X' }, { userId: 'a' })
    expect(d.removed).toContain('penName')
  })

  it('diff: changed', () => {
    const d = diffUserContext({ userId: 'a', penName: 'X' }, { userId: 'a', penName: 'Y' })
    expect(d.changed).toContain('penName')
  })
})

describe('mergeUserContexts', () => {
  it('override strategy', () => {
    const r = mergeUserContexts({ userId: 'a', penName: 'X' }, { userId: 'a', penName: 'Y' }, 'override')
    expect(r.penName).toBe('Y')
  })

  it('merge strategy', () => {
    const r = mergeUserContexts({ userId: 'a', penName: 'X' }, { userId: 'a', penName: 'Y' }, 'merge')
    expect(r.penName).toBe('X')
  })
})

describe('UserContextCache', () => {
  it('set + get', () => {
    const c = new UserContextCache()
    c.set('u1', sampleUser, 1000)
    expect(c.get('u1')?.userId).toBe('u1')
  })

  it('expired = undefined', () => {
    const c = new UserContextCache()
    c.set('u1', sampleUser, -1)
    expect(c.get('u1')).toBeUndefined()
  })

  it('invalidate', () => {
    const c = new UserContextCache()
    c.set('u1', sampleUser, 1000)
    expect(c.invalidate('u1')).toBe(true)
    expect(c.get('u1')).toBeUndefined()
  })
})

describe('upgradeContext', () => {
  it('bumps version', () => {
    const v = upgradeContext({ version: 1, context: sampleUser }, 2)
    expect(v.version).toBe(2)
    expect(v.fromVersion).toBe(1)
  })
})

describe('adaptExternalUser', () => {
  it('adapts snake_case to camelCase', () => {
    const r = adaptExternalUser({ id: 'u1', real_name: 'X', pen_name: 'Y' })
    expect(r.userId).toBe('u1')
    expect(r.realName).toBe('X')
    expect(r.penName).toBe('Y')
  })
})

describe('validateUserContext', () => {
  it('detects missing userId', () => {
    const issues = validateUserContext({ userId: '' })
    expect(issues.some(i => i.field === 'userId')).toBe(true)
  })

  it('warns on bad email', () => {
    const issues = validateUserContext({ userId: 'u', email: 'bad' })
    expect(issues.some(i => i.field === 'email' && i.severity === 'warning')).toBe(true)
  })

  it('error on bad privacyLevel', () => {
    const issues = validateUserContext({ userId: 'u', privacyLevel: 'unknown' as 'public' })
    expect(issues.some(i => i.field === 'privacyLevel' && i.severity === 'error')).toBe(true)
  })
})

describe('validateAgainstSchema', () => {
  it('passes for valid', () => {
    const issues = validateAgainstSchema(sampleUser, DEFAULT_CONTEXT_SCHEMA)
    expect(issues.length).toBe(0)
  })

  it('error for missing required', () => {
    const issues = validateAgainstSchema({} as UserContext, DEFAULT_CONTEXT_SCHEMA)
    expect(issues.some(i => i.field === 'userId')).toBe(true)
  })

  it('error for type mismatch', () => {
    const issues = validateAgainstSchema({ userId: 123 } as unknown as UserContext, DEFAULT_CONTEXT_SCHEMA)
    expect(issues.some(i => i.field === 'userId')).toBe(true)
  })
})

describe('migrateContext', () => {
  it('migrates v1 to v2 with privacyLevel', () => {
    const r = migrateContext({ userId: 'u' } as UserContext & { version?: number })
    expect((r as Record<string, unknown>).privacyLevel).toBe('private')
  })
})

describe('exportUserContext / importUserContext', () => {
  it('roundtrip', () => {
    const json = exportUserContext(sampleUser)
    const back = importUserContext(json)
    expect(back.userId).toBe('u1')
  })

  it('import invalid falls back to adapt', () => {
    const back = importUserContext('{"foo": "bar"}') // valid JSON but not a user context
    expect(typeof back.userId).toBe('string')
  })
})
