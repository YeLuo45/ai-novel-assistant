export interface VoiceProfile {
  characterId: string
  vocabularyLevel: number  // 1-10
  sentenceLengthAvg: number
  commonPhrases: string[]
  speechTraits: string[]  // e.g., 'uses metaphors', 'short sentences', 'formal'
  formalityLevel: number  // 1-10: 1=casual, 10=formal
}

export interface VoiceSample {
  sampleId: string
  characterId: string
  chapter: number
  text: string
  voiceProfile: VoiceProfile
  consistencyScore: number  // 0-100
}

export interface VoiceConsistencyState {
  samples: VoiceSample[]
  profiles: Map<string, VoiceProfile>
  currentChapter: number
  averageConsistency: number  // 0-100
}

function createSampleId(): string {
  return 'voice_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function createProfileId(): string {
  return 'profile_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function analyzeVocabulary(text: string): number {
  const words = text.split(' ')
  const longWords = words.filter(w => w.length > 8).length
  const ratio = longWords / Math.max(words.length, 1)
  if (ratio > 0.3) return 9
  if (ratio > 0.2) return 7
  if (ratio > 0.1) return 5
  if (ratio > 0.05) return 3
  return 1
}

function analyzeSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 0
  const words = text.split(' ')
  return Math.round(words.length / sentences.length)
}

function detectSpeechTraits(text: string): string[] {
  const traits: string[] = []
  const lower = text.toLowerCase()

  if (lower.includes('like') && lower.includes('you know')) traits.push('casual filler')
  if (lower.includes('therefore') || lower.includes('thus')) traits.push('formal')
  if (lower.includes('wouldn\'t it') || lower.includes('does it not')) traits.push('questioning')
  if (lower.includes('!') || lower.includes('wow') || lower.includes('oh')) traits.push('enthusiastic')
  if (lower.split(/[.!?]+/).filter(s => s.trim().length < 8).length > 2) traits.push('short sentences')
  if (lower.includes('perhaps') || lower.includes('maybe') || lower.includes('possibly')) traits.push('hedging')
  if (lower.includes('metaphor') || lower.includes('like')) traits.push('metaphorical')

  return traits.slice(0, 3)
}

function detectFormality(text: string): number {
  const lower = text.toLowerCase()
  let score = 5

  const formal = ['would', 'could', 'shall', 'indeed', 'therefore', 'hence', 'thus', 'however']
  const informal = ['yeah', 'nope', 'kinda', 'sorta', 'gonna', 'wanna', 'gotta', 'um', 'uh']

  const formalCount = formal.filter(w => lower.includes(w)).length
  const informalCount = informal.filter(w => lower.includes(w)).length

  score += formalCount * 0.5 - informalCount * 0.5
  return Math.max(1, Math.min(10, Math.round(score)))
}

function checkConsistency(profile: VoiceProfile, text: string): number {
  const words = text.split(' ')
  const vocab = analyzeVocabulary(text)
  const sentLen = analyzeSentenceLength(text)
  const formality = detectFormality(text)
  const traits = detectSpeechTraits(text)

  let score = 80

  // Vocab consistency
  if (Math.abs(vocab - profile.vocabularyLevel) > 3) score -= 15
  else if (Math.abs(vocab - profile.vocabularyLevel) > 1) score -= 5

  // Sentence length consistency
  if (Math.abs(sentLen - profile.sentenceLengthAvg) > 15) score -= 10
  else if (Math.abs(sentLen - profile.sentenceLengthAvg) > 5) score -= 3

  // Formality consistency
  if (Math.abs(formality - profile.formalityLevel) > 3) score -= 10

  // Trait overlap
  const overlap = traits.filter(t => profile.speechTraits.includes(t)).length
  score += overlap * 3

  return Math.max(0, Math.min(100, score))
}

export function createEmptyVoiceConsistencyState(): VoiceConsistencyState {
  return { samples: [], profiles: new Map(), currentChapter: 0, averageConsistency: 100 }
}

export function registerCharacter(
  state: VoiceConsistencyState,
  characterId: string,
  sampleText: string
): VoiceConsistencyState {
  const newProfiles = new Map(state.profiles)

  const profile: VoiceProfile = {
    characterId,
    vocabularyLevel: analyzeVocabulary(sampleText),
    sentenceLengthAvg: analyzeSentenceLength(sampleText),
    commonPhrases: [],
    speechTraits: detectSpeechTraits(sampleText),
    formalityLevel: detectFormality(sampleText),
  }

  newProfiles.set(characterId, profile)

  return { ...state, profiles: newProfiles }
}

export function recordVoiceSample(
  state: VoiceConsistencyState,
  characterId: string,
  chapter: number,
  text: string
): VoiceConsistencyState {
  const profile = state.profiles.get(characterId)
  if (!profile) return state

  const consistencyScore = checkConsistency(profile, text)

  const sample: VoiceSample = {
    sampleId: createSampleId(),
    characterId,
    chapter,
    text,
    voiceProfile: { ...profile },
    consistencyScore,
  }

  const newSamples = [...state.samples, sample]

  // Update profile with common phrases
  const words = text.split(' ').filter(w => w.length > 4).slice(0, 100)
  const updatedProfile = {
    ...profile,
    commonPhrases: [...new Set([...profile.commonPhrases, ...words])].slice(0, 50),
    sentenceLengthAvg: Math.round((profile.sentenceLengthAvg + analyzeSentenceLength(text)) / 2),
  }

  const newProfiles = new Map(state.profiles)
  newProfiles.set(characterId, updatedProfile)

  const avgConsistency = Math.round(newSamples.reduce((sum, s) => sum + s.consistencyScore, 0) / newSamples.length)

  return {
    ...state,
    samples: newSamples,
    profiles: newProfiles,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageConsistency: avgConsistency,
  }
}

export function getConsistencyScore(state: VoiceConsistencyState, characterId: string): number {
  const charSamples = state.samples.filter(s => s.characterId === characterId)
  if (charSamples.length === 0) return 100
  return Math.round(charSamples.reduce((sum, s) => sum + s.consistencyScore, 0) / charSamples.length)
}

export function formatVoiceSummary(state: VoiceConsistencyState): string {
  let s = "=== Voice Consistency Summary ===" + "\n"
  s += "Characters: " + state.profiles.size + "\n"
  s += "Samples: " + state.samples.length + "\n"
  s += "Avg Consistency: " + state.averageConsistency + "\n"
  return s
}

export function formatVoiceDashboard(state: VoiceConsistencyState): string {
  let s = "=== Voice Consistency Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Characters: " + state.profiles.size + " | Avg Consistency: " + state.averageConsistency + "\n"

  if (state.profiles.size > 0) {
    s += "\n--- Character Voices ---" + "\n"
    for (const [id, profile] of state.profiles) {
      const consistency = getConsistencyScore(state, id)
      s += "  " + id + ": vocab=" + profile.vocabularyLevel + " formal=" + profile.formalityLevel + " consistency=" + consistency + "\n"
    }
  }

  return s
}
