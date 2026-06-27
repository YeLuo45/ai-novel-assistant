/**
 * protocol/SoulVersioning.test.ts (V2456-V2460) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  parseSoulVersion, formatSoulVersion, compareVersions,
  SoulChangelog, SoulDeprecationRegistry, SoulMigrator, checkCompatibility,
} from './SoulVersioning'
import type { SoulTemplate } from '../types'

const T: SoulTemplate = {
  templateId: 't1', displayName: 'T', archetype: 'specialist',
  basePersona: {
    displayName: 'T', tagline: 'p', principles: [],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['plot', 'style'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'd',
}

describe('parseSoulVersion / formatSoulVersion / compareVersions', () => {
  it('parses semver', () => {
    const v = parseSoulVersion('1.2.3')
    expect(v.major).toBe(1)
    expect(v.minor).toBe(2)
    expect(v.patch).toBe(3)
  })

  it('parses pre-release', () => {
    const v = parseSoulVersion('2.0.0-alpha')
    expect(v.preRelease).toBe('alpha')
  })

  it('throws on invalid', () => {
    expect(() => parseSoulVersion('bad')).toThrow()
  })

  it('formats', () => {
    expect(formatSoulVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3')
    expect(formatSoulVersion({ major: 1, minor: 2, patch: 3, preRelease: 'beta' })).toBe('1.2.3-beta')
  })

  it('compare: major', () => {
    expect(compareVersions({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 9, patch: 9 })).toBeGreaterThan(0)
  })

  it('compare: equal', () => {
    expect(compareVersions({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 })).toBe(0)
  })

  it('compare: minor', () => {
    expect(compareVersions({ major: 1, minor: 2, patch: 0 }, { major: 1, minor: 1, patch: 9 })).toBeGreaterThan(0)
  })

  it('compare: patch', () => {
    expect(compareVersions({ major: 1, minor: 0, patch: 1 }, { major: 1, minor: 0, patch: 0 })).toBeGreaterThan(0)
  })
})

describe('SoulChangelog', () => {
  it('add + latest', () => {
    const cl = new SoulChangelog()
    cl.add({ version: '1.0.0', date: 100, changes: ['init'] })
    cl.add({ version: '1.1.0', date: 200, changes: ['add feature'] })
    expect(cl.latest()?.version).toBe('1.1.0')
  })

  it('all', () => {
    const cl = new SoulChangelog()
    cl.add({ version: '1.0.0', date: 100, changes: [] })
    expect(cl.all().length).toBe(1)
  })

  it('forVersion', () => {
    const cl = new SoulChangelog()
    cl.add({ version: '1.0.0', date: 100, changes: [] })
    expect(cl.forVersion('1.0.0')?.date).toBe(100)
    expect(cl.forVersion('9.9.9')).toBeUndefined()
  })
})

describe('SoulDeprecationRegistry', () => {
  it('deprecate + isDeprecated', () => {
    const r = new SoulDeprecationRegistry()
    r.deprecate('t1', 'replaced by t2')
    expect(r.isDeprecated('t1')).toBe(true)
  })

  it('noticeFor', () => {
    const r = new SoulDeprecationRegistry()
    r.deprecate('t1', 'old', { replacementId: 't2' })
    expect(r.noticeFor('t1')?.replacementId).toBe('t2')
  })

  it('active filters out sunset', () => {
    const r = new SoulDeprecationRegistry()
    r.deprecate('t1', 'old', { sunsetAt: Date.now() - 1000 })
    expect(r.active().length).toBe(0)
  })

  it('all returns all', () => {
    const r = new SoulDeprecationRegistry()
    r.deprecate('t1', 'a')
    r.deprecate('t2', 'b')
    expect(r.all().length).toBe(2)
  })
})

describe('SoulMigrator', () => {
  it('migrates v1 -> v2', () => {
    const m = new SoulMigrator()
    m.add({
      fromVersion: '1.0.0', toVersion: '2.0.0', description: 'add arch',
      migrate: (t) => ({ ...t, archetype: 'instructor' }),
    })
    const result = m.migrate(T, '2.0.0')
    expect(result.archetype).toBe('instructor')
  })

  it('migrates multi-step', () => {
    const m = new SoulMigrator()
    m.add({ fromVersion: '1.0.0', toVersion: '1.1.0', description: 's1', migrate: (t) => t })
    m.add({ fromVersion: '1.1.0', toVersion: '2.0.0', description: 's2', migrate: (t) => ({ ...t, displayName: 'migrated' }) })
    const result = m.migrate(T, '2.0.0')
    expect(result.displayName).toBe('migrated')
  })

  it('no-op when at target', () => {
    const m = new SoulMigrator()
    const r = m.migrate(T, '1.0.0')
    expect(r).toBe(T)
  })

  it('availableMigrations', () => {
    const m = new SoulMigrator()
    m.add({ fromVersion: '1.0.0', toVersion: '2.0.0', description: 'x', migrate: (t) => t })
    expect(m.availableMigrations().length).toBe(1)
  })
})

describe('checkCompatibility', () => {
  it('compatible', () => {
    const r = checkCompatibility(T, ['plot', 'style'])
    expect(r.compatible).toBe(true)
  })

  it('missing capability', () => {
    const r = checkCompatibility(T, ['plot', 'hook'])
    expect(r.compatible).toBe(false)
    expect(r.issues[0]).toContain('hook')
  })

  it('archetype mismatch', () => {
    const r = checkCompatibility(T, ['plot'], ['critic'])
    expect(r.compatible).toBe(false)
  })

  it('archetype match', () => {
    const r = checkCompatibility(T, ['plot'], ['specialist'])
    expect(r.compatible).toBe(true)
  })
})
