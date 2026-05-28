/**
 * SubtextAnalyzer - V168
 * Dialogue Subtext & Unspoken Meaning Detection Engine
 * 
 * Design references:
 * - chatdev: multi-perspective dialogue analysis
 * - thunderbolt: feedback loops for subtext accumulation
 * - nanobot: distributed mesh for cross-scene subtext consistency
 * - ruflo: hierarchical decomposition (surface → subtext → thematic meaning)
 * - generic-agent: autonomous emotional undertow detection
 */

export type SubtextType = 'irony' | 'sarcasm' | 'concealment' | 'manipulation' | 'sexual_tension' | 'power_struggle' | 'grief' | 'longing'
export type IronyMode = 'verbal' | 'situational' | 'dramatic' | 'none'

export interface SubtextFinding {
  findingId: string
  type: SubtextType
  speakerId: string
  chapter: number
  surfaceText: string
  underlyingMeaning: string
  intensity: number  // 0-100
  triggers: string[]  // keywords/phrases that triggered detection
}

export interface EmotionalUndercurrent {
  chapter: number
  dominantEmotion: string  // fear, desire, anger, etc.
  intensity: number  // 0-100
  characterIds: string[]
  description: string
}

export interface SubtextState {
  findings: SubtextFinding[]
  undercurrents: EmotionalUndercurrent[]
  currentChapter: number
  characterTensions: Map<string, number>  // characterId -> tension level 0-100
  unresolvedSubtext: SubtextFinding[]  // findings not yet resolved
  subtextArc: Array<{chapter: number; intensity: number; dominantType: SubtextType | null}>
}

// Subtext Detection Patterns
const IRONY_TRIGGERS = [
  'right', 'sure', 'obviously', 'clearly', 'totally', 'definitely', 'certainly',
  'great', 'wonderful', 'fantastic', 'perfect', 'brilliant', 'amazing',
  'oh great', 'oh wonderful', 'oh perfect', 'real smart', 'real clever',
]

const SARCASTIC_PATTERNS = [
  /\bwell\b.*\bthank\b/i, /\bcongratulations?\b/i, /\bhow\s+nice\b/i,
  /\bwhat\s+a\s+(surprise|shock)\b/i, /\bI('m|\s+am)\s+(so\s+)?thrilled\b/i,
]

const CONCEALMENT_PATTERNS = [
  'nothing', 'I'm fine', 'it's nothing', 'don't worry', 'I don't care',
  'whatever', 'I don't mind', 'it's okay', 'I guess', 'sort of', 'kind of',
  'not sure', 'maybe', 'probably not', 'I wouldn't say that',
]

const LONGING_PATTERNS = [
  'wish', 'if only', 'would be nice', 'I used to', 'remember when',
  'those days', 'longing', 'miss', 'yearning', 'the way things were',
]

const MANIPULATION_INDICATORS = [
  'you should', 'you need to', 'it would be better if', 'don't you think',
  'wouldn't it be nice', 'think about what', 'consider',
]

const POWER_STRUGGLE_MARKERS = [
  'I told you', 'you never', 'you always', 'do as I say', 'who do you think',
  'you don't get to', 'that's not your call', 'I decide',
]

// Core Detection
function detectIrony(text: string): IronyMode {
  const lower = text.toLowerCase()
  
  // Check for verbal irony triggers
  let triggerCount = IRONY_TRIGGERS.filter(t => lower.includes(t)).length
  
  // Check for exaggeration (lots of adjectives/adverbs)
  const adjectives = (lower.match(/\b(great|wonderful|terrible|horrible|amazing|fantastic|brilliant|perfect|incredible|awful)\b/g) || []).length
  
  // Check sarcastic patterns
  for (const pattern of SARCASTIC_PATTERNS) {
    if (pattern.test(text)) return 'verbal'
  }
  
  if (triggerCount >= 2 && adjectives >= 1) return 'verbal'
  if (triggerCount >= 3) return 'verbal'
  
  return 'none'
}

function detectSubtextTypes(text: string): SubtextType[] {
  const lower = text.toLowerCase()
  const types: SubtextType[] = []
  
  // Irony/Sarcasm
  if (detectIrony(text) !== 'none') {
    types.push(detectIrony(text) === 'verbal' ? 'irony' : 'sarcasm')
  }
  
  // Concealment
  for (const pattern of CONCEALMENT_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      types.push('concealment')
      break
    }
  }
  
  // Longing
  for (const pattern of LONGING_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      types.push('longing')
      break
    }
  }
  
  // Manipulation
  for (const pattern of MANIPULATION_INDICATORS) {
    if (lower.includes(pattern.toLowerCase())) {
      types.push('manipulation')
      break
    }
  }
  
  // Power struggle
  for (const pattern of POWER_STRUGGLE_MARKERS) {
    if (lower.includes(pattern.toLowerCase())) {
      types.push('power_struggle')
      break
    }
  }
  
  // Grief (simple keyword-based)
  if (lower.includes('grief') || lower.includes('mourning') || lower.includes('lost')) {
    types.push('grief')
  }
  
  return types
}

function generateUnderlyingMeaning(text: string, type: SubtextType): string {
  const meanings: Record<SubtextType, string[]> = {
    irony: [
      'The speaker means the opposite of what they say',
      'A caustic observation disguised as agreement',
      'Disdain expressed through false praise',
    ],
    sarcasm: [
      'Biting criticism masked as civility',
      'Contemptuous agreement that is not agreement',
      'Sharp mockery hidden in polite words',
    ],
    concealment: [
      'Something is being hidden behind dismissiveness',
      'The character is avoiding a difficult topic',
      'True feelings are being suppressed',
    ],
    manipulation: [
      'The speaker is trying to influence the listener covertly',
      'A subtle power play disguised as helpfulness',
      'The character is angling for something',
    ],
    sexual_tension: [
      'Unspoken attraction beneath the surface',
      'A charged moment between characters',
      'Unresolved romantic undercurrent',
    ],
    power_struggle: [
      'A dominance contest is underway',
      'One character is asserting control over another',
      'Hierarchical tension is present',
    ],
    grief: [
      'Unprocessed loss is influencing behavior',
      'A buried grief surfaces indirectly',
      'The character is struggling with absence',
    ],
    longing: [
      'A desire for something absent or impossible',
      'Nostalgia for what is no longer',
      'Yearning that cannot be directly expressed',
    ],
  }
  
  const options = meanings[type]
  return options[Math.floor(Math.random() * options.length)]
}

function calculateIntensity(text: string, type: SubtextType): number {
  const lower = text.toLowerCase()
  let intensity = 40  // base intensity
  
  // Length factor (longer text with subtext = more intentional = higher)
  if (text.length > 100) intensity += 10
  if (text.length > 200) intensity += 10
  
  // Strong markers increase intensity
  const strongMarkers = {
    irony: ['obviously', 'totally', 'definitely', 'clearly'],
    sarcasm: ['congratulations', 'how nice', 'thrilled', 'oh well'],
    concealment: ['nothing', 'fine', 'don't worry', 'whatever'],
    manipulation: ['should', 'need to', 'consider', 'think about'],
    longing: ['wish', 'if only', 'used to', 'remember when', 'miss'],
    power_struggle: ['I told you', 'you never', 'you always', 'my way'],
    grief: ['lost', 'gone', 'never', 'no more'],
    sexual_tension: ['couldn't help', 'couldn't stop', 'felt something'],
  }
  
  const markers = strongMarkers[type] || []
  const markerCount = markers.filter(m => lower.includes(m)).length
  intensity += markerCount * 10
  
  return Math.min(100, intensity)
}

// State Management
export function createEmptySubtextState(): SubtextState {
  return {
    findings: [],
    undercurrents: [],
    currentChapter: 0,
    characterTensions: new Map(),
    unresolvedSubtext: [],
    subtextArc: [],
  }
}

export function analyzeDialogueSubtext(state: SubtextState, characterId: string, text: string): SubtextState {
  const chapter = state.currentChapter || 1
  const subtextTypes = detectSubtextTypes(text)
  
  if (subtextTypes.length === 0) return state
  
  const newFindings: SubtextFinding[] = []
  const newUndercurrents = [...state.undercurrents]
  
  for (const type of subtextTypes) {
    const findingId = 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
    const finding: SubtextFinding = {
      findingId,
      type,
      speakerId: characterId,
      chapter,
      surfaceText: text.substring(0, 150),
      underlyingMeaning: generateUnderlyingMeaning(text, type),
      intensity: calculateIntensity(text, type),
      triggers: [],
    }
    newFindings.push(finding)
  }
  
  // Update character tensions
  const newTensions = new Map(state.characterTensions)
  const currentTension = newTensions.get(characterId) || 0
  const avgIntensity = newFindings.reduce((a, f) => a + f.intensity, 0) / newFindings.length
  newTensions.set(characterId, Math.min(100, currentTension + avgIntensity * 0.3))
  
  // Generate undercurrent if subtext is significant
  if (newFindings.length >= 2) {
    const dominantType = subtextTypes[0]
    newUndercurrents.push({
      chapter,
      dominantEmotion: dominantType === 'longing' ? 'longing' :
                       dominantType === 'grief' ? 'grief' :
                       dominantType === 'power_struggle' ? 'anger' :
                       dominantType === 'concealment' ? 'anxiety' :
                       dominantType === 'irony' || dominantType === 'sarcasm' ? 'contempt' : 'tension',
      intensity: Math.round(avgIntensity),
      characterIds: [characterId],
      description: 'Significant subtext detected: ' + newFindings.length + ' findings',
    })
  }
  
  // Update arc
  const dominantType = subtextTypes[0]
  const maxIntensity = Math.max(...newFindings.map(f => f.intensity))
  const arcEntry = { chapter, intensity: maxIntensity, dominantType }
  
  return {
    ...state,
    findings: [...state.findings, ...newFindings],
    undercurrents: newUndercurrents.slice(-19),
    characterTensions: newTensions,
    unresolvedSubtext: [...state.unresolvedSubtext, ...newFindings].slice(-20),
    subtextArc: [...state.subtextArc.slice(-29), arcEntry],
  }
}

export function resolveSubtext(state: SubtextState, findingId: string): SubtextState {
  const unresolved = state.unresolvedSubtext.filter(f => f.findingId !== findingId)
  return { ...state, unresolvedSubtext: unresolved }
}

export function advanceChapter(state: SubtextState, chapter: number): SubtextState {
  return { ...state, currentChapter: chapter }
}

// Subtext Analysis
export function getUnresolvedSubtextCount(state: SubtextState): number {
  return state.unresolvedSubtext.length
}

export function getChapterSubtextIntensity(state: SubtextState, chapter: number): number {
  const chapterFindings = state.findings.filter(f => f.chapter === chapter)
  if (chapterFindings.length === 0) return 0
  return Math.round(chapterFindings.reduce((a, f) => a + f.intensity, 0) / chapterFindings.length)
}

export function getMostCommonSubtextType(state: SubtextState): SubtextType | null {
  if (state.findings.length === 0) return null
  const counts: Record<string, number> = {}
  for (const f of state.findings) {
    counts[f.type] = (counts[f.type] || 0) + 1
  }
  let maxType = ''
  let maxCount = 0
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) { maxCount = count; maxType = type }
  }
  return maxType as SubtextType || null
}

export function findSubtextByCharacter(state: SubtextState, characterId: string): SubtextFinding[] {
  return state.findings.filter(f => f.speakerId === characterId)
}

// Formatters
export function formatSubtextSummary(state: SubtextState): string {
  let s = '=== Subtext Analysis Summary ===\n'
  s += 'Current Chapter: ' + state.currentChapter + '\n'
  s += 'Total Findings: ' + state.findings.length + '\n'
  s += 'Unresolved: ' + state.unresolvedSubtext.length + '\n'
  
  if (state.findings.length > 0) {
    const mostCommon = getMostCommonSubtextType(state)
    s += 'Most Common Type: ' + (mostCommon || 'none') + '\n'
    
    s += '\n--- Findings by Type ---\n'
    const typeCounts: Record<string, number> = {}
    for (const f of state.findings) typeCounts[f.type] = (typeCounts[f.type] || 0) + 1
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
      s += '  ' + type + ': ' + count + '\n'
    }
  }
  
  return s
}

export function formatSubtextDashboard(state: SubtextState): string {
  let s = '=== Subtext Analysis Dashboard ===\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  
  if (state.subtextArc.length > 0) {
    s += '\n--- Subtext Arc ---\n'
    for (const entry of state.subtextArc.slice(-10)) {
      s += '  Ch ' + entry.chapter + ': ' + entry.dominantType + ' (intensity: ' + entry.intensity + ')\n'
    }
  }
  
  if (state.characterTensions.size > 0) {
    s += '\n--- Character Tensions ---\n'
    for (const [charId, tension] of state.characterTensions) {
      if (tension > 20) s += '  ' + charId + ': ' + tension + '%\n'
    }
  }
  
  if (state.unresolvedSubtext.length > 0) {
    s += '\n--- Unresolved Subtext (' + state.unresolvedSubtext.length + ') ---\n'
    for (const f of state.unresolvedSubtext.slice(-5)) {
      s += '  [' + f.type + '] Ch ' + f.chapter + ': ' + f.underlyingMeaning.substring(0, 60) + '...\n'
    }
  }
  
  if (state.undercurrents.length > 0) {
    s += '\n--- Emotional Undercurrents ---\n'
    for (const u of state.undercurrents.slice(-3)) {
      s += '  Ch ' + u.chapter + ': ' + u.dominantEmotion + ' (' + u.intensity + '%) - ' + u.description + '\n'
    }
  }
  
  return s
}
