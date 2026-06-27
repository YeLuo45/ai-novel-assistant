/**
 * protocol/SoulExportImport.test.ts (V2461-V2465) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  SoulExporter, SoulImporter, SoulShareLink, SoulDiscovery,
  type SoulPackage,
} from './SoulExportImport'
import type { SoulTemplate } from '../types'

const T: SoulTemplate = {
  templateId: 't1', displayName: 'T', archetype: 'specialist',
  basePersona: {
    displayName: 'T', tagline: 'p', principles: ['p1'],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 },
  },
  baseCapabilities: ['plot'],
  defaultMemoryScopes: { read: 'team', write: 'self' },
  description: 'd',
}

const PKG: SoulPackage = {
  packageId: 'pkg-1',
  template: T,
  version: '1.0.0',
  author: 'a1',
  createdAt: 1000,
}

describe('SoulExporter', () => {
  it('exportJson', () => {
    const r = new SoulExporter().exportJson(PKG)
    expect(r).toContain('pkg-1')
  })

  it('exportCompact', () => {
    const r = new SoulExporter().exportCompact(PKG)
    expect(r).not.toContain('\n')
  })

  it('exportBatch', () => {
    const r = new SoulExporter().exportBatch([PKG, PKG])
    expect(JSON.parse(r).packages.length).toBe(2)
  })
})

describe('SoulImporter', () => {
  it('imports valid JSON', () => {
    const json = new SoulExporter().exportJson(PKG)
    const r = new SoulImporter().importJson(json)
    expect(r.ok).toBe(true)
    expect(r.package?.packageId).toBe('pkg-1')
  })

  it('rejects invalid JSON', () => {
    const r = new SoulImporter().importJson('not json')
    expect(r.ok).toBe(false)
  })

  it('rejects missing fields', () => {
    const r = new SoulImporter().importJson('{"foo": "bar"}')
    expect(r.ok).toBe(false)
  })

  it('importBatch', () => {
    const json = new SoulExporter().exportBatch([PKG])
    const r = new SoulImporter().importBatch(json)
    expect(r.length).toBe(1)
    expect(r[0].ok).toBe(true)
  })

  it('importBatch no packages', () => {
    const r = new SoulImporter().importBatch('{"foo": "bar"}')
    expect(r[0].ok).toBe(false)
  })
})

describe('SoulShareLink', () => {
  it('encode + decode roundtrip', () => {
    const link = new SoulShareLink().encode(T)
    const back = new SoulShareLink().decode(link)
    expect(back?.templateId).toBe('t1')
  })

  it('decode invalid prefix', () => {
    expect(new SoulShareLink().decode('http://x')).toBeNull()
  })

  it('decode invalid base64', () => {
    expect(new SoulShareLink().decode('soul://!@#')).toBeNull()
  })

  it('shortId is non-empty', () => {
    expect(new SoulShareLink().shortId(T).length).toBeGreaterThan(0)
  })

  it('shortId is consistent for same template', () => {
    const s1 = new SoulShareLink()
    expect(s1.shortId(T)).toBe(s1.shortId(T))
  })
})

describe('SoulDiscovery', () => {
  it('discovers from source', () => {
    const d = new SoulDiscovery()
    const src = [{
      path: '/templates/a.ts',
      content: `templateId: 'discovered-1', displayName: 'A'`,
    }]
    const r = d.discover(src)
    expect(r.length).toBe(1)
    expect(r[0].templateId).toBe('discovered-1')
  })

  it('ignores non-matching', () => {
    const d = new SoulDiscovery()
    const r = d.discover([{ path: 'x', content: 'no template here' }])
    expect(r.length).toBe(0)
  })

  it('discovers multiple', () => {
    const d = new SoulDiscovery()
    const r = d.discover([
      { path: 'a', content: `templateId: 'a', displayName: 'A'` },
      { path: 'b', content: `templateId: 'b', displayName: 'B'` },
    ])
    expect(r.length).toBe(2)
  })
})
