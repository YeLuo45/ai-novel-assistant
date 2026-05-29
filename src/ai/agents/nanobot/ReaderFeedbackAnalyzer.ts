// ReaderFeedbackAnalyzer - V288: Reader feedback sentiment aggregation
export type Sentiment = 'positive' | 'negative' | 'neutral'

export interface FeedbackItem {
  chapter: string
  rating: number  // 1-5
  comment: string
  sentiment: Sentiment
}

export interface FeedbackAnalyzerState {
  feedbackItems: FeedbackItem[]
}

export function createEmptyFeedbackState(): FeedbackAnalyzerState {
  return { feedbackItems: [] }
}

export function addFeedback(
  state: FeedbackAnalyzerState,
  chapter: string,
  rating: number,
  comment: string
): FeedbackAnalyzerState {
  let sentiment: Sentiment = 'neutral'
  if (rating >= 4) sentiment = 'positive'
  else if (rating <= 2) sentiment = 'negative'
  const item: FeedbackItem = { chapter, rating, comment, sentiment }
  return { feedbackItems: [...state.feedbackItems, item] }
}

export function aggregateSentiment(state: FeedbackAnalyzerState): { chapter: string; avgRating: number; sentiment: Sentiment }[] {
  const byChapter: { [key: string]: FeedbackItem[] } = {}
  for (const f of state.feedbackItems) {
    if (!byChapter[f.chapter]) byChapter[f.chapter] = []
    byChapter[f.chapter].push(f)
  }
  return Object.entries(byChapter).map(([chapter, items]) => {
    const avgRating = Math.round(items.reduce((s, f) => s + f.rating, 0) / items.length)
    return { chapter, avgRating, sentiment: avgRating >= 4 ? 'positive' : avgRating <= 2 ? 'negative' : 'neutral' }
  })
}

export function getHotspotChapters(state: FeedbackAnalyzerState): string[] {
  return state.feedbackItems.filter(f => f.rating <= 2).map(f => f.chapter)
}

export function getOverallSentiment(state: FeedbackAnalyzerState): number {
  if (state.feedbackItems.length === 0) return 0
  return Math.round(state.feedbackItems.reduce((s, f) => s + f.rating, 0) / state.feedbackItems.length)
}

export function formatFeedbackSummary(state: FeedbackAnalyzerState): string {
  return "Feedback: " + state.feedbackItems.length + "\n"
}

export function formatFeedbackDashboard(state: FeedbackAnalyzerState): string {
  const pos = state.feedbackItems.filter(f => f.sentiment === 'positive').length
  const neg = state.feedbackItems.filter(f => f.sentiment === 'negative').length
  const neu = state.feedbackItems.filter(f => f.sentiment === 'neutral').length
  return "Sentiment Distribution: pos=" + pos + " neg=" + neg + " neu=" + neu + "\n"
}
