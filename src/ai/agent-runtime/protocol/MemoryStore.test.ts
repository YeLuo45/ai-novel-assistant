/**
 * protocol/MemoryStore.test.ts (V2386-V2390) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  AgentMemoryStore,
  MemoryIndexer,
  compactMemory,
  layerToScope,
  type MemoryEntry,
  type MemoryLayer,
} from './MemoryStore'
import { createMemoryScope } from '../AgentMemoryScope'

const makeEntry = (overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id: `m_${Math.random().toString(36).slice(2, 8)}`,
  agentId: 'a1',
  level: 'L1',
  content: 'test content',
  tags: ['test'],
  createdAt: Date.now(),
  lastAccessed: Date.now(),
  accessCount: 0,
  importance: 50,
  metadata: {},
  ...overrides,
})

describe('MemoryStore — basic CRUD', () => {
  it('add + get', () => {
    const s = new AgentMemoryStore()
    const e = makeEntry()
    s.add(e)
    expect(s.get(e.id)?.id).toBe(e.id)
  })

  it('get increments access count', () => {
    const s = new AgentMemoryStore()
    const e = makeEntry()
    s.add(e)
    s.get(e.id)
    expect(s.get(e.id)?.accessCount).toBe(2) // 2 gets: 1 + 1 = 2
  })

  it('delete removes', () => {
    const s = new AgentMemoryStore()
    const e = makeEntry()
    s.add(e)
    expect(s.delete(e.id)).toBe(true)
    expect(s.count()).toBe(0)
  })

  it('delete unknown returns false', () => {
    const s = new AgentMemoryStore()
    expect(s.delete('unknown')).toBe(false)
  })

  it('all returns all entries', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry())
    s.add(makeEntry())
    expect(s.all().length).toBe(2)
  })
})

describe('MemoryStore — index queries', () => {
  it('byAgent', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ agentId: 'a1' }))
    s.add(makeEntry({ agentId: 'a2' }))
    expect(s.byAgent('a1').length).toBe(1)
  })

  it('byLayer (L1 = working)', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ level: 'L1' }))
    s.add(makeEntry({ level: 'L2' }))
    expect(s.byLayer('working').length).toBe(1)
  })

  it('byTag', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ tags: ['a', 'b'] }))
    s.add(makeEntry({ tags: ['b'] }))
    expect(s.byTag('a').length).toBe(1)
  })
})

describe('layerToScope', () => {
  it('sensory = L0 private', () => {
    expect(layerToScope('sensory').level).toBe('L0')
    expect(layerToScope('sensory').isPrivate).toBe(true)
  })

  it('working = L1 private', () => {
    expect(layerToScope('working').level).toBe('L1')
  })

  it('episodic = L2 private', () => {
    expect(layerToScope('episodic').level).toBe('L2')
  })

  it('project = L3 shared', () => {
    expect(layerToScope('project').level).toBe('L3')
    expect(layerToScope('project').isPrivate).toBe(false)
  })

  it('team = L4 shared', () => {
    expect(layerToScope('team').level).toBe('L4')
    expect(layerToScope('team').isPrivate).toBe(false)
  })
})

describe('MemoryIndexer', () => {
  it('query by agentId', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ agentId: 'a1' }))
    s.add(makeEntry({ agentId: 'a2' }))
    const idx = new MemoryIndexer(s)
    expect(idx.query({ agentId: 'a1' }).length).toBe(1)
  })

  it('query by tags (AND)', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ tags: ['a', 'b'] }))
    s.add(makeEntry({ tags: ['b'] }))
    const idx = new MemoryIndexer(s)
    expect(idx.query({ tags: ['a', 'b'] }).length).toBe(1)
  })

  it('query by minImportance', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ importance: 10 }))
    s.add(makeEntry({ importance: 80 }))
    const idx = new MemoryIndexer(s)
    expect(idx.query({ minImportance: 50 }).length).toBe(1)
  })

  it('query with limit', () => {
    const s = new AgentMemoryStore()
    for (let i = 0; i < 10; i++) s.add(makeEntry())
    const idx = new MemoryIndexer(s)
    expect(idx.query({ limit: 3 }).length).toBe(3)
  })

  it('query sorted by importance desc', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ importance: 10 }))
    s.add(makeEntry({ importance: 90 }))
    s.add(makeEntry({ importance: 50 }))
    const idx = new MemoryIndexer(s)
    const r = idx.query({})
    expect(r[0].importance).toBe(90)
  })

  it('countByLayer', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ level: 'L0' }))
    s.add(makeEntry({ level: 'L0' }))
    s.add(makeEntry({ level: 'L1' }))
    const idx = new MemoryIndexer(s)
    const c = idx.countByLayer()
    expect(c.get('sensory')).toBe(2)
    expect(c.get('working')).toBe(1)
  })
})

describe('compactMemory', () => {
  it('removes low importance', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ importance: 10 }))
    s.add(makeEntry({ importance: 90 }))
    const r = compactMemory(s, { minImportance: 50 })
    expect(r.removed).toBe(1)
    expect(s.count()).toBe(1)
  })

  it('removes old entries', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ createdAt: Date.now() - 10000 }))
    s.add(makeEntry({ createdAt: Date.now() }))
    const r = compactMemory(s, { olderThanMs: 5000 })
    expect(r.removed).toBe(1)
  })

  it('no-op when no entries match', () => {
    const s = new AgentMemoryStore()
    s.add(makeEntry({ importance: 100 }))
    const r = compactMemory(s, { minImportance: 50 })
    expect(r.removed).toBe(0)
  })
})

describe('AgentMemoryStore — static helpers', () => {
  it('tableForScope returns string', () => {
    const scope = createMemoryScope({ agentId: 'a1' })
    const t = AgentMemoryStore.tableForScope(scope, 'sensory')
    expect(typeof t).toBe('string')
    expect(t.length).toBeGreaterThan(0)
  })
})
