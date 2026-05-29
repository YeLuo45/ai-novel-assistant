// NarrativeTimeAnalyzer - V290: Narrative time analysis
export interface TimeMarker {
  chapter: number
  wordCount: number
  storyDuration: number  // story days/elapsed
  timeUnit: 'day' | 'week' | 'month' | 'year'
}

export interface TimeAnalyzerState {
  timeMarkers: TimeMarker[]
}

export function createEmptyTimeAnalyzerState(): TimeAnalyzerState {
  return { timeMarkers: [] }
}

export function addTimeMarker(
  state: TimeAnalyzerState,
  chapter: number,
  wordCount: number,
  storyDuration: number,
  timeUnit: 'day' | 'week' | 'month' | 'year'
): TimeAnalyzerState {
  const marker: TimeMarker = { chapter, wordCount, storyDuration, timeUnit }
  return { timeMarkers: [...state.timeMarkers, marker] }
}

export function calculatePacingVelocity(state: TimeAnalyzerState): number {
  if (state.timeMarkers.length < 2) return 0
  const totalWords = state.timeMarkers.reduce((s, m) => s + m.wordCount, 0)
  const totalDays = state.timeMarkers.reduce((s, m) => s + m.storyDuration, 0)
  if (totalDays === 0) return 0
  return Math.round(totalWords / totalDays)
}

export function getTimeCompressionRatio(state: TimeAnalyzerState): number {
  if (state.timeMarkers.length < 2) return 1
  const last = state.timeMarkers[state.timeMarkers.length - 1]
  const first = state.timeMarkers[0]
  const chapters = last.chapter - first.chapter
  const days = last.storyDuration - first.storyDuration
  if (days === 0) return 0
  return Math.round(chapters / days * 100) / 100
}

export function getChapterTimeDensity(state: TimeAnalyzerState, chapter: number): number {
  const marker = state.timeMarkers.find(m => m.chapter === chapter)
  if (!marker || marker.storyDuration === 0) return 0
  return Math.round(marker.wordCount / marker.storyDuration)
}

export function formatTimeSummary(state: TimeAnalyzerState): string {
  return "Markers: " + state.timeMarkers.length + "\n"
}

export function formatTimeDashboard(state: TimeAnalyzerState): string {
  const velocity = calculatePacingVelocity(state)
  return "Pacing Velocity: " + velocity + " words/story-day\nMarkers: " + state.timeMarkers.length + "\n"
}
