/**
 * GenreAnalysisEngine - V182
 * Genre Classification & Tropes Detection Engine
 */

export type Genre = 'fantasy' | 'scifi' | 'romance' | 'mystery' | 'thriller' | 'horror' | 'historical' | 'literary' | 'action' | 'comedy' | 'drama' | 'unknown'

export type TropeTag = 'chosen_one' | 'fake_dating' | 'enemies_to_lovers' | 'found_family' | 'world_building' | 'redemption_arc' | 'love_triangle' | 'coming_of_age' | 'political_intrigue' | 'soft_reboot' | 'deus_ex_machina' | 'macguffin' | 'foreshadowing' | 'deuteragonist' | 'plot_armor' | 'unreliable_narrator'

export interface TropesDetected {
  trope: TropeTag
  confidence: number
  evidence: string
}

export interface GenreAnalysis {
  primaryGenre: Genre
  subGenres: Genre[]
  confidence: number
  tropes: TropesDetected[]
  conventions: string[]
  warnings: string[]
}

export interface GenreAnalysisState {
  analyses: GenreAnalysis[]
  currentGenre: Genre
  currentChapter: number
  conventionMap: Record<Genre, string[]>
}

function createConventions(): Record<Genre, string[]> {
  return {
    fantasy: ['magic system', 'world building', 'hero journey', 'chosen one', 'secondary world'],
    scifi: ['technology', 'future society', 'scientific speculation', 'space travel', 'AI'],
    romance: ['relationship development', 'emotional arc', 'meet cute', 'conflict resolution', 'Happily Ever After'],
    mystery: ['clues', 'red herrings', 'detective', 'solution', 'twist ending'],
    thriller: ['suspense', 'high stakes', 'antagonist', 'pacing', 'danger'],
    horror: ['fear', 'dread', 'supernatural', 'survival', 'monster'],
    historical: ['time period', 'period accuracy', 'social norms', 'historical figures', 'period dialogue'],
    literary: ['prose style', 'character interior', 'theme', 'narrative technique', 'symbolism'],
    action: ['fight scenes', 'chase sequences', 'high energy', 'physical conflict', 'stakes'],
    comedy: ['humor', 'timing', 'irony', 'satire', 'comic situations'],
    drama: ['character conflict', 'emotional depth', 'social issues', 'realistic', 'dialogue'],
    unknown: [],
  }
}

function classifyGenre(text: string): { primary: Genre; sub: Genre[]; confidence: number } {
  const lower = text.toLowerCase()
  const fantasyWords = ['magic', 'wizard', 'dragon', 'elf', 'sword', 'kingdom', 'spell', 'sorcerer', 'enchanted', 'mythical', 'prophecy', 'quest']
  const scifiWords = ['robot', 'space', 'alien', 'future', 'technology', 'computer', 'spaceship', 'dystopia', 'cyber', 'virtual reality', 'AI', 'quantum']
  const romanceWords = ['love', 'heart', 'kiss', 'passion', 'relationship', 'romantic', 'dating', 'couple', 'wedding', 'marriage', 'beloved', 'desire']
  const mysteryWords = ['detective', 'clue', 'murder', 'investigation', 'secret', 'evidence', 'whodunit', 'suspect', 'crime', 'unsolved', 'riddle']
  const thrillerWords = ['danger', 'chase', 'escape', 'threat', 'suspense', 'killer', 'plot twist', 'countdown', 'deadly', 'high stakes', 'survive']
  const horrorWords = ['fear', 'dread', 'monster', 'haunted', 'supernatural', 'creature', 'nightmare', 'terror', 'gore', 'undead', 'possessed']
  const score = (words: string[]) => words.filter(w => lower.includes(w)).length
  const scores: [Genre, number][] = [
    ['fantasy', score(fantasyWords)],
    ['scifi', score(scifiWords)],
    ['romance', score(romanceWords)],
    ['mystery', score(mysteryWords)],
    ['thriller', score(thrillerWords)],
    ['horror', score(horrorWords)],
  ]
  scores.sort((a, b) => b[1] - a[1])
  const top = scores[0]
  const primary = top[1] > 0 ? top[0] : 'unknown'
  const sub = top[1] >= 3 ? scores.filter(s => s[1] >= 2).map(s => s[0]).filter(g => g !== primary).slice(0, 2) as Genre[] : []
  const confidence = top[1] > 0 ? Math.min(100, 40 + top[1] * 15) : 30
  return { primary, sub, confidence }
}

function detectTropes(text: string): TropesDetected[] {
  const lower = text.toLowerCase()
  const tropes: TropesDetected[] = []
  const tropeRules: [TropeTag, string[], number][] = [
    ['chosen_one', ['chosen one', 'destined', 'prophecy', 'fated to save'], 60],
    ['enemies_to_lovers', ['hate', 'enemy', 'rivals', 'opposed', 'antagonist'], 50],
    ['found_family', ['family', 'together', 'bond', 'team', 'surrogate'], 50],
    ['redemption_arc', ['redeem', 'forgive', 'change', 'atone', 'reform'], 55],
    ['love_triangle', ['compete', 'jealous', 'choose between'], 50],
    ['world_building', ['world', 'kingdom', 'realm', 'land', 'continent'], 55],
    ['coming_of_age', ['grow up', 'mature', 'learn', 'becoming', 'youth'], 50],
    ['political_intrigue', ['court', 'throne', 'conspiracy', 'alliance', 'betray'], 55],
    ['foreshadowing', ['later', 'eventually', 'remember', 'foreshadow', 'hint'], 60],
    ['unreliable_narrator', ['truth', 'reliable', 'remember', 'version', 'perspective'], 55],
  ]
  for (const [trope, keywords, baseConf] of tropeRules) {
    const matches = keywords.filter(k => lower.includes(k)).length
    if (matches > 0) {
      tropes.push({ trope, confidence: Math.min(100, baseConf + matches * 10), evidence: keywords.find(k => lower.includes(k)) || '' })
    }
  }
  return tropes
}

export function createEmptyGenreState(): GenreAnalysisState {
  return { analyses: [], currentGenre: 'unknown', currentChapter: 0, conventionMap: createConventions() }
}

export function analyzeChapterGenre(state: GenreAnalysisState, text: string, chapter: number): GenreAnalysisState {
  const { primary, sub, confidence } = classifyGenre(text)
  const tropes = detectTropes(text)
  const conventions = state.conventionMap[primary] || []
  const warnings: string[] = []
  if (primary === 'fantasy' && !conventions.some(c => tropes.some(t => t.trope === 'world_building'))) {
    warnings.push('Fantasy genre may need stronger world building elements')
  }
  if (primary === 'mystery' && !text.toLowerCase().includes('clue') && !text.toLowerCase().includes('evidence')) {
    warnings.push('Mystery genre typically requires detectable clues')
  }
  const analysis: GenreAnalysis = { primaryGenre: primary, subGenres: sub, confidence, tropes, conventions, warnings }
  return {
    ...state,
    analyses: [...state.analyses, analysis],
    currentGenre: primary !== 'unknown' ? primary : state.currentGenre,
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function detectTropesInText(state: GenreAnalysisState, text: string): TropesDetected[] {
  return detectTropes(text)
}

export function getChapterAnalysis(state: GenreAnalysisState, chapter: number): GenreAnalysis | null {
  return state.analyses.find(a => a.primaryGenre !== 'unknown') || null
}

export function getPrimaryGenre(state: GenreAnalysisState): Genre {
  const genreCounts: Record<string, number> = {}
  for (const a of state.analyses) {
    if (a.primaryGenre !== 'unknown') {
      genreCounts[a.primaryGenre] = (genreCounts[a.primaryGenre] || 0) + 1
    }
  }
  const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? sorted[0][0] as Genre : 'unknown'
}

export function formatGenreSummary(state: GenreAnalysisState): string {
  let s = '=== Genre Analysis Summary ===' + '\n'
  s += 'Chapters Analyzed: ' + state.currentChapter + '\n'
  s += 'Primary Genre: ' + getPrimaryGenre(state) + '\n'
  s += 'Total Analyses: ' + state.analyses.length + '\n'
  return s
}

export function formatGenreDashboard(state: GenreAnalysisState): string {
  let s = '=== Genre Dashboard ===' + '\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  s += 'Current Genre: ' + state.currentGenre + '\n'
  const genreCounts: Record<string, number> = {}
  for (const a of state.analyses) { genreCounts[a.primaryGenre] = (genreCounts[a.primaryGenre] || 0) + 1 }
  if (Object.keys(genreCounts).length > 0) {
    s += '\n--- Genre Distribution ---' + '\n'
    for (const [genre, count] of Object.entries(genreCounts)) { s += '  ' + genre + ': ' + count + '\n' }
  }
  const allTropes: TropeTag[] = []
  for (const a of state.analyses) { for (const t of a.tropes) { allTropes.push(t.trope) } }
  if (allTropes.length > 0) {
    s += '\n--- Tropes Detected ---' + '\n'
    const tropeCounts: Record<string, number> = {}
    for (const t of allTropes) { tropeCounts[t] = (tropeCounts[t] || 0) + 1 }
    for (const [trope, count] of Object.entries(tropeCounts).slice(0, 5)) { s += '  ' + trope + ': ' + count + '\n' }
  }
  return s
}