// AdvancedNarrativeIntelligenceHub - integrates all 8 Round 3 engines into unified state

export interface EngagementDataPoint {
  chapter: number
  engagementScore: number
  dropoutRisk: number
  momentumScore: number
}

export interface ReaderEngagementState {
  dataPoints: EngagementDataPoint[]
  currentChapter: number
  averageEngagement: number
  dropoutAlerts: string[]
  engagementScore: number
}

export interface ToneShift {
  shiftId: string
  chapter: number
  fromTone: string
  toTone: string
  abrupt: boolean
}

export interface NarrativeToneState {
  establishedTones: Array<{ chapter: number; tone: string }>
  currentTone: string
  toneConsistencyScore: number
  abruptShifts: ToneShift[]
  toneScore: number
}

export interface PlotHoleEntry {
  holeId: string
  type: string
  chapter: number
  severity: 'minor' | 'moderate' | 'critical'
  description: string
  detectedAt: number
}

export interface PlotHoleState {
  holes: PlotHoleEntry[]
  currentChapter: number
  criticalHoles: number
  overallIntegrityScore: number
}

export interface ForeshadowingEntry {
  entryId: string
  setupChapter: number
  payoffChapter: number | null
  setupText: string
  payoffText: string | null
  payoffStatus: string
}

export interface ForeshadowingState {
  entries: ForeshadowingEntry[]
  currentChapter: number
  totalSetups: number
  orphanedCount: number
  setupPayoffRatio: number
}

export interface ScenePacingData {
  chapter: number
  wordCount: number
  pacingScore: number
  rhythm: string
}

export interface PacingAnalysisState {
  scenes: ScenePacingData[]
  currentChapter: number
  averagePacing: number
  rhythmChanges: number
  pacingScore: number
}

export interface DialogueEntry {
  dialogueId: string
  chapter: number
  speaker: string
  authenticityScore: number
  hasSubtext: boolean
  speechPattern: string
  fillerWordCount: number
  overlapWithOtherCharacters: number
}

export interface DialogueAuthenticityState {
  entries: DialogueEntry[]
  currentChapter: number
  averageAuthenticity: number
  dialoguesWithSubtext: number
  authenticityScore: number
}

export interface WordFrequencyEntry {
  word: string
  count: number
  chapters: number[]
  diversityImpact: number
}

export interface WordFrequencyState {
  entries: WordFrequencyEntry[]
  totalWords: number
  uniqueWords: number
  diversityScore: number
  repeatedPhrases: string[]
}

export interface ThemeEntry {
  themeId: string
  theme: string
  occurrences: number
  chapters: number[]
  coherenceScore: number
  dominantChapter: number
}

export interface NarrativeThemeState {
  themes: ThemeEntry[]
  currentChapter: number
  dominantThemes: string[]
  thematicCoherence: number
  themeCount: number
}

export interface AdvancedNarrativeIntelligenceState {
  engagement: ReaderEngagementState
  tone: NarrativeToneState
  plotHoles: PlotHoleState
  foreshadowing: ForeshadowingState
  pacing: PacingAnalysisState
  dialogue: DialogueAuthenticityState
  wordFrequency: WordFrequencyState
  themes: NarrativeThemeState
  overallHealthScore: number
  currentChapter: number
}

export function createEmptyAdvancedNarrativeIntelligenceState(): AdvancedNarrativeIntelligenceState {
  return {
    engagement: { dataPoints: [], currentChapter: 0, averageEngagement: 0, dropoutAlerts: [], engagementScore: 0 },
    tone: { establishedTones: [], currentTone: 'neutral', toneConsistencyScore: 100, abruptShifts: [], toneScore: 100 },
    plotHoles: { holes: [], currentChapter: 0, criticalHoles: 0, overallIntegrityScore: 100 },
    foreshadowing: { entries: [], currentChapter: 0, totalSetups: 0, orphanedCount: 0, setupPayoffRatio: 0 },
    pacing: { scenes: [], currentChapter: 0, averagePacing: 0, rhythmChanges: 0, pacingScore: 100 },
    dialogue: { entries: [], currentChapter: 0, averageAuthenticity: 0, dialoguesWithSubtext: 0, authenticityScore: 100 },
    wordFrequency: { entries: [], totalWords: 0, uniqueWords: 0, diversityScore: 100, repeatedPhrases: [] },
    themes: { themes: [], currentChapter: 0, dominantThemes: [], thematicCoherence: 100, themeCount: 0 },
    overallHealthScore: 100,
    currentChapter: 0,
  }
}

interface ScoreEntry { name: string; score: number; weight: number }

export function getAllAdvancedScores(state: AdvancedNarrativeIntelligenceState): ScoreEntry[] {
  return [
    { name: 'Reader Engagement', score: state.engagement.engagementScore, weight: 1.0 },
    { name: 'Tone Consistency', score: state.tone.toneConsistencyScore, weight: 0.8 },
    { name: 'Plot Integrity', score: state.plotHoles.overallIntegrityScore, weight: 1.0 },
    { name: 'Foreshadowing Ratio', score: state.foreshadowing.setupPayoffRatio, weight: 0.9 },
    { name: 'Pacing Score', score: state.pacing.pacingScore, weight: 0.7 },
    { name: 'Dialogue Authenticity', score: state.dialogue.authenticityScore, weight: 0.8 },
    { name: 'Vocabulary Diversity', score: state.wordFrequency.diversityScore, weight: 0.6 },
    { name: 'Thematic Coherence', score: state.themes.thematicCoherence, weight: 0.9 },
  ]
}

export function getOverallAdvancedHealth(state: AdvancedNarrativeIntelligenceState): number {
  const scores = getAllAdvancedScores(state)
  const totalWeight = scores.reduce((s, sc) => s + sc.weight, 0)
  const weighted = scores.reduce((s, sc) => s + sc.score * sc.weight, 0)
  return Math.round(weighted / totalWeight)
}

export function formatAdvancedNarrativeSummary(state: AdvancedNarrativeIntelligenceState): string {
  const scores = getAllAdvancedScores(state)
  let s = "=== Advanced Narrative Intelligence Summary ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Overall Health: " + state.overallHealthScore + "\n"
  s += "\n--- Component Scores ---\n"
  for (const sc of scores) {
    const filled = Math.floor(sc.score / 20)
    const empty = 5 - filled
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty)
    s += "  " + sc.name + " [" + bar + "] " + sc.score + "\n"
  }
  return s
}

export function formatAdvancedNarrativeDashboard(state: AdvancedNarrativeIntelligenceState): string {
  let s = "=== Advanced Narrative Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Overall: " + state.overallHealthScore + "\n"

  const criticalIssues: string[] = []
  if (state.plotHoles.criticalHoles > 0) criticalIssues.push("Plot holes: " + state.plotHoles.criticalHoles)
  if (state.engagement.dropoutAlerts.length > 0) criticalIssues.push("Dropout risk: " + state.engagement.dropoutAlerts.length)
  if (state.foreshadowing.orphanedCount > 0) criticalIssues.push("Orphaned setups: " + state.foreshadowing.orphanedCount)
  if (state.tone.abruptShifts.length > 0) criticalIssues.push("Tone jarring shifts: " + state.tone.abruptShifts.length)

  if (criticalIssues.length > 0) {
    s += "\n--- Critical Issues ---\n"
    for (const issue of criticalIssues) s += "  " + issue + "\n"
  }

  s += "\n--- Quick Stats ---\n"
  s += "  Themes: " + state.themes.themeCount + " | Foreshadow: " + state.foreshadowing.totalSetups + " | Pacing: " + state.pacing.averagePacing + "\n"

  return s
}