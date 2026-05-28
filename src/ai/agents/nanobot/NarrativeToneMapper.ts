/**
 * NarrativeToneMapper - V152
 * Emotional Tone Analysis & Narrative Voice Mapping Engine
 * 
 * Design references:
 * - thunderbolt: pipeline feedback loops for continuous tone monitoring
 * - chatdev: multi-agent coordination for consistent voice
 * - ruflo: hierarchical decomposition (tone → scene → chapter → arc)
 */

export type EmotionalTone =
  | 'joyful' | 'melancholic' | 'tense' | 'peaceful'
  | 'dramatic' | 'whimsical' | 'dark' | 'romantic'
  | 'mysterious' | 'serene' | 'anxious' | 'humorous'

export type NarrativeVoiceMarker =
  | 'first_person_intimate' | 'first_person_distant'
  | 'third_person_close' | 'third_person_omniscient'
  | 'second_person' | 'unreliable_narrator'

export interface ToneSegment {
  segmentId: string
  text: string
  tone: EmotionalTone
  intensity: number          // 0-100
  transitionType: 'gradual' | 'abrupt' | 'sustained'
  voiceMarker: NarrativeVoiceMarker
  chapter: number
  position: number          // order within chapter
}

export interface ToneMap {
  segments: ToneSegment[]
  overallTone: EmotionalTone
  toneVariance: number      // how much tone shifts
  dominantTone: EmotionalTone
  voiceConsistency: number   // 0-100 how consistent the voice is
}

export interface ToneState {
  toneMaps: Map<string, ToneMap>
  currentMapId: string | null
  toneHistory: Array<{ chapter: number; dominantTone: EmotionalTone }>
  voiceMarkers: Map<string, NarrativeVoiceMarker>
  chapterToneProfiles: Map<number, EmotionalTone[]>
  transitionAlerts: Array<{ chapter: number; from: EmotionalTone; to: EmotionalTone }>
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyToneState(): ToneState {
  return {
    toneMaps: new Map(),
    currentMapId: null,
    toneHistory: [],
    voiceMarkers: new Map(),
    chapterToneProfiles: new Map(),
    transitionAlerts: [],
  }
}

// =============================================================================
// Tone Detection
// =============================================================================

const TONE_KEYWORDS: Record<EmotionalTone, string[]> = {
  joyful: ['happy', 'laugh', 'smile', 'delight', 'joy', 'cheer', 'bright', 'warm'],
  melancholic: ['sad', 'sigh', 'tears', 'lonely', 'lost', 'fade', 'memory', 'gone'],
  tense: ['heart', 'beat', 'breath', 'fear', 'danger', 'threat', 'urgent', 'risk'],
  peaceful: ['calm', 'quiet', 'rest', 'soft', 'gentle', 'still', 'serene', 'tranquil'],
  dramatic: ['cry', 'scream', 'shout', 'dramatic', 'intense', 'explosive', 'shock', 'betrayal'],
  whimsical: ['funny', 'silly', 'playful', 'absurd', 'quirky', 'odd', 'laugh', 'comic'],
  dark: ['shadow', 'dark', 'evil', 'grim', 'bleak', 'doom', 'night', 'cold'],
  romantic: ['love', 'heart', 'kiss', 'embrace', 'passion', 'desire', 'tender', 'affection'],
  mysterious: ['secret', 'unknown', 'hidden', 'strange', 'puzzle', 'clue', 'mystery', 'cryptic'],
  serene: ['peaceful', 'calm', 'clear', 'light', 'pure', 'harmony', 'balance', 'equipoise'],
  anxious: ['worry', 'nervous', 'uneasy', 'panic', 'stress', 'tense', 'fear', 'dread'],
  humorous: ['joke', 'laugh', 'funny', 'comic', 'witty', 'satire', 'ridicule', 'sarcasm'],
}

export function detectTone(text: string): EmotionalTone {
  const lower = text.toLowerCase()
  const scores: Record<EmotionalTone, number> = {
    joyful: 0, melancholic: 0, tense: 0, peaceful: 0,
    dramatic: 0, whimsical: 0, dark: 0, romantic: 0,
    mysterious: 0, serene: 0, anxious: 0, humorous: 0,
  }
  
  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[tone as EmotionalTone]++
    }
  }
  
  // Find max score
  let maxScore = 0
  let detected: EmotionalTone = 'peaceful'
  for (const [tone, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detected = tone as EmotionalTone
    }
  }
  
  // Default to serene if no keywords found
  return maxScore === 0 ? 'serene' : detected
}

export function measureToneIntensity(text: string): number {
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  const capsCount = (text.match(/[A-Z]{2,}/g) || []).length
  
  const punctuationDensity = (exclamationCount + questionCount) / Math.max(1, text.split(/\s+/).length) * 100
  const capsDensity = capsCount / Math.max(1, text.split(/\s+/).length) * 100
  
  return Math.min(100, punctuationDensity * 5 + capsDensity * 3)
}

// =============================================================================
// Voice Marker Detection
// =============================================================================

export function detectVoiceMarker(text: string): NarrativeVoiceMarker {
  const lower = text.toLowerCase()
  
  // First person indicators
  const firstPersonCount = (lower.match(/\b(i|me|my|mine|myself|we|us|our|ours)\b/g) || []).length
  const firstPersonRatio = firstPersonCount / Math.max(1, text.split(/\s+/).length)
  
  // Second person
  const secondPersonCount = (lower.match(/\b(you|your|yours|yourself)\b/g) || []).length
  const secondPersonRatio = secondPersonCount / Math.max(1, text.split(/\s+/).length)
  
  // Third person
  const thirdPersonCount = (lower.match(/\b(he|she|they|him|her|them|his|hers|their|theirs)\b/g) || []).length
  const thirdPersonRatio = thirdPersonCount / Math.max(1, text.split(/\s+/).length)
  
  if (secondPersonRatio > 0.1) return 'second_person'
  if (firstPersonRatio > 0.15) {
    // Check if intimate (personal emotions) or distant (observational)
    const intimateWords = ['feel', 'think', 'believe', 'know', 'want', 'hope', 'fear']
    const hasIntimate = intimateWords.some(w => lower.includes(w))
    return hasIntimate ? 'first_person_intimate' : 'first_person_distant'
  }
  if (thirdPersonRatio > 0.15) {
    // Check omniscient (multiple characters' thoughts) vs close (single character focus)
    const thoughtMarkers = ['thought', 'wondered', 'felt', 'knew', 'saw', 'heard']
    const omniscientMarkers = thoughtMarkers.filter(w => {
      const matches = lower.match(new RegExp(w, 'g'))
      return matches && matches.length >= 2
    })
    return omniscientMarkers.length >= 2 ? 'third_person_omniscient' : 'third_person_close'
  }
  
  return 'third_person_close'  // default
}

// =============================================================================
// Tone Mapping
// =============================================================================

export function createToneSegments(
  text: string,
  chapter: number,
  minSegmentLength: number = 50
): ToneSegment[] {
  // Split into potential segments (by sentences or paragraph breaks)
  const chunks = text.split(/(?<=[.!?])\s+/).filter(c => c.trim().length >= minSegmentLength)
  
  const segments: ToneSegment[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const tone = detectTone(chunk)
    const intensity = measureToneIntensity(chunk)
    const voiceMarker = detectVoiceMarker(chunk)
    
    const segment: ToneSegment = {
      segmentId: `seg_${chapter}_${i}`,
      text: chunk.slice(0, 50),  // store first 50 chars as preview
      tone,
      intensity,
      transitionType: 'sustained',
      voiceMarker,
      chapter,
      position: i,
    }
    
    segments.push(segment)
  }
  
  // Determine transition types
  for (let i = 0; i < segments.length; i++) {
    if (i === 0) continue
    
    const prev = segments[i - 1]
    const curr = segments[i]
    
    if (prev.tone !== curr.tone) {
      // Check if abrupt or gradual based on intensity
      const intensityDiff = Math.abs(curr.intensity - prev.intensity)
      segments[i].transitionType = intensityDiff > 30 ? 'abrupt' : 'gradual'
    }
  }
  
  return segments
}

export function buildToneMap(segments: ToneSegment[]): ToneMap {
  if (segments.length === 0) {
    return {
      segments: [],
      overallTone: 'peaceful',
      toneVariance: 0,
      dominantTone: 'peaceful',
      voiceConsistency: 100,
    }
  }
  
  // Count tone occurrences
  const toneCounts: Record<EmotionalTone, number> = {
    joyful: 0, melancholic: 0, tense: 0, peaceful: 0,
    dramatic: 0, whimsical: 0, dark: 0, romantic: 0,
    mysterious: 0, serene: 0, anxious: 0, humorous: 0,
  }
  
  let totalIntensity = 0
  let voiceChanges = 0
  let prevVoice: NarrativeVoiceMarker | null = null
  
  for (const seg of segments) {
    toneCounts[seg.tone]++
    totalIntensity += seg.intensity
    
    if (prevVoice !== null && prevVoice !== seg.voiceMarker) {
      voiceChanges++
    }
    prevVoice = seg.voiceMarker
  }
  
  // Find dominant tone
  let maxCount = 0
  let dominant: EmotionalTone = 'peaceful'
  for (const [tone, count] of Object.entries(toneCounts)) {
    if (count > maxCount) {
      maxCount = count
      dominant = tone as EmotionalTone
    }
  }
  
  // Calculate variance
  const toneValues = segments.map(s => Object.keys(TONE_KEYWORDS).indexOf(s.tone))
  const avgTone = toneValues.reduce((a, b) => a + b, 0) / toneValues.length
  const variance = toneValues.reduce((acc, tv) => acc + Math.pow(tv - avgTone, 2), 0) / toneValues.length
  
  // Voice consistency (100% = no changes)
  const voiceConsistency = Math.max(0, 100 - (voiceChanges / segments.length) * 100)
  
  return {
    segments,
    overallTone: dominant,
    toneVariance: Math.sqrt(variance),
    dominantTone: dominant,
    voiceConsistency,
  }
}

// =============================================================================
// State Operations
// =============================================================================

export function analyzeChapterTone(
  state: ToneState,
  chapter: number,
  text: string
): ToneState {
  const segments = createToneSegments(text, chapter)
  const toneMap = buildToneMap(segments)
  
  const mapId = `map_ch${chapter}`
  const newMaps = new Map(state.toneMaps)
  newMaps.set(mapId, toneMap)
  
  // Update chapter profile
  const chapterTones = segments.map(s => s.tone)
  const newProfiles = new Map(state.chapterToneProfiles)
  newProfiles.set(chapter, chapterTones)
  
  // Update transition alerts
  const newAlerts = [...state.transitionAlerts]
  if (state.toneHistory.length > 0) {
    const lastTone = state.toneHistory[state.toneHistory.length - 1]
    if (lastTone.dominantTone !== toneMap.dominantTone) {
      newAlerts.push({
        chapter,
        from: lastTone.dominantTone,
        to: toneMap.dominantTone,
      })
    }
  }
  
  // Update voice markers
  const newVoiceMarkers = new Map(state.voiceMarkers)
  for (const seg of segments) {
    newVoiceMarkers.set(seg.segmentId, seg.voiceMarker)
  }
  
  return {
    toneMaps: newMaps,
    currentMapId: mapId,
    toneHistory: [...state.toneHistory.slice(-19), { chapter, dominantTone: toneMap.dominantTone }],
    voiceMarkers: newVoiceMarkers,
    chapterToneProfiles: newProfiles,
    transitionAlerts: newAlerts.slice(-9),  // keep last 10
  }
}

export function compareToneConsistency(
  state: ToneState,
  chapter1: number,
  chapter2: number
): { consistency: number; toneShift: string | null } {
  const profile1 = state.chapterToneProfiles.get(chapter1)
  const profile2 = state.chapterToneProfiles.get(chapter2)
  
  if (!profile1 || !profile2) {
    return { consistency: 0, toneShift: null }
  }
  
  // Simple consistency: overlap in dominant tones
  const set1 = new Set(profile1)
  const set2 = new Set(profile2)
  let overlap = 0
  for (const t of set1) {
    if (set2.has(t)) overlap++
  }
  
  const consistency = (overlap / Math.max(set1.size, set2.size)) * 100
  
  // Tone shift detection
  const map1 = state.toneMaps.get(`map_ch${chapter1}`)
  const map2 = state.toneMaps.get(`map_ch${chapter2}`)
  
  let toneShift: string | null = null
  if (map1 && map2 && map1.dominantTone !== map2.dominantTone) {
    toneShift = `${map1.dominantTone} → ${map2.dominantTone}`
  }
  
  return { consistency, toneShift }
}

export function detectToneAnomaly(
  state: ToneState,
  chapter: number
): { isAnomalous: boolean; reason: string | null } {
  const map = state.toneMaps.get(`map_ch${chapter}`)
  if (!map) return { isAnomalous: false, reason: null }
  
  // Check for high variance
  if (map.toneVariance > 3) {
    return { isAnomalous: true, reason: 'High tone variance' }
  }
  
  // Check for low voice consistency
  if (map.voiceConsistency < 50) {
    return { isAnomalous: true, reason: 'Low voice consistency' }
  }
  
  // Check for abrupt transitions (more than 3 in one chapter)
  const abruptCount = map.segments.filter(s => s.transitionType === 'abrupt').length
  if (abruptCount > 3) {
    return { isAnomalous: true, reason: 'Too many abrupt tone transitions' }
  }
  
  return { isAnomalous: false, reason: null }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatToneMap(toneMap: ToneMap): string {
  const lines = [
    '=== Narrative Tone Map ===',
    `Overall Tone: ${toneMap.overallTone}`,
    `Dominant Tone: ${toneMap.dominantTone}`,
    `Tone Variance: ${toneMap.toneVariance.toFixed(2)}`,
    `Voice Consistency: ${toneMap.voiceConsistency.toFixed(1)}%`,
    `Segments: ${toneMap.segments.length}`,
    '',
  ]
  
  if (toneMap.segments.length > 0) {
    lines.push('--- Segment Preview ---')
    for (const seg of toneMap.segments.slice(0, 5)) {
      const preview = seg.text.slice(0, 30).padEnd(30)
      lines.push(`  [${seg.tone}] ${preview}... (intensity: ${seg.intensity})`)
    }
    if (toneMap.segments.length > 5) {
      lines.push(`  ... and ${toneMap.segments.length - 5} more segments`)
    }
  }
  
  return lines.join('\n')
}

export function formatToneDashboard(state: ToneState): string {
  const lines = [
    '=== Narrative Tone Dashboard ===',
    `Chapters analyzed: ${state.toneMaps.size}`,
    '',
  ]
  
  // Recent tone history
  if (state.toneHistory.length > 0) {
    lines.push('--- Tone History ---')
    for (const h of state.toneHistory.slice(-5)) {
      lines.push(`  Chapter ${h.chapter}: ${h.dominantTone}`)
    }
  }
  
  // Transition alerts
  if (state.transitionAlerts.length > 0) {
    lines.push('')
    lines.push('--- Tone Transition Alerts ---')
    for (const alert of state.transitionAlerts.slice(-3)) {
      lines.push(`  Ch${alert.chapter}: ${alert.from} → ${alert.to}`)
    }
  }
  
  // Anomalies
  const anomalies: string[] = []
  for (const [mapId] of state.toneMaps) {
    const chapter = parseInt(mapId.replace('map_ch', ''))
    const anomaly = detectToneAnomaly(state, chapter)
    if (anomaly.isAnomalous) {
      anomalies.push(`  Chapter ${chapter}: ${anomaly.reason}`)
    }
  }
  
  if (anomalies.length > 0) {
    lines.push('')
    lines.push('--- Anomalies Detected ---')
    lines.push(...anomalies)
  }
  
  return lines.join('\n')
}
