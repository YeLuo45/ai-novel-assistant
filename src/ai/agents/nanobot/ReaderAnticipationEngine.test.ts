import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addSuspenseBeat,
  deliverPayoff,
  delayPayoff,
  generateAnticipationReport,
  getPendingBeats,
  compareAnticipation,
} from './ReaderAnticipationEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
  })
})

describe('addSuspenseBeat', () => {
  it('should add suspense beat', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'mystery', 80)
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].hookType).toBe('mystery')
    expect(s.beats[0].anticipationLevel).toBe(80)
    expect(s.beats[0].payoffStatus).toBe('pending')
  })

  it('should clamp anticipation', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 1, 'danger', 150)
    expect(s.beats[0].anticipationLevel).toBe(100)
  })
})

describe('deliverPayoff', () => {
  it('should deliver payoff', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'mystery', 80)
    const beatId = s.beats[0].id
    s = deliverPayoff(s, beatId, 15, false)
    expect(s.beats[0].payoffStatus).toBe('delivered')
    expect(s.beats[0].deliveryChapter).toBe(15)
  })

  it('should subvert payoff', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'question', 70)
    const beatId = s.beats[0].id
    s = deliverPayoff(s, beatId, 15, true)
    expect(s.beats[0].payoffStatus).toBe('subverted')
    expect(s.beats[0].effectivenessScore).toBeGreaterThan(50)
  })

  it('should calculate moderate delay effectiveness', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'discovery', 75)
    const beatId = s.beats[0].id
    // 15 - 5 = 10 chapters delay → no special adjustment, effectiveness 70
    s = deliverPayoff(s, beatId, 15, false)
    expect(s.beats[0].effectivenessScore).toBe(70)
  })
})

describe('delayPayoff', () => {
  it('should mark as delayed', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'reveal', 90)
    const beatId = s.beats[0].id
    s = delayPayoff(s, beatId, 20)
    expect(s.beats[0].payoffStatus).toBe('delayed')
  })
})

describe('generateAnticipationReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateAnticipationReport(s)
    expect(report.totalBeats).toBe(0)
    expect(report.pendingPayoffs).toBe(0)
  })

  it('should count pending payoffs', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'mystery', 80)
    s = addSuspenseBeat(s, 10, 'danger', 85)
    const report = generateAnticipationReport(s)
    expect(report.totalBeats).toBe(2)
    expect(report.pendingPayoffs).toBe(2)
  })
})

describe('getPendingBeats', () => {
  it('should return pending beats', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'mystery', 80)
    s = addSuspenseBeat(s, 10, 'danger', 85)
    const beatId = s.beats[0].id
    s = deliverPayoff(s, beatId, 15)
    const pending = getPendingBeats(s)
    expect(pending.length).toBe(1)
    expect(pending[0].hookType).toBe('danger')
  })
})

describe('compareAnticipation', () => {
  it('should compare beats', () => {
    let s = createEmptyState()
    s = addSuspenseBeat(s, 5, 'mystery', 60)
    s = addSuspenseBeat(s, 10, 'danger', 90)
    const [id1, id2] = [s.beats[0].id, s.beats[1].id]
    const result = compareAnticipation(s, id1, id2)
    expect(result.higherAnticipation).toBe(id2)
    expect(result.score1).toBe(60)
    expect(result.score2).toBe(90)
  })
})
