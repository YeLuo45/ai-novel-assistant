/**
 * protocol/SoulMarketplace.test.ts (V2446-V2455) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  SoulTemplateRegistry,
  composeSoul,
  mergeSouls,
  SoulMarketplace,
  type SoulAuthor,
} from './SoulMarketplace'
import type { SoulTemplate } from '../types'

const T1: SoulTemplate = {
  templateId: 't1',
  displayName: 'T1',
  archetype: 'specialist',
  basePersona: {
    displayName: 'T1', tagline: 'p1', principles: ['p1'],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['plot'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'plot template',
}

const T2: SoulTemplate = {
  ...T1,
  templateId: 't2',
  displayName: 'T2',
  basePersona: { ...T1.basePersona, principles: ['p2'] },
  baseCapabilities: ['style'],
}

const AUTHOR: SoulAuthor = { authorId: 'a1', displayName: 'Author' }

describe('SoulTemplateRegistry', () => {
  it('register + get', () => {
    const r = new SoulTemplateRegistry()
    r.register(T1)
    expect(r.get('t1')?.templateId).toBe('t1')
  })

  it('all', () => {
    const r = new SoulTemplateRegistry()
    r.register(T1)
    r.register(T2)
    expect(r.all().length).toBe(2)
  })

  it('unregister', () => {
    const r = new SoulTemplateRegistry()
    r.register(T1)
    expect(r.unregister('t1')).toBe(true)
    expect(r.has('t1')).toBe(false)
  })

  it('count', () => {
    const r = new SoulTemplateRegistry()
    expect(r.count()).toBe(0)
    r.register(T1)
    expect(r.count()).toBe(1)
  })
})

describe('composeSoul + mergeSouls', () => {
  it('compose overrides fields', () => {
    const c = composeSoul(T1, { displayName: 'T1-custom' })
    expect(c.displayName).toBe('T1-custom')
    expect(c.templateId).not.toBe('t1') // derived id
  })

  it('compose preserves parent archetype', () => {
    const c = composeSoul(T1, { baseCapabilities: ['hook'] })
    expect(c.archetype).toBe('specialist')
    expect(c.baseCapabilities).toContain('hook')
  })

  it('mergeSouls unions capabilities', () => {
    const m = mergeSouls(T1, T2)
    expect(m.baseCapabilities).toContain('plot')
    expect(m.baseCapabilities).toContain('style')
  })

  it('mergeSouls throws on empty', () => {
    expect(() => mergeSouls()).toThrow()
  })
})

describe('SoulMarketplace', () => {
  let m: SoulMarketplace
  beforeEach(() => {
    m = new SoulMarketplace(new SoulTemplateRegistry())
    m.publish(T1, AUTHOR, { description: 'cool template', tags: ['plot', 'scifi'] })
  })

  it('publish + get', () => {
    expect(m.get('t1')?.template.displayName).toBe('T1')
  })

  it('list returns all', () => {
    expect(m.list().length).toBe(1)
  })

  it('search by name', () => {
    expect(m.search('T1').length).toBe(1)
  })

  it('search by tag', () => {
    expect(m.search('scifi').length).toBe(1)
  })

  it('search no match', () => {
    expect(m.search('xxx').length).toBe(0)
  })

  it('install + isInstalled', () => {
    expect(m.install('t1')).toBe(true)
    expect(m.isInstalled('t1')).toBe(true)
  })

  it('install nonexistent returns false', () => {
    expect(m.install('nope')).toBe(false)
  })

  it('install increments downloads', () => {
    m.install('t1')
    m.install('t1')
    expect(m.get('t1')?.downloads).toBe(2)
  })

  it('uninstall', () => {
    m.install('t1')
    expect(m.uninstall('t1')).toBe(true)
    expect(m.isInstalled('t1')).toBe(false)
  })

  it('installed list', () => {
    m.install('t1')
    expect(m.installed().length).toBe(1)
  })

  it('activate requires install', () => {
    expect(m.activate('t1')).toBe(false)
  })

  it('activate + deactivate', () => {
    m.install('t1')
    expect(m.activate('t1')).toBe(true)
    expect(m.isActive('t1')).toBe(true)
    expect(m.deactivate('t1')).toBe(true)
  })

  it('active list', () => {
    m.install('t1')
    m.activate('t1')
    expect(m.active().length).toBe(1)
  })

  it('rate updates average', () => {
    m.rate('t1', 'r1', 5)
    m.rate('t1', 'r2', 3)
    expect(m.ratingFor('t1')).toBe(4)
  })

  it('rate invalid stars returns false', () => {
    expect(m.rate('t1', 'r1', 6)).toBe(false)
  })

  it('rate nonexistent returns false', () => {
    expect(m.rate('nope', 'r', 3)).toBe(false)
  })

  it('ratingsFor', () => {
    m.rate('t1', 'r1', 5)
    expect(m.ratingsFor('t1').length).toBe(1)
  })

  it('registry access', () => {
    expect(m.registry().get('t1')).toBeDefined()
  })
})
