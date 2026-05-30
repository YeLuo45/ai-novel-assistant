import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addSubplot,
  connectSubplots,
  resolveSubplot,
  integrateSubplot,
  generateSubplotReport,
  getSubplotByType,
  getSubplotConnections,
  compareSubplotIntegration,
} from './SubplotWeaver'

describe('createEmptyState', () => {
  it('should create empty subplot state', () => {
    const s = createEmptyState()
    expect(s.threads).toEqual([])
    expect(s.connections).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addSubplot', () => {
  it('should add a subplot', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Romance Arc', 'romantic', [3, 5, 8], 70, 80)
    expect(s.threads.length).toBe(1)
    expect(s.threads[0].name).toBe('Romance Arc')
    expect(s.threads[0].isIntegrated).toBe(true)  // 70 > 60
  })

  it('should not integrate weak connection subplot', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Side Mystery', 'mystery', [10, 15], 40, 60)
    expect(s.threads[0].isIntegrated).toBe(false)  // 40 <= 60
  })
})

describe('connectSubplots', () => {
  it('should connect two subplots', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Subplot A', 'revenge', [5, 10], 60, 70)
    s = addSubplot(s, 'Subplot B', 'romantic', [8, 12], 65, 75)
    const [id1, id2] = [s.threads[0].id, s.threads[1].id]
    s = connectSubplots(s, id1, id2, 'parallel', 80)
    expect(s.connections.length).toBe(1)
    expect(s.connections[0].connectionType).toBe('parallel')
  })
})

describe('resolveSubplot', () => {
  it('should mark resolution quality', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Resolving Arc', 'redemption', [20, 25], 70, 85)
    const threadId = s.threads[0].id
    s = resolveSubplot(s, threadId, 90)
    expect(s.threads[0].resolutionQuality).toBe(90)
  })
})

describe('integrateSubplot', () => {
  it('should mark as integrated', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Loose Arc', 'buddy', [5, 8], 50, 60)
    const threadId = s.threads[0].id
    s = integrateSubplot(s, threadId)
    expect(s.threads[0].isIntegrated).toBe(true)
  })
})

describe('generateSubplotReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateSubplotReport(s)
    expect(report.totalSubplots).toBe(0)
    expect(report.avgConnectionStrength).toBe(0)
  })

  it('should calculate stats', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Arc 1', 'romantic', [5, 10], 70, 80)
    s = addSubplot(s, 'Arc 2', 'mystery', [8, 15], 55, 65)
    const threadId2 = s.threads[1].id
    s = resolveSubplot(s, threadId2, 85)
    const report = generateSubplotReport(s)
    expect(report.totalSubplots).toBe(2)
    expect(report.activeSubplots).toBe(1)
    expect(report.integratedSubplots).toBe(1)
  })
})

describe('getSubplotByType', () => {
  it('should filter by type', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Romance', 'romantic', [5, 10], 70, 80)
    s = addSubplot(s, 'Mystery', 'mystery', [8, 15], 60, 70)
    const romance = getSubplotByType(s, 'romantic')
    expect(romance.length).toBe(1)
    expect(romance[0].name).toBe('Romance')
  })
})

describe('getSubplotConnections', () => {
  it('should return connections for subplot', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'A', 'revenge', [5, 10], 65, 70)
    s = addSubplot(s, 'B', 'romantic', [8, 12], 70, 75)
    s = addSubplot(s, 'C', 'buddy', [10, 15], 55, 60)
    const [id1, id2] = [s.threads[0].id, s.threads[1].id]
    s = connectSubplots(s, id1, id2, 'causal', 80)
    const conns = getSubplotConnections(s, id1)
    expect(conns.length).toBe(1)
  })
})

describe('compareSubplotIntegration', () => {
  it('should compare connection strength', () => {
    let s = createEmptyState()
    s = addSubplot(s, 'Weak', 'mystery', [5, 10], 40, 60)
    s = addSubplot(s, 'Strong', 'revenge', [8, 15], 85, 80)
    const [id1, id2] = [s.threads[0].id, s.threads[1].id]
    const result = compareSubplotIntegration(s, id1, id2)
    expect(result.moreIntegrated).toBe(id2)
    expect(result.strength2).toBe(85)
  })
})
