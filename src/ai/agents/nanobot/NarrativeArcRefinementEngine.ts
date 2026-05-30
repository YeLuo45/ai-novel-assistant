export type ArcPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'

export interface ArcSegment {
  segmentId: string
  chapterStart: number
  chapterEnd: number
  phase: ArcPhase
  intensity: number  // 0-100
  description: string
}

export interface NarrativeArc {
  arcId: string
  name: string
  segments: ArcSegment[]
  integrityScore: number  // 0-100
}

export interface ArcRefinementState {
  arcs: NarrativeArc[]
  currentChapter: number
  overallIntegrity: number  // 0-100
  structuralIssues: string[]
}

function createArcId(): string {
  return 'arc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function createSegmentId(): string {
  return 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function validateArcStructure(arc: NarrativeArc): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 100

  const phases = arc.segments.map(s => s.phase)
  const phaseOrder: ArcPhase[] = ['setup', 'rising', 'climax', 'falling', 'resolution']

  // Check for missing phases
  const expectedPhases = phaseOrder.slice(0, 3)  // at minimum setup, rising, climax
  for (const phase of expectedPhases) {
    if (!phases.includes(phase)) {
      issues.push('Missing phase: ' + phase)
      score -= 20
    }
  }

  // Check phase order
  let lastPhaseIndex = -1
  for (const phase of phases) {
    const idx = phaseOrder.indexOf(phase)
    if (idx < lastPhaseIndex && lastPhaseIndex !== -1) {
      issues.push('Phase order violation: ' + phase + ' after ' + phaseOrder[lastPhaseIndex])
      score -= 10
    }
    lastPhaseIndex = idx
  }

  // Check climax is not at very beginning or end
  const climaxIdx = phases.indexOf('climax')
  if (climaxIdx === 0) {
    issues.push('Climax at the beginning of the story')
    score -= 15
  }
  if (climaxIdx === phases.length - 1 && phases.length > 1) {
    issues.push('Climax at the very end with no resolution')
    score -= 15
  }

  // Check for intensity progression
  const climaxSegments = arc.segments.filter(s => s.phase === 'climax')
  if (climaxSegments.length > 0) {
    const maxClimaxIntensity = Math.max(...climaxSegments.map(s => s.intensity))
    const otherSegments = arc.segments.filter(s => s.phase !== 'climax')
    const maxOtherIntensity = otherSegments.length > 0 ? Math.max(...otherSegments.map(s => s.intensity)) : 0
    if (maxClimaxIntensity <= maxOtherIntensity) {
      issues.push('Climax intensity not higher than other segments')
      score -= 15
    }
  }

  return { score: Math.max(0, score), issues }
}

export function createEmptyArcRefinementState(): ArcRefinementState {
  return { arcs: [], currentChapter: 0, overallIntegrity: 100, structuralIssues: [] }
}

export function createArc(
  state: ArcRefinementState,
  name: string,
  segments: Array<{ chapterStart: number; chapterEnd: number; phase: ArcPhase; intensity: number; description: string }>
): ArcRefinementState {
  const arcSegments: ArcSegment[] = segments.map(s => ({
    segmentId: createSegmentId(),
    ...s,
  }))

  const arc: NarrativeArc = {
    arcId: createArcId(),
    name,
    segments: arcSegments,
    integrityScore: 100,
  }

  const { score, issues } = validateArcStructure(arc)
  arc.integrityScore = score

  const newArcs = [...state.arcs, arc]

  const avgIntegrity = Math.round(newArcs.reduce((sum, a) => sum + a.integrityScore, 0) / newArcs.length)
  const allIssues = newArcs.flatMap(a => a.integrityScore < 100 ? a.segments.map(s => s.description + ': ' + validateArcStructure(a).issues.join(', ')) : [])

  return {
    ...state,
    arcs: newArcs,
    overallIntegrity: avgIntegrity,
    structuralIssues: [...new Set(allIssues)].slice(0, 10),
  }
}

export function addSegment(
  state: ArcRefinementState,
  arcId: string,
  segment: { chapterStart: number; chapterEnd: number; phase: ArcPhase; intensity: number; description: string }
): ArcRefinementState {
  const newArcs = state.arcs.map(arc => {
    if (arc.arcId !== arcId) return arc

    const newSegment: ArcSegment = { segmentId: createSegmentId(), ...segment }
    const newSegments = [...arc.segments, newSegment]
    const updatedArc = { ...arc, segments: newSegments }

    const { score, issues } = validateArcStructure(updatedArc)
    updatedArc.integrityScore = score

    return updatedArc
  })

  const avgIntegrity = Math.round(newArcs.reduce((sum, a) => sum + a.integrityScore, 0) / newArcs.length)
  const allIssues = newArcs.flatMap(a => a.segments.map(s => s.description + ': ' + validateArcStructure(a).issues.join(', ')))

  return {
    ...state,
    arcs: newArcs,
    overallIntegrity: avgIntegrity,
    structuralIssues: [...new Set(allIssues)].slice(0, 10),
    currentChapter: Math.max(state.currentChapter, segment.chapterEnd),
  }
}

export function getArcIntegrity(state: ArcRefinementState, arcId: string): number {
  return state.arcs.find(a => a.arcId === arcId)?.integrityScore || 0
}

export function getStructuralIssues(state: ArcRefinementState): string[] {
  return state.structuralIssues
}

export function formatArcSummary(state: ArcRefinementState): string {
  let s = "=== Narrative Arc Summary ===" + "\n"
  s += "Arcs: " + state.arcs.length + "\n"
  s += "Overall Integrity: " + state.overallIntegrity + "\n"
  s += "Structural Issues: " + state.structuralIssues.length + "\n"
  return s
}

export function formatArcDashboard(state: ArcRefinementState): string {
  let s = "=== Narrative Arc Dashboard ===" + "\n"
  s += "Arcs: " + state.arcs.length + " | Integrity: " + state.overallIntegrity + "\n"

  if (state.arcs.length > 0) {
    s += "\n--- Arc Integrity ---" + "\n"
    for (const arc of state.arcs) {
      s += "  " + arc.name + ": integrity=" + arc.integrityScore
      if (arc.integrityScore < 100) {
        const { issues } = validateArcStructure(arc)
        s += " issues: " + issues.length
      }
      s += "\n"
    }
  }

  if (state.structuralIssues.length > 0) {
    s += "\n--- Issues ---" + "\n"
    for (const issue of state.structuralIssues.slice(0, 3)) {
      s += "  " + issue + "\n"
    }
  }

  return s
}
