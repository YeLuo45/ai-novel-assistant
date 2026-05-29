import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addSkillNode,
  connectSkills,
  practiceSkill,
  getPrerequisites,
  getDependents,
  getSkillLearningPath,
  getOverallSkillLevel,
  getSkillsByCategory,
  getWeakestSkills,
  getStrongestSkills,
  recommendNextSkill,
  getSkillClusters,
  getPracticeSummary,
  isSkillReadyForAdvancement,
  getTimeInvestmentRecommendation,
} from './AuthorSkillGraph'

describe('createEmptyState', () => {
  it('should create empty graph', () => {
    const s = createEmptyState()
    expect(s.nodes).toEqual({})
    expect(s.edges).toEqual([])
    expect(s.totalPracticeMinutes).toBe(0)
    expect(s.typeAlias).toEqual({})
  })
})

describe('addSkillNode', () => {
  it('should add a new skill node', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    expect(s.nodes.pacing).toBeTruthy()
    expect(s.nodes.pacing.level).toBe(60)
  })

  it('should update existing node', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = addSkillNode(s, 'pacing', 'Pacing', 75, 'intermediate')
    expect(s.nodes.pacing.level).toBe(75)
  })

  it('should preserve practice count on update', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = practiceSkill(s, 'pacing', 30, 5)
    s = addSkillNode(s, 'pacing', 'Pacing', 70, 'intermediate')
    expect(s.nodes.pacing.practiceCount).toBe(1)
  })
})

describe('connectSkills', () => {
  it('should add edge between two nodes', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basics', 'Basics', 70, 'foundation')
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = connectSkills(s, 'basics', 'pacing', 0.8, 'prerequisite')
    expect(s.edges.length).toBe(1)
    expect(s.nodes.basics.connections).toContain('pacing')
  })

  it('should not add duplicate edges', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'a', 'A', 70, 'foundation')
    s = addSkillNode(s, 'b', 'B', 60, 'intermediate')
    s = connectSkills(s, 'a', 'b', 0.8, 'prerequisite')
    s = connectSkills(s, 'a', 'b', 0.8, 'prerequisite')
    expect(s.edges.length).toBe(1)
  })
})

describe('practiceSkill', () => {
  it('should update skill level', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = practiceSkill(s, 'pacing', 30, 5)
    expect(s.nodes.pacing.level).toBe(65)
  })

  it('should track practice time', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = practiceSkill(s, 'pacing', 30, 5)
    expect(s.totalPracticeMinutes).toBe(30)
  })

  it('should track focus time per skill', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = practiceSkill(s, 'pacing', 30, 5)
    expect(s.focusTime.pacing).toBe(30)
  })

  it('should increment practice count', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'pacing', 'Pacing', 60, 'intermediate')
    s = practiceSkill(s, 'pacing', 30, 5)
    expect(s.nodes.pacing.practiceCount).toBe(1)
    s = practiceSkill(s, 'pacing', 45, 3)
    expect(s.nodes.pacing.practiceCount).toBe(2)
  })
})

describe('getPrerequisites', () => {
  it('should return prerequisite skills', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basics', 'Basics', 70, 'foundation')
    s = addSkillNode(s, 'advanced', 'Advanced', 60, 'advanced')
    s = connectSkills(s, 'basics', 'advanced', 1.0, 'prerequisite')
    const prereqs = getPrerequisites(s, 'advanced')
    expect(prereqs.length).toBe(1)
    expect(prereqs[0].id).toBe('basics')
  })
})

describe('getDependents', () => {
  it('should return skills that depend on this skill', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basics', 'Basics', 70, 'foundation')
    s = addSkillNode(s, 'advanced', 'Advanced', 60, 'advanced')
    s = connectSkills(s, 'basics', 'advanced', 1.0, 'prerequisite')
    const dependents = getDependents(s, 'basics')
    expect(dependents.length).toBe(1)
    expect(dependents[0].id).toBe('advanced')
  })
})

describe('getSkillLearningPath', () => {
  it('should return ordered path of prerequisites', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basic', 'Basic', 60, 'foundation')
    s = addSkillNode(s, 'intermediate', 'Intermediate', 60, 'intermediate')
    s = addSkillNode(s, 'advanced', 'Advanced', 60, 'advanced')
    s = connectSkills(s, 'basic', 'intermediate', 0.8, 'prerequisite')
    s = connectSkills(s, 'intermediate', 'advanced', 0.8, 'prerequisite')
    const path = getSkillLearningPath(s, 'advanced')
    expect(path.length).toBe(3)
  })
})

describe('getOverallSkillLevel', () => {
  it('should return average of all skills', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'skill1', 'Skill 1', 80, 'intermediate')
    s = addSkillNode(s, 'skill2', 'Skill 2', 60, 'intermediate')
    const avg = getOverallSkillLevel(s)
    expect(avg).toBe(70)
  })

  it('should return 0 for empty graph', () => {
    const s = createEmptyState()
    expect(getOverallSkillLevel(s)).toBe(0)
  })
})

describe('getSkillsByCategory', () => {
  it('should filter by category', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'f1', 'Foundation 1', 60, 'foundation')
    s = addSkillNode(s, 'f2', 'Foundation 2', 70, 'foundation')
    s = addSkillNode(s, 'a1', 'Advanced 1', 60, 'advanced')
    const foundation = getSkillsByCategory(s, 'foundation')
    expect(foundation.length).toBe(2)
  })
})

describe('getWeakestSkills', () => {
  it('should return skills below threshold', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 's1', 'S1', 80, 'intermediate')
    s = addSkillNode(s, 's2', 'S2', 55, 'intermediate')
    s = addSkillNode(s, 's3', 'S3', 45, 'intermediate')
    const weakest = getWeakestSkills(s, 60)
    expect(weakest.length).toBe(2)
    expect(weakest[0].level).toBe(45)
  })
})

describe('getStrongestSkills', () => {
  it('should return top N skills', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 's1', 'S1', 50, 'intermediate')
    s = addSkillNode(s, 's2', 'S2', 80, 'intermediate')
    s = addSkillNode(s, 's3', 'S3', 70, 'intermediate')
    const strongest = getStrongestSkills(s, 2)
    expect(strongest.length).toBe(2)
    expect(strongest[0].level).toBe(80)
  })
})

describe('recommendNextSkill', () => {
  it('should return weakest skill with prerequisites met', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basics', 'Basics', 75, 'foundation')
    s = addSkillNode(s, 'pacing', 'Pacing', 55, 'intermediate')
    s = addSkillNode(s, 'dialogue', 'Dialogue', 60, 'intermediate')
    s = connectSkills(s, 'basics', 'pacing', 0.8, 'prerequisite')
    const next = recommendNextSkill(s)
    expect(next).not.toBeNull()
  })
})

describe('getSkillClusters', () => {
  it('should group connected skills', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'a', 'A', 70, 'foundation')
    s = addSkillNode(s, 'b', 'B', 70, 'foundation')
    s = addSkillNode(s, 'c', 'C', 60, 'intermediate')
    s = connectSkills(s, 'a', 'b', 0.5, 'related')
    const clusters = getSkillClusters(s)
    expect(clusters.length).toBe(2)  // connected cluster + orphan c
  })
})

describe('getPracticeSummary', () => {
  it('should return comprehensive summary', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 's1', 'Skill 1', 80, 'intermediate')
    s = addSkillNode(s, 's2', 'Skill 2', 50, 'intermediate')
    s = practiceSkill(s, 's1', 60, 5)
    s = practiceSkill(s, 's2', 30, 10)
    const summary = getPracticeSummary(s)
    expect(summary.totalSkills).toBe(2)
    expect(summary.totalPracticeMinutes).toBe(90)
    expect(summary.avgLevel).toBe(72.5)
  })
})

describe('isSkillReadyForAdvancement', () => {
  it('should return true when prerequisites and level are high', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'basics', 'Basics', 75, 'foundation')
    s = addSkillNode(s, 'advanced', 'Advanced', 75, 'advanced')
    s = connectSkills(s, 'basics', 'advanced', 1.0, 'prerequisite')
    const ready = isSkillReadyForAdvancement(s, 'advanced')
    expect(ready).toBe(true)
  })
})

describe('getTimeInvestmentRecommendation', () => {
  it('should recommend under-practiced skills with dependents', () => {
    let s = createEmptyState()
    s = addSkillNode(s, 'foundation', 'Foundation', 80, 'foundation')
    s = addSkillNode(s, 'advanced', 'Advanced', 55, 'advanced')
    s = connectSkills(s, 'foundation', 'advanced', 0.9, 'prerequisite')
    s = practiceSkill(s, 'foundation', 20, 0)  // low practice
    const recs = getTimeInvestmentRecommendation(s)
    expect(recs.length).toBeGreaterThan(0)
  })
})
