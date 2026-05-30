// NarrativeIntelligenceHub - Central Hub for coordinating all narrative engines
import { ArcRefinementState, createEmptyArcRefinementState } from './NarrativeArcRefinementEngine'
import { SettingWorldState, createEmptySettingWorldState } from './SettingWorldConsistencyEngine'
import { ConflictDramaticState, createEmptyConflictDramaticState } from './ConflictDramaticEngine'
import { CharacterRelationshipState, createEmptyCharacterRelationshipState } from './CharacterRelationshipEngine'
import { SymbolMotifState, createEmptySymbolMotifState } from './SymbolMotifEngine'
import { SubtextLayerState, createEmptySubtextLayerState } from './SubtextLayerEngine'
import { SceneTransitionState, createEmptySceneTransitionState } from './SceneTransitionEngine'
import { VoiceConsistencyState, createEmptyVoiceConsistencyState } from './VoiceConsistencyEngine'
import { EmotionalArcState, createEmptyEmotionalArcState } from './EmotionalArcEngine'
import { WritingAnalyticsState, createEmptyWritingAnalyticsState } from './WritingAnalyticsEngine'

export interface NarrativeIntelligenceState {
  arcRefinement: ArcRefinementState
  settingWorld: SettingWorldState
  conflictDramatic: ConflictDramaticState
  characterRelationship: CharacterRelationshipState
  symbolMotif: SymbolMotifState
  subtextLayer: SubtextLayerState
  sceneTransition: SceneTransitionState
  voiceConsistency: VoiceConsistencyState
  emotionalArc: EmotionalArcState
  writingAnalytics: WritingAnalyticsState
  currentChapter: number
  lastUpdated: string
}

export type NarrativeScoreCategory = 'arc' | 'setting' | 'conflict' | 'character' | 'symbol' | 'subtext' | 'transition' | 'voice' | 'emotion' | 'analytics'

export interface NarrativeScore {
  category: NarrativeScoreCategory
  score: number
  label: string
  detail: string
}

function getArcScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'arc',
    score: state.arcRefinement.overallIntegrity,
    label: 'Arc Integrity',
    detail: state.arcRefinement.overallIntegrity >= 80 ? 'Strong narrative structure' : 'Arc structure needs attention',
  }
}

function getSettingScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'setting',
    score: state.settingWorld.consistencyScore,
    label: 'World Consistency',
    detail: state.settingWorld.consistencyScore >= 80 ? 'Consistent world-building' : 'Setting inconsistencies detected',
  }
}

function getConflictScore(state: NarrativeIntelligenceState): NarrativeScore {
  const activeCount = state.conflictDramatic.conflicts.filter(c => c.status === 'active').length
  return {
    category: 'conflict',
    score: Math.min(100, state.conflictDramatic.averageIntensity),
    label: 'Dramatic Intensity',
    detail: 'Active conflicts: ' + activeCount,
  }
}

function getCharacterScore(state: NarrativeIntelligenceState): NarrativeScore {
  const rels = state.characterRelationship.relationships
  const health = rels.length > 0 ? Math.round(rels.reduce((s, r) => s + r.health, 0) / rels.length) : 100
  return {
    category: 'character',
    score: Math.abs(health),
    label: 'Relationship Health',
    detail: state.characterRelationship.characters.size + ' characters tracked',
  }
}

function getSymbolScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'symbol',
    score: state.symbolMotif.averageConsistency,
    label: 'Symbol Consistency',
    detail: state.symbolMotif.symbols.size + ' symbols tracked',
  }
}

function getSubtextScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'subtext',
    score: state.subtextLayer.averageDepth,
    label: 'Subtext Depth',
    detail: state.subtextLayer.dialogues.length + ' dialogues analyzed',
  }
}

function getTransitionScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'transition',
    score: state.sceneTransition.averageMomentum,
    label: 'Scene Momentum',
    detail: state.sceneTransition.momentumBreaks.length + ' momentum breaks',
  }
}

function getVoiceScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'voice',
    score: state.voiceConsistency.averageConsistency,
    label: 'Voice Consistency',
    detail: state.voiceConsistency.profiles.size + ' character voices',
  }
}

function getEmotionScore(state: NarrativeIntelligenceState): NarrativeScore {
  const arcEntries = Array.from(state.emotionalArc.arcs.values())
  const arcStability = arcEntries.length > 0
    ? Math.round(arcEntries.reduce((s, a) => s + a.arcStability, 0) / arcEntries.length)
    : 100
  return {
    category: 'emotion',
    score: arcStability,
    label: 'Emotional Arc Stability',
    detail: arcEntries.length + ' characters tracked',
  }
}

function getAnalyticsScore(state: NarrativeIntelligenceState): NarrativeScore {
  return {
    category: 'analytics',
    score: state.writingAnalytics.averageQuality,
    label: 'Writing Quality',
    detail: state.writingAnalytics.sessions.length + ' sessions tracked',
  }
}

export function createEmptyNarrativeIntelligenceState(): NarrativeIntelligenceState {
  return {
    arcRefinement: createEmptyArcRefinementState(),
    settingWorld: createEmptySettingWorldState(),
    conflictDramatic: createEmptyConflictDramaticState(),
    characterRelationship: createEmptyCharacterRelationshipState(),
    symbolMotif: createEmptySymbolMotifState(),
    subtextLayer: createEmptySubtextLayerState(),
    sceneTransition: createEmptySceneTransitionState(),
    voiceConsistency: createEmptyVoiceConsistencyState(),
    emotionalArc: createEmptyEmotionalArcState(),
    writingAnalytics: createEmptyWritingAnalyticsState(),
    currentChapter: 0,
    lastUpdated: new Date().toISOString(),
  }
}

export function getAllNarrativeScores(state: NarrativeIntelligenceState): NarrativeScore[] {
  return [
    getArcScore(state),
    getSettingScore(state),
    getConflictScore(state),
    getCharacterScore(state),
    getSymbolScore(state),
    getSubtextScore(state),
    getTransitionScore(state),
    getVoiceScore(state),
    getEmotionScore(state),
    getAnalyticsScore(state),
  ]
}

export function getOverallNarrativeHealth(state: NarrativeIntelligenceState): number {
  const scores = getAllNarrativeScores(state)
  return Math.round(scores.reduce((s, ns) => s + ns.score, 0) / scores.length)
}

export function formatNarrativeSummary(state: NarrativeIntelligenceState): string {
  const health = getOverallNarrativeHealth(state)
  const scores = getAllNarrativeScores(state)
  let s = "=== Narrative Intelligence Summary ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Overall Health: " + health + "\n"
  s += "\n--- Score Breakdown ---" + "\n"
  for (const score of scores) {
    s += "  " + score.label + ": " + score.score + "\n"
  }
  return s
}

export function formatNarrativeDashboard(state: NarrativeIntelligenceState): string {
  const health = getOverallNarrativeHealth(state)
  const scores = getAllNarrativeScores(state)
  let s = "=== Narrative Intelligence Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Overall Health: " + health + "\n"
  s += "\n--- Top Scores ---" + "\n"
  const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, 5)
  for (const score of sorted) {
    const bar = '█'.repeat(Math.floor(score.score / 20)) + '░'.repeat(5 - Math.floor(score.score / 20))
    s += "  " + score.label + " [" + bar + "] " + score.score + "\n"
  }
  s += "\n--- Bottom Scores ---" + "\n"
  const bottom = [...scores].sort((a, b) => a.score - b.score).slice(0, 3)
  for (const score of bottom) {
    s += "  " + score.label + ": " + score.score + " - " + score.detail + "\n"
  }
  return s
}

export function getWeakestScores(state: NarrativeIntelligenceState, count: number = 3): NarrativeScore[] {
  const scores = getAllNarrativeScores(state)
  return [...scores].sort((a, b) => a.score - b.score).slice(0, count)
}
