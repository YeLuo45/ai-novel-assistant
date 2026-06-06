/**
 * V914 AdaptiveFeedbackEngine — Direction D Iter 5/15 (Round 4)
 * Adaptive feedback engine: feedback adaptation + dynamic response
 * Sources: thunderbolt feedback + nanobot + generic-agent
 */

export type FeedbackChannel = 'reader' | 'editor' | 'critic' | 'peer' | 'self' | 'system';
export type FeedbackType = 'praise' | 'critique' | 'suggestion' | 'question' | 'concern' | 'insight';
export type ResponseStrategy = 'acknowledge' | 'incorporate' | 'defend' | 'revise' | 'ignore' | 'analyze';

export interface FeedbackItem {
  feedbackId: string;
  channel: FeedbackChannel;
  type: FeedbackType;
  content: string;
  impact: number;
  chapter: number;
}

export interface FeedbackResponse {
  responseId: string;
  feedbackId: string;
  strategy: ResponseStrategy;
  rationale: string;
  effectiveness: number;
  chapter: number;
}

export interface AdaptiveFeedbackEngineState {
  feedback: Map<string, FeedbackItem>;
  responses: Map<string, FeedbackResponse>;
  totalFeedback: number;
  totalResponses: number;
  channelCoverage: number;
  averageEffectiveness: number;
  feedbackResponsiveness: number;
  adaptiveMastery: number;
}

// Factory
export function createAdaptiveFeedbackEngineState(): AdaptiveFeedbackEngineState {
  return {
    feedback: new Map(),
    responses: new Map(),
    totalFeedback: 0,
    totalResponses: 0,
    channelCoverage: 0,
    averageEffectiveness: 0.5,
    feedbackResponsiveness: 0.5,
    adaptiveMastery: 0.5,
  };
}

// Add feedback
export function addFeedbackItem(
  state: AdaptiveFeedbackEngineState,
  feedbackId: string,
  channel: FeedbackChannel,
  type: FeedbackType,
  content: string,
  impact: number,
  chapter: number
): AdaptiveFeedbackEngineState {
  const item: FeedbackItem = { feedbackId, channel, type, content, impact, chapter };
  const feedback = new Map(state.feedback).set(feedbackId, item);
  return recomputeAdaptFeedback({ ...state, feedback, totalFeedback: feedback.size });
}

// Add response
export function addFeedbackResponse(
  state: AdaptiveFeedbackEngineState,
  responseId: string,
  feedbackId: string,
  strategy: ResponseStrategy,
  rationale: string,
  effectiveness: number,
  chapter: number
): AdaptiveFeedbackEngineState {
  const response: FeedbackResponse = { responseId, feedbackId, strategy, rationale, effectiveness, chapter };
  const responses = new Map(state.responses).set(responseId, response);
  return recomputeAdaptFeedback({ ...state, responses, totalResponses: responses.size });
}

// Get feedback by channel
export function getFeedbackByChannel(state: AdaptiveFeedbackEngineState, channel: FeedbackChannel): FeedbackItem[] {
  return Array.from(state.feedback.values()).filter(f => f.channel === channel);
}

// Get adaptive feedback report
export function getAdaptiveFeedbackReport(state: AdaptiveFeedbackEngineState): {
  totalFeedback: number;
  totalResponses: number;
  channelCoverage: number;
  averageEffectiveness: number;
  feedbackResponsiveness: number;
  adaptiveMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFeedback === 0) recommendations.push('No feedback — add feedback');
  if (state.feedbackResponsiveness < 0.5) recommendations.push('Low responsiveness — respond more');
  if (state.adaptiveMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalFeedback: state.totalFeedback,
    totalResponses: state.totalResponses,
    channelCoverage: Math.round(state.channelCoverage * 100) / 100,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    feedbackResponsiveness: Math.round(state.feedbackResponsiveness * 100) / 100,
    adaptiveMastery: Math.round(state.adaptiveMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeAdaptFeedback(state: AdaptiveFeedbackEngineState): AdaptiveFeedbackEngineState {
  const feedback = Array.from(state.feedback.values());
  const channelSet = new Set(feedback.map(f => f.channel));
  const channelCoverage = Math.min(1, channelSet.size / 5);

  const responses = Array.from(state.responses.values());
  const averageEffectiveness = responses.length === 0 ? 0.5
    : responses.reduce((s, r) => s + r.effectiveness, 0) / responses.length;

  // Responsiveness: responses per feedback
  const feedbackResponsiveness = feedback.length === 0 ? 0.5
    : Math.min(1, responses.length / feedback.length);

  const adaptiveMastery = (channelCoverage * 0.3 + averageEffectiveness * 0.4 + feedbackResponsiveness * 0.3);

  return { ...state, channelCoverage, averageEffectiveness, feedbackResponsiveness, adaptiveMastery };
}

// Reset adaptive feedback state
export function resetAdaptiveFeedbackEngineState(): AdaptiveFeedbackEngineState {
  return createAdaptiveFeedbackEngineState();
}