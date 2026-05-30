/**
 * EmotionalMemoryEngine - V172
 * Character Emotional State Memory Tracking & Consolidation Engine
 * 
 * Design references:
 * - thunderbolt: feedback loops for emotional state monitoring
 * - chatdev: multi-perspective emotional tracking
 * - nanobot: distributed mesh for cross-character emotional consistency
 */

export type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation' | 'neutral'

export interface EmotionalSnapshot {
  snapshotId: string
  characterId: string
  chapter: number
  timestamp: number
  primaryEmotion: Emotion
  secondaryEmotion: Emotion | null
  intensity: number  // 0-100
  trigger: string
  memoryText: string  // summarized emotional event
}

export interface EmotionalTrend {
  characterId: string
  emotion: Emotion
  direction: 'rising' | 'falling' | 'stable' | 'volatile'
  startChapter: number
  endChapter: number
}

export interface EmotionalMemoryState {
  snapshots: EmotionalSnapshot[]
  trends: EmotionalTrend[]
  characterEmotions: Map<string, Emotion>  // current emotion per character
  unresolved: EmotionalSnapshot[]  // emotional beats not yet consolidated
}

function createEmotionSnapshotId(): string {
  return 'emo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

function detectEmotionFromText(text: string): { primary: Emotion; secondary: Emotion | null; intensity: number } {
  const lower = text.toLowerCase()
  const joyWords = ['happy', 'joy', 'glad', 'delighted', 'pleased', 'excited', 'cheerful', 'laughed', 'smiled']
  const sadnessWords = ['sad', 'grief', 'mourn', 'depressed', 'sorrow', 'cried', 'tears', 'unhappy', 'miserable']
  const angerWords = ['angry', 'furious', 'rage', 'mad', 'irritated', 'hate', 'hostile', 'enraged', 'shout']
  const fearWords = ['afraid', 'scared', 'fearful', 'terrified', 'anxious', 'worried', 'nervous', 'panic', 'dread']
  const surpriseWords = ['surprised', 'astonished', 'shocked', 'amazed', 'startled', 'unexpected', 'wow', 'stunned']
  const disgustWords = ['disgusted', 'revolted', 'sickened', 'repulsed', 'gross', 'nauseous', 'contempt']
  const trustWords = ['trust', 'believe', 'faith', 'confident', 'rely', 'depend', 'hope']
  const anticipationWords = ['eager', 'excited', 'anticipate', 'hopeful', 'looking forward', 'expect']

  const score = (words: string[]) => words.filter(w => lower.includes(w)).length

  const scores: [Emotion, number][] = [
    ['joy', score(joyWords)], ['sadness', score(sadnessWords)],
    ['anger', score(angerWords)], ['fear', score(fearWords)],
    ['surprise', score(surpriseWords)], ['disgust', score(disgustWords)],
    ['trust', score(trustWords)], ['anticipation', score(anticipationWords)],
  ]
  scores.sort((a, b) => b[1] - a[1])

  const primary = scores[0][1] > 0 ? scores[0][0] : 'neutral'
  const secondary = scores[1] && scores[1][1] > 0 ? scores[1][0] : null
  const intensity = Math.min(100, 30 + primary === 'neutral' ? 0 : scores[0][1] * 20 + Math.random() * 20)

  return { primary, secondary, intensity }
}

export function createEmptyEmotionalMemoryState(): EmotionalMemoryState {
  return {
    snapshots: [], trends: [], characterEmotions: new Map(), unresolved: []
  }
}

export function recordEmotionalBeat(state: EmotionalMemoryState, characterId: string, text: string, trigger: string, chapter: number): EmotionalMemoryState {
  const { primary, secondary, intensity } = detectEmotionFromText(text)

  const snapshot: EmotionalSnapshot = {
    snapshotId: createEmotionSnapshotId(),
    characterId, chapter,
    timestamp: Date.now(),
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    intensity, trigger, memoryText: text.substring(0, 100)
  }

  const newEmotions = new Map(state.characterEmotions)
  newEmotions.set(characterId, primary)

  const snapshots = [...state.snapshots, snapshot]
  const trends = [...state.trends]
  const unresolved = [...state.unresolved, snapshot].slice(-15)

  // Detect trends from recent snapshots
  const charSnaps = snapshots.filter(s => s.characterId === characterId).slice(-8)
  if (charSnaps.length >= 4) {
    const recent = charSnaps.slice(-4)
    const emotionCounts: Record<string, number> = {}
    recent.forEach(s => { emotionCounts[s.primaryEmotion] = (emotionCounts[s.primaryEmotion] || 0) + 1 })
    const prev = charSnaps.slice(-4, -2)
    const prevCounts: Record<string, number> = {}
    prev.forEach(s => { prevCounts[s.primaryEmotion] = (prevCounts[s.primaryEmotion] || 0) + 1 })

    let direction: 'rising' | 'falling' | 'stable' | 'volatile' = 'stable'
    const topNow = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]
    const topPrev = Object.entries(prevCounts).sort((a, b) => b[1] - a[1])[0]
    if (topNow && topPrev) {
      if (topNow[0] !== topPrev[0]) direction = 'volatile'
      else if (emotionCounts[topNow[0]] > prevCounts[topPrev[0]] + 1) direction = 'rising'
      else if (emotionCounts[topNow[0]] < prevCounts[topPrev[0]] - 1) direction = 'falling'
    }

    const existingTrendIdx = trends.findIndex(t => t.characterId === characterId && t.emotion === primary)
    if (existingTrendIdx >= 0) {
      trends[existingTrendIdx] = { ...trends[existingTrendIdx], direction, endChapter: chapter }
    } else {
      trends.push({ characterId, emotion: primary, direction, startChapter: chapter - 4, endChapter: chapter })
    }
  }

  return { ...state, snapshots, trends, characterEmotions: newEmotions, unresolved }
}

export function consolidateMemory(state: EmotionalMemoryState, characterId: string): EmotionalMemoryState {
  const unresolved = state.unresolved.filter(s => s.characterId !== characterId)
  return { ...state, unresolved }
}

export function getCharacterEmotionalState(state: EmotionalMemoryState, characterId: string): Emotion {
  return state.characterEmotions.get(characterId) || 'neutral'
}

export function getEmotionalHistory(state: EmotionalMemoryState, characterId: string): EmotionalSnapshot[] {
  return state.snapshots.filter(s => s.characterId === characterId)
}

export function getActiveTrends(state: EmotionalMemoryState, characterId: string): EmotionalTrend[] {
  return state.trends.filter(t => t.characterId === characterId)
}

export function formatEmotionalSummary(state: EmotionalMemoryState): string {
  let s = '=== Emotional Memory Summary ===\n'
  s += 'Total Snapshots: ' + state.snapshots.length + '\n'
  s += 'Characters Tracked: ' + state.characterEmotions.size + '\n'

  if (state.characterEmotions.size > 0) {
    s += '\n--- Current States ---\n'
    for (const [charId, emotion] of state.characterEmotions) {
      s += '  ' + charId + ': ' + emotion + '\n'
    }
  }

  if (state.trends.length > 0) {
    s += '\n--- Active Trends ---\n'
    for (const t of state.trends.slice(-5)) {
      s += '  ' + t.characterId + ': ' + t.emotion + ' [' + t.direction + ']\n'
    }
  }
  return s
}

export function formatEmotionalDashboard(state: EmotionalMemoryState): string {
  let s = '=== Emotional Dashboard ===\n'

  const recent = state.snapshots.slice(-10)
  if (recent.length > 0) {
    s += '\n--- Recent Emotions ---\n'
    for (const snap of recent.reverse()) {
      s += '  Ch ' + snap.chapter + ' [' + snap.characterId + ']: ' + snap.primaryEmotion + ' (' + snap.intensity + '%) - ' + snap.trigger.substring(0, 40) + '\n'
    }
  }

  if (state.unresolved.length > 0) {
    s += '\n--- Unresolved Emotional Beats (' + state.unresolved.length + ') ---\n'
    for (const u of state.unresolved.slice(-5)) {
      s += '  [' + u.characterId + '] Ch ' + u.chapter + ': ' + u.primaryEmotion + ' - ' + u.trigger.substring(0, 50) + '\n'
    }
  }
  return s
}
