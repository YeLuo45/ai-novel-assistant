/**
 * SceneTransitionMatrix — V391
 * Scene transition type analysis, pacing between scenes, flow optimization matrix.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), chatdev (engagement)
 */

export type TransitionType = 'action_to_action' | 'action_to_reflection' | 'reflection_to_action' | 'same_scene' | 'time_jump' | 'location_change' | 'perspective_shift' | 'emotional_shift' | 'tension_release' | 'tension_build'

export interface TransitionAnalysis {
  fromChapter: string
  toChapter: string
  transitionType: TransitionType
  transitionQuality: number  // 0-100
  pacingImpact: number  // -20 to +20 (how it affects pacing)
  smoothness: number  // 0-100
  recommendations: string[]
}

export interface SceneFlowMatrix {
  transitions: TransitionAnalysis[]
  chapterConnections: Record<string, string[]>
  qualityByType: Record<TransitionType, number>
  averageQuality: number
  problematicTransitions: string[]  // fromChapter->toChapter keys
}

export interface SceneTransitionState {
  matrix: SceneFlowMatrix
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SceneTransitionState {
  return {
    matrix: {
      transitions: [],
      chapterConnections: {},
      qualityByType: {
        action_to_action: 0, action_to_reflection: 0, reflection_to_action: 0,
        same_scene: 0, time_jump: 0, location_change: 0, perspective_shift: 0,
        emotional_shift: 0, tension_release: 0, tension_build: 0,
      },
      averageQuality: 70,
      problematicTransitions: [],
    },
    typeAlias: {},
  }
}

function classifyTransition(fromScene: string, toScene: string): TransitionType {
  const f = fromScene.toLowerCase()
  const t = toScene.toLowerCase()
  const isAction = (s: string) => ['action', 'fight', 'chase', 'battle'].some(w => s.includes(w))
  const isReflection = (s: string) => ['reflection', 'think', 'remember', 'ponder', 'internal'].some(w => s.includes(w))
  
  if (isAction(f) && isAction(t)) return 'action_to_action'
  if (isAction(f) && isReflection(t)) return 'action_to_reflection'
  if (isReflection(f) && isAction(t)) return 'reflection_to_action'
  if (f.includes('time') || t.includes('time')) return 'time_jump'
  if (f.includes('location') || t.includes('location')) return 'location_change'
  if (f.includes('perspective') || t.includes('perspective')) return 'perspective_shift'
  if (Math.abs(f.length - t.length) > 50) return 'tension_build'
  return 'emotional_shift'
}

function evaluateTransitionQuality(
  fromScene: string,
  toScene: string,
  transitionType: TransitionType
): { quality: number; pacingImpact: number; smoothness: number } {
  let quality = 70
  let pacingImpact = 0
  let smoothness = 70
  
  // Quality modifiers based on type
  switch (transitionType) {
    case 'action_to_action': quality += 10; break
    case 'reflection_to_action': quality += 15; break
    case 'action_to_reflection': quality += 5; break
    case 'tension_release': quality += 12; smoothness += 15; break
    case 'tension_build': quality += 8; pacingImpact += 10; break
    case 'time_jump': quality -= 5; smoothness -= 15; pacingImpact += 5; break
    case 'location_change': quality -= 3; smoothness -= 10; break
    case 'perspective_shift': quality -= 8; smoothness -= 20; pacingImpact += 5; break
    case 'same_scene': quality -= 15; break
    default: break
  }
  
  // Scene length impact
  if (fromScene.length > 200) smoothness -= 10
  if (toScene.length > 200) smoothness -= 10
  
  // Check for jarring elements
  const jarring = ['suddenly', 'without warning', 'out of nowhere']
  for (const j of jarring) {
    if (toScene.toLowerCase().includes(j)) {
      quality -= 5
      smoothness -= 10
    }
  }
  
  return {
    quality: Math.max(0, Math.min(100, quality)),
    pacingImpact: Math.max(-20, Math.min(20, pacingImpact)),
    smoothness: Math.max(0, Math.min(100, smoothness)),
  }
}

export function addTransition(
  state: SceneTransitionState,
  fromChapter: string,
  toChapter: string,
  fromScene: string,
  toScene: string
): SceneTransitionState {
  const transitionType = classifyTransition(fromScene, toScene)
  const { quality, pacingImpact, smoothness } = evaluateTransitionQuality(fromScene, toScene, transitionType)
  
  const analysis: TransitionAnalysis = {
    fromChapter,
    toChapter,
    transitionType,
    transitionQuality: quality,
    pacingImpact,
    smoothness,
    recommendations: [],
  }
  
  if (quality < 50) analysis.recommendations.push('Consider rewriting this transition for smoother flow')
  if (smoothness < 40) analysis.recommendations.push('Add a bridge scene to connect these sections')
  if (pacingImpact > 10) analysis.recommendations.push('This transition speeds up pacing - ensure reader can follow')
  if (transitionType === 'perspective_shift') analysis.recommendations.push('Give readers a clear signal when shifting perspective')
  
  // Update matrix
  const transitions = [...state.matrix.transitions.filter(t => !(t.fromChapter === fromChapter && t.toChapter === toChapter)), analysis]
  const chapterConnections = { ...state.matrix.chapterConnections }
  if (!chapterConnections[fromChapter]) chapterConnections[fromChapter] = []
  if (!chapterConnections[fromChapter].includes(toChapter)) chapterConnections[fromChapter] = [...chapterConnections[fromChapter], toChapter]
  
  // Recalculate quality by type
  const qualityByType = { ...state.matrix.qualityByType }
  const typeTransitions = transitions.filter(t => t.transitionType === transitionType)
  qualityByType[transitionType] = typeTransitions.length > 0
    ? typeTransitions.reduce((s, t) => s + t.transitionQuality, 0) / typeTransitions.length
    : 0
  
  const totalQuality = transitions.reduce((s, t) => s + t.transitionQuality, 0) / transitions.length
  const problematicTransitions = transitions.filter(t => t.transitionQuality < 50).map(t => `${t.fromChapter}->${t.toChapter}`)
  
  return {
    ...state,
    matrix: { transitions, chapterConnections, qualityByType, averageQuality: Math.round(totalQuality), problematicTransitions },
  }
}

export function getTransitionQuality(state: SceneTransitionState, fromChapter: string, toChapter: string): number {
  const t = state.matrix.transitions.find(t => t.fromChapter === fromChapter && t.toChapter === toChapter)
  return t?.transitionQuality || 0
}

export function suggestBestNextChapter(state: SceneTransitionState, currentChapter: string, targetPacing: 'faster' | 'slower' | 'maintain'): string | null {
  const connections = state.matrix.chapterConnections[currentChapter] || []
  if (connections.length === 0) return null
  
  const candidates = connections.map(ch => {
    const t = state.matrix.transitions.find(tr => tr.fromChapter === currentChapter && tr.toChapter === ch)
    return { chapter: ch, quality: t?.transitionQuality || 0, pacing: t?.pacingImpact || 0 }
  })
  
  if (targetPacing === 'faster') {
    return candidates.sort((a, b) => b.pacing - a.pacing)[0]?.chapter || null
  } else if (targetPacing === 'slower') {
    return candidates.sort((a, b) => a.pacing - b.pacing)[0]?.chapter || null
  }
  return candidates.sort((a, b) => b.quality - a.quality)[0]?.chapter || null
}

export function compareTransitionTypes(state: SceneTransitionState, type1: TransitionType, type2: TransitionType): {
  betterType: TransitionType
  qualityDiff: number
} {
  const q1 = state.matrix.qualityByType[type1]
  const q2 = state.matrix.qualityByType[type2]
  return { betterType: q1 > q2 ? type1 : type2, qualityDiff: Math.abs(q1 - q2) }
}
