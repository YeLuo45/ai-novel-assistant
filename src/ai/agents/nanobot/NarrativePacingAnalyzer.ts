/**
 * NarrativePacingAnalyzer - V170
 * Narrative Rhythm & Scene Pacing Control Engine
 */

export type PacingBeat = 'action' | 'reflection' | 'dialogue' | 'description' | 'transition'
export type PacingRhythm = 'rapid' | 'moderate' | 'slow' | 'variegated'

export interface ScenePacing {
  sceneId: string
  chapter: number
  beatType: PacingBeat
  wordCount: number
  tensionLevel: number  // 0-100
  pacingRhythm: PacingRhythm
  beatDistribution: Record<PacingBeat, number>
}

export interface PacingState {
  scenes: ScenePacing[]
  currentChapter: number
  tensionCurve: Array<{chapter: number; avgTension: number; pacing: PacingRhythm}>
  pacingAdvice: string[]
  rhythmBreaks: Array<{chapter: number; issue: string; severity: number}>
}

export function createEmptyPacingState(): PacingState {
  return { scenes: [], currentChapter: 0, tensionCurve: [], pacingAdvice: [], rhythmBreaks: [] }
}

function detectBeatType(text: string): PacingBeat {
  const lower = text.toLowerCase()
  const dialogueCount = (text.match(/[""]/g) || []).length
  const actionVerbs = ['ran', 'fight', 'shot', 'struck', 'grabbed', 'pushed', 'fell', 'crashed', 'exploded']
  const reflectionWords = ['thought', 'wondered', 'remembered', 'considered', 'realized', 'felt', 'believed']
  const transitionMarkers = ['meanwhile', 'later', 'after', 'before', 'suddenly', 'then', 'next', 'morning']
  
  const hasAction = actionVerbs.some(v => lower.includes(v))
  const hasReflection = reflectionWords.some(w => lower.includes(w))
  const hasTransition = transitionMarkers.some(t => lower.includes(t))
  const hasDialogue = dialogueCount > 5
  
  if (hasAction) return 'action'
  if (hasDialogue) return 'dialogue'
  if (hasReflection) return 'reflection'
  if (hasTransition) return 'transition'
  return 'description'
}

function detectRhythm(beatDistribution: Record<PacingBeat, number>): PacingRhythm {
  const counts = Object.values(beatDistribution)
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  const range = max - min
  
  if (range < 5) return 'variegated'
  const totalOthers = counts.reduce((a, c) => a + c, 0) - max
  if (max > totalOthers * 3) return 'rapid'  // dominant is 3x others
  return 'moderate'
}

export function analyzeScene(state: PacingState, sceneId: string, text: string, tensionLevel: number): PacingState {
  const chapter = state.currentChapter || 1
  const words = text.split(/\s+/).length
  const beatType = detectBeatType(text)
  
  const beatDistribution: Record<PacingBeat, number> = {
    action: 0, reflection: 0, dialogue: 0, description: 0, transition: 0
  }
  beatDistribution[beatType] = words
  
  const pacingRhythm = detectRhythm(beatDistribution)
  
  const scene: ScenePacing = {
    sceneId, chapter, beatType, wordCount: words, tensionLevel, pacingRhythm, beatDistribution
  }
  
  const scenes = [...state.scenes, scene]
  const rhythmBreaks = [...state.rhythmBreaks]
  
  // Detect rhythm breaks - too many consecutive same beats
  const lastScenes = scenes.slice(-5)
  if (lastScenes.length >= 4) {
    const last4 = lastScenes.slice(-4)
    if (last4.every(s => s.beatType === 'action')) {
      rhythmBreaks.push({ chapter, issue: 'Too many consecutive action beats', severity: 60 })
    }
    if (last4.every(s => s.beatType === 'description')) {
      rhythmBreaks.push({ chapter, issue: 'Too many consecutive description beats', severity: 40 })
    }
  }
  
  return { ...state, scenes, rhythmBreaks: rhythmBreaks.slice(-9) }
}

export function calculateChapterPacing(state: PacingState, chapter: number) {
  const chapterScenes = state.scenes.filter(s => s.chapter === chapter)
  if (chapterScenes.length === 0) return null
  
  const avgTension = chapterScenes.reduce((a, s) => a + s.tensionLevel, 0) / chapterScenes.length
  const rhythmCounts: Record<PacingRhythm, number> = { rapid: 0, moderate: 0, slow: 0, variegated: 0 }
  chapterScenes.forEach(s => rhythmCounts[s.pacingRhythm]++)
  
  let dominantRhythm: PacingRhythm = 'moderate'
  let maxCount = 0
  for (const [r, c] of Object.entries(rhythmCounts)) {
    if (c > maxCount) { maxCount = c; dominantRhythm = r as PacingRhythm }
  }
  
  return { chapter, avgTension: Math.round(avgTension), pacing: dominantRhythm }
}

export function generatePacingAdvice(state: PacingState): string[] {
  const advice: string[] = []
  const scenes = state.scenes
  
  if (scenes.length < 3) return advice
  
  // Check tension curve
  const chapters = [...new Set(scenes.map(s => s.chapter))]
  for (let i = 1; i < chapters.length; i++) {
    const prev = calculateChapterPacing(state, chapters[i - 1])
    const curr = calculateChapterPacing(state, chapters[i])
    if (prev && curr && Math.abs(prev.avgTension - curr.avgTension) > 40) {
      advice.push('Tension jump of ' + Math.abs(prev.avgTension - curr.avgTension) + ' between chapters ' + chapters[i-1] + ' and ' + chapters[i])
    }
  }
  
  // Check rhythm variety
  const beatTypes = scenes.slice(-10).map(s => s.beatType)
  const unique = new Set(beatTypes).size
  if (unique <= 2) advice.push('Limited beat variety in recent scenes. Consider mixing action, dialogue, and reflection.')
  
  return advice
}

export function formatPacingSummary(state: PacingState): string {
  let s = '=== Pacing Analysis ===\n'
  s += 'Scenes Analyzed: ' + state.scenes.length + '\n'
  s += 'Chapters Covered: ' + [...new Set(state.scenes.map(s => s.chapter))].length + '\n'
  
  if (state.scenes.length > 0) {
    const totalWords = state.scenes.reduce((a, sc) => a + sc.wordCount, 0)
    s += 'Total Words: ' + totalWords + '\n'
    s += 'Avg Tension: ' + Math.round(state.scenes.reduce((a, sc) => a + sc.tensionLevel, 0) / state.scenes.length) + '\n'
  }
  return s
}

export function formatPacingDashboard(state: PacingState): string {
  let s = '=== Pacing Dashboard ===\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  
  const chapters = [...new Set(state.scenes.map(s => s.chapter))].sort((a, b) => a - b)
  if (chapters.length > 0) {
    s += '\n--- Tension Curve ---\n'
    for (const ch of chapters.slice(-10)) {
      const pacing = calculateChapterPacing(state, ch)
      if (pacing) s += '  Ch ' + ch + ': tension=' + pacing.avgTension + ', rhythm=' + pacing.pacing + '\n'
    }
  }
  
  if (state.rhythmBreaks.length > 0) {
    s += '\n--- Rhythm Breaks ---\n'
    for (const br of state.rhythmBreaks.slice(-5)) {
      s += '  Ch ' + br.chapter + ': ' + br.issue + ' [severity: ' + br.severity + ']\n'
    }
  }
  
  const advice = generatePacingAdvice(state)
  if (advice.length > 0) {
    s += '\n--- Pacing Advice ---\n'
    for (const a of advice) s += '  -> ' + a + '\n'
  }
  return s
}
