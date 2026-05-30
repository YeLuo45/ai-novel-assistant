export interface EngagementDataPoint {
  chapter: number
  engagementScore: number  // 0-100 predicted engagement
  dropoutRisk: number  // 0-100 likelihood of dropping
  momentumScore: number  // 0-100 reader momentum
}

export interface ReaderSegment {
  segmentId: string
  chapterStart: number
  chapterEnd: number
  targetAudience: string  // e.g., 'young_adult', 'fantasy_love', 'action_lover'
  expectedEngagement: number
}

export interface ReaderEngagementState {
  dataPoints: EngagementDataPoint[]
  segments: ReaderSegment[]
  currentChapter: number
  averageEngagement: number
  dropoutAlerts: number[]  // chapters with high dropout risk
}

function createDataPointId(): string {
  return 'eng_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessDropoutRisk(engagement: number, momentum: number, prevDropout: number): number {
  let risk = 50

  // Low engagement → high risk
  if (engagement < 30) risk += 40
  else if (engagement < 50) risk += 20
  else if (engagement >= 70) risk -= 30

  // Low momentum → risk
  if (momentum < 30) risk += 30
  else if (momentum < 50) risk += 10
  else if (momentum >= 70) risk -= 20

  // Consecutive low engagement compounds risk
  if (prevDropout > 60 && engagement < 50) risk += 15

  // Very short chapter can signal rushed content
  if (momentum > 80 && engagement < 40) risk += 10

  return Math.max(0, Math.min(100, risk))
}

export function createEmptyReaderEngagementState(): ReaderEngagementState {
  return { dataPoints: [], segments: [], currentChapter: 0, averageEngagement: 0, dropoutAlerts: [] }
}

export function predictChapterEngagement(
  state: ReaderEngagementState,
  chapter: number,
  wordCount: number,
  cliffhangerPresent: boolean,
  actionDensity: number  // 0-100
): ReaderEngagementState {
  // Engagement calculation
  let engagement = 50
  if (wordCount > 500 && wordCount < 3000) engagement += 10
  else if (wordCount >= 3000) engagement += 5
  else if (wordCount < 300) engagement -= 15

  if (cliffhangerPresent) engagement += 15
  if (actionDensity >= 30 && actionDensity <= 70) engagement += 10
  if (actionDensity > 80) engagement -= 5

  // Momentum based on chapter flow
  let momentum = 50
  if (chapter > 1) {
    const prev = state.dataPoints.find(d => d.chapter === chapter - 1)
    if (prev) {
      momentum = Math.round((prev.engagementScore + engagement) / 2)
    }
  }

  engagement = Math.max(0, Math.min(100, engagement))
  momentum = Math.max(0, Math.min(100, momentum))

  // Dropout risk
  const prevDropout = state.dataPoints.length > 0 ? state.dataPoints[state.dataPoints.length - 1].dropoutRisk : 0
  const dropoutRisk = assessDropoutRisk(engagement, momentum, prevDropout)

  const dataPoint: EngagementDataPoint = {
    chapter,
    engagementScore: engagement,
    dropoutRisk,
    momentumScore: momentum,
  }

  const newDataPoints = [...state.dataPoints, dataPoint]
  const avgEngagement = Math.round(newDataPoints.reduce((s, d) => s + d.engagementScore, 0) / newDataPoints.length)

  // Alert if dropout risk crosses threshold
  const dropoutAlerts = [...state.dropoutAlerts]
  if (dropoutRisk > 70) {
    dropoutAlerts.push(chapter)
  }

  return {
    ...state,
    dataPoints: newDataPoints,
    currentChapter: chapter,
    averageEngagement: avgEngagement,
    dropoutAlerts,
  }
}

export function predictSegmentEngagement(
  state: ReaderEngagementState,
  chapterStart: number,
  chapterEnd: number,
  targetAudience: string
): ReaderSegment {
  const segmentPoints = state.dataPoints.filter(d => d.chapter >= chapterStart && d.chapter <= chapterEnd)
  const expectedEngagement = segmentPoints.length > 0
    ? Math.round(segmentPoints.reduce((s, d) => s + d.engagementScore, 0) / segmentPoints.length)
    : 50

  return {
    segmentId: createDataPointId(),
    chapterStart,
    chapterEnd,
    targetAudience,
    expectedEngagement,
  }
}

export function getDropoutAlerts(state: ReaderEngagementState): number[] {
  return state.dropoutAlerts
}

export function getEngagementAtChapter(state: ReaderEngagementState, chapter: number): EngagementDataPoint | null {
  return state.dataPoints.find(d => d.chapter === chapter) || null
}

export function formatEngagementSummary(state: ReaderEngagementState): string {
  let s = "=== Reader Engagement Summary ===" + "\n"
  s += "Chapters tracked: " + state.dataPoints.length + "\n"
  s += "Avg Engagement: " + state.averageEngagement + "\n"
  s += "Dropout Alerts: " + state.dropoutAlerts.length + "\n"
  return s
}

export function formatEngagementDashboard(state: ReaderEngagementState): string {
  let s = "=== Reader Engagement Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Avg Engagement: " + state.averageEngagement + "\n"

  if (state.dataPoints.length > 0) {
    s += "\n--- Chapter Engagement ---" + "\n"
    for (const d of state.dataPoints.slice(-6)) {
      const riskFlag = d.dropoutRisk > 70 ? " [ALERT]" : ""
      s += "  Ch" + d.chapter + " engagement=" + d.engagementScore + " dropout=" + d.dropoutRisk + "%" + riskFlag + "\n"
    }
  }

  if (state.dropoutAlerts.length > 0) {
    s += "\n--- High Dropout Risk Chapters ---" + "\n"
    for (const ch of state.dropoutAlerts.slice(-5)) {
      s += "  Chapter " + ch + "\n"
    }
  }

  return s
}
