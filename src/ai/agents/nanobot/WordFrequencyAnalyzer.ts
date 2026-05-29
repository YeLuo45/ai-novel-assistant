export interface WordFrequencyEntry {
  word: string
  count: number
  chapters: number[]
  diversityImpact: number  // 0-100 how much this word affects diversity
}

export interface WordFrequencyState {
  entries: WordFrequencyEntry[]
  totalWords: number
  uniqueWords: number
  diversityScore: number  // 0-100 vocabulary diversity
  repeatedPhrases: string[]  // phrases used multiple times
}

export function createEmptyWordFrequencyState(): WordFrequencyState {
  return { entries: [], totalWords: 0, uniqueWords: 0, diversityScore: 100, repeatedPhrases: [] }
}

export function analyzeWordFrequency(
  state: WordFrequencyState,
  chapter: number,
  text: string,
  repeatedPhrases: string[] = []
): WordFrequencyState {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const wordCounts: Record<string, number[]> = {}

  for (const word of words) {
    if (!wordCounts[word]) wordCounts[word] = []
    wordCounts[word].push(chapter)
  }

  // Build updated entries map
  const entriesMap = new Map<string, WordFrequencyEntry>()
  
  // Add existing entries
  for (const e of state.entries) {
    entriesMap.set(e.word, e)
  }
  
  // Apply new chapter data
  for (const [word, chapters] of Object.entries(wordCounts)) {
    const existing = entriesMap.get(word)
    if (existing) {
      const allChapters = [...new Set([...existing.chapters, ...chapters])]
      entriesMap.set(word, {
        word,
        count: existing.count + chapters.length,
        chapters: allChapters,
        diversityImpact: Math.min(100, Math.round((existing.count + chapters.length) * 5)),
      })
    } else {
      entriesMap.set(word, {
        word,
        count: chapters.length,
        chapters,
        diversityImpact: chapters.length * 5,
      })
    }
  }

  const allEntries = Array.from(entriesMap.values())
  const totalWords = state.totalWords + words.length
  const uniqueWords = allEntries.length
  const diversityScore = totalWords > 0 ? Math.round((uniqueWords / Math.max(1, totalWords)) * 100) : 100
  const allRepeated = [...state.repeatedPhrases, ...repeatedPhrases]

  return {
    entries: allEntries,
    totalWords,
    uniqueWords,
    diversityScore: Math.min(100, diversityScore),
    repeatedPhrases: allRepeated,
  }
}

export function getTopWords(state: WordFrequencyState, count: number = 10): WordFrequencyEntry[] {
  return [...state.entries].sort((a, b) => b.count - a.count).slice(0, count)
}

export function getOverusedWords(state: WordFrequencyState, threshold: number = 10): WordFrequencyEntry[] {
  return state.entries.filter(e => e.count >= threshold)
}

export function getUniqueWordCount(state: WordFrequencyState): number {
  return state.uniqueWords
}

export function formatWordFrequencySummary(state: WordFrequencyState): string {
  let s = "=== Word Frequency Summary ===" + "\n"
  s += "Total Words: " + state.totalWords + "\n"
  s += "Unique Words: " + state.uniqueWords + "\n"
  s += "Vocabulary Diversity: " + state.diversityScore + "\n"
  s += "Repeated Phrases: " + state.repeatedPhrases.length + "\n"
  return s
}

export function formatWordFrequencyDashboard(state: WordFrequencyState): string {
  let s = "=== Word Frequency Dashboard ===" + "\n"
  s += "Total: " + state.totalWords + " | Unique: " + state.uniqueWords + " | Diversity: " + state.diversityScore + "\n"

  if (state.entries.length > 0) {
    s += "\n--- Top 5 Words ---" + "\n"
    for (const e of getTopWords(state, 5)) {
      s += "  " + e.word + " x" + e.count + "\n"
    }
  }

  if (state.repeatedPhrases.length > 0) {
    s += "\n--- Repeated Phrases ---" + "\n"
    for (const phrase of state.repeatedPhrases.slice(0, 3)) {
      s += "  " + phrase + "\n"
    }
  }

  return s
}
