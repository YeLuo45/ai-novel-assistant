import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  plantClue,
  registerMystery,
  addClueToMystery,
  solveMystery,
  revealSolution,
  generateDistributionReport,
  getClueProgress,
} from './NarrativeClueTracker'

describe('createEmptyState', () => {
  it('should create empty clue state', () => {
    const s = createEmptyState()
    expect(s.clues).toEqual([])
    expect(s.mysteries).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('plantClue', () => {
  it('should plant a clue', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Bloody glove at scene', 3, 70, false)
    expect(s.clues.length).toBe(1)
    expect(s.clues[0].type).toBe('physical')
    expect(s.clues[0].chapterPlanted).toBe(3)
  })

  it('should mark subtle hints', () => {
    let s = createEmptyState()
    s = plantClue(s, 'verbal', 'He hesitates', 5, 50, true)
    expect(s.clues[0].subtleHint).not.toBeNull()
  })
})

describe('registerMystery', () => {
  it('should register a mystery', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue 1', 2, 60)
    s = plantClue(s, 'verbal', 'Clue 2', 4, 50)
    const clueIds = s.clues.map(c => c.id)
    s = registerMystery(s, 'Who killed X?', clueIds)
    expect(s.mysteries.length).toBe(1)
    expect(s.mysteries[0].name).toBe('Who killed X?')
  })
})

describe('addClueToMystery', () => {
  it('should add clue to existing mystery', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue 1', 2, 60)
    s = plantClue(s, 'verbal', 'Clue 2', 4, 50)
    const clueIds = [s.clues[0].id]
    s = registerMystery(s, 'Mystery', clueIds)
    s = addClueToMystery(s, s.mysteries[0].id, s.clues[1].id)
    expect(s.mysteries[0].clues.length).toBe(2)
  })
})

describe('solveMystery', () => {
  it('should solve and mark clues as paid off', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue 1', 2, 70)
    s = plantClue(s, 'verbal', 'Clue 2', 4, 60)
    const clueIds = s.clues.map(c => c.id)
    s = registerMystery(s, 'Mystery', clueIds)
    const mysteryId = s.mysteries[0].id
    s = solveMystery(s, mysteryId, 12)
    expect(s.mysteries[0].solved).toBe(true)
    expect(s.mysteries[0].chapterSolved).toBe(12)
    expect(s.clues[0].chapterPayoff).toBe(12)
  })
})

describe('revealSolution', () => {
  it('should mark solution as revealed', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue', 2, 50)
    s = registerMystery(s, 'Mystery', [s.clues[0].id])
    const mysteryId = s.mysteries[0].id
    s = solveMystery(s, mysteryId, 10)
    s = revealSolution(s, mysteryId)
    expect(s.mysteries[0].solutionRevealed).toBe(true)
  })
})

describe('generateDistributionReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateDistributionReport(s)
    expect(report.totalClues).toBe(0)
    expect(report.totalMysteries).toBe(0)
  })

  it('should report on mysteries', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue', 2, 50)
    s = registerMystery(s, 'Mystery', [s.clues[0].id])
    const report = generateDistributionReport(s)
    expect(report.totalMysteries).toBe(1)
    expect(report.solvedMysteries).toBe(0)
  })
})

describe('getClueProgress', () => {
  it('should return zero for unknown mystery', () => {
    const s = createEmptyState()
    const progress = getClueProgress(s, 'unknown')
    expect(progress.progressPercent).toBe(0)
  })

  it('should calculate progress', () => {
    let s = createEmptyState()
    s = plantClue(s, 'physical', 'Clue', 2, 50)
    s = plantClue(s, 'verbal', 'Clue 2', 4, 50)
    const clueIds = s.clues.map(c => c.id)
    s = registerMystery(s, 'Mystery', clueIds)
    const mysteryId = s.mysteries[0].id
    s = solveMystery(s, mysteryId, 10)
    const progress = getClueProgress(s, mysteryId)
    expect(progress.planted).toBe(2)
    expect(progress.paidOff).toBe(2)
    expect(progress.progressPercent).toBe(100)
  })
})
