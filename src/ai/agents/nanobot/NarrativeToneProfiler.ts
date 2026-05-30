/**
 * NarrativeToneProfiler — V431
 * Narrative tone analysis, mood tracking, emotional atmosphere mapping across story arc.
 * Inspired by: thunderbolt (feedback loops), chatdev (emotional analysis), generic-agent (optimization)
 */

export type ToneCategory = 'ominous' | 'whimsical' | 'melancholic' | 'triumphant' | 'nostalgic' | 'tense' | 'romantic' | 'dark' | 'lighthearted' | 'bittersweet'

export interface ToneSegment {
  id: string
  chapterId: string
  startPosition: number  // 0-100
  endPosition: number
  tone: ToneCategory
  intensity: number  // 0-100
  dominantEmotion: string
  transitions: ToneCategory[]  // adjacent tones
}

export interface ToneProfile {
  totalSegments: number
  toneDistribution: Record<ToneCategory, number>
  averageIntensity: number
  dominantTone: ToneCategory | null
  transitionsCount: number
}

export interface NarrativeToneState {
  segments: ToneSegment[]
  profile: ToneProfile | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeToneState {
  return { segments: [], profile: null, typeAlias: {} }
}

export function addToneSegment(
  state: NarrativeToneState,
  chapterId: string,
  startPos: number,
  endPos: number,
  tone: ToneCategory,
  intensity: number,
  dominantEmotion: string = ''
): NarrativeToneState {
  const id = `tone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  // Find adjacent segments for transition tracking
  const adjacentTones: ToneCategory[] = []
  for (const seg of state.segments) {
    if (seg.chapterId === chapterId) {
      if (Math.abs(seg.endPosition - startPos) < 10 || Math.abs(seg.startPosition - endPos) < 10) {
        if (!adjacentTones.includes(seg.tone)) adjacentTones.push(seg.tone)
      }
    }
  }
  
  const segment: ToneSegment = { id, chapterId, startPosition: Math.max(0, startPos), endPosition: Math.max(startPos + 1, endPos), tone, intensity: Math.max(0, Math.min(100, intensity)), dominantEmotion, transitions: adjacentTones }
  
  const segments = [...state.segments.filter(s => !(s.chapterId === chapterId && s.startPosition === startPos && s.endPosition === endPos)), segment]
  return { ...state, segments }
}

export function mergeToneSegments(state: NarrativeToneState, segId1: string, segId2: string): NarrativeToneState {
  const seg1 = state.segments.find(s => s.id === segId1)
  const seg2 = state.segments.find(s => s.id === segId2)
  if (!seg1 || !seg2) return state
  if (seg1.chapterId !== seg2.chapterId) return state
  
  const merged: ToneSegment = {
    id: segId1,
    chapterId: seg1.chapterId,
    startPosition: Math.min(seg1.startPosition, seg2.startPosition),
    endPosition: Math.max(seg1.endPosition, seg2.endPosition),
    tone: seg1.tone,
    intensity: Math.round((seg1.intensity + seg2.intensity) / 2),
    dominantEmotion: seg1.dominantEmotion || seg2.dominantEmotion,
    transitions: [...new Set([...seg1.transitions, ...seg2.transitions])],
  }
  
  const segments = state.segments.filter(s => s.id !== segId1 && s.id !== segId2)
  segments.push(merged)
  return { ...state, segments }
}

export function generateToneProfile(state: NarrativeToneState): ToneProfile {
  if (state.segments.length === 0) {
    return { totalSegments: 0, toneDistribution: { ominous: 0, whimsical: 0, melancholic: 0, triumphant: 0, nostalgic: 0, tense: 0, romantic: 0, dark: 0, lighthearted: 0, bittersweet: 0 }, averageIntensity: 50, dominantTone: null, transitionsCount: 0 }
  }
  
  const toneDistribution: Record<ToneCategory, number> = { ominous: 0, whimsical: 0, melancholic: 0, triumphant: 0, nostalgic: 0, tense: 0, romantic: 0, dark: 0, lighthearted: 0, bittersweet: 0 }
  for (const seg of state.segments) toneDistribution[seg.tone]++
  
  const averageIntensity = Math.round(state.segments.reduce((s, seg) => s + seg.intensity, 0) / state.segments.length)
  const toneEntries = Object.entries(toneDistribution).sort((a, b) => b[1] - a[1])
  const dominantTone = (toneEntries[0]?.[0] as ToneCategory) || null
  const transitionsCount = state.segments.reduce((s, seg) => s + seg.transitions.length, 0)
  
  return { totalSegments: state.segments.length, toneDistribution, averageIntensity, dominantTone, transitionsCount }
}

export function getChapterTone(state: NarrativeToneState, chapterId: string): ToneSegment[] {
  return state.segments.filter(s => s.chapterId === chapterId)
}

export function getToneByCategory(state: NarrativeToneState, tone: ToneCategory): ToneSegment[] {
  return state.segments.filter(s => s.tone === tone)
}

export function compareToneIntensity(state: NarrativeToneState, segId1: string, segId2: string): {
  moreIntense: string
  intensity1: number
  intensity2: number
} {
  const seg1 = state.segments.find(s => s.id === segId1)
  const seg2 = state.segments.find(s => s.id === segId2)
  if (!seg1 || !seg2) return { moreIntense: segId1, intensity1: 0, intensity2: 0 }
  return { moreIntense: seg1.intensity > seg2.intensity ? segId1 : segId2, intensity1: seg1.intensity, intensity2: seg2.intensity }
}
