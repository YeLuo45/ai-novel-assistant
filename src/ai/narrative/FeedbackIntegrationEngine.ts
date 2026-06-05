/**
 * V832 FeedbackIntegrationEngine — Direction A Iter 3/9 (Round 4)
 * Feedback integration engine: feedback aggregation + integration actions
 * Sources: thunderbolt feedback + chatdev + generic-agent
 */

export type FeedbackChannel = 'reader' | 'editor' | 'peer' | 'self' | 'automated' | 'market';
export type FeedbackType = 'praise' | 'critique' | 'suggestion' | 'question' | 'concern' | 'insight';
export type IntegrationStage = 'received' | 'analyzed' | 'prioritized' | 'planned' | 'integrated' | 'verified';

export interface FeedbackItem {
  feedbackId: string;
  channel: FeedbackChannel;
  type: FeedbackType;
  stage: IntegrationStage;
  content: string;
  source: string;
  priority: number;
  impact: number;
  timestamp: number;
}

export interface FeedbackAction {
  actionId: string;
  feedbackId: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'rejected';
  outcome: string;
  timestamp: number;
}

export interface FeedbackIntegrationEngineState {
  feedbackItems: Map<string, FeedbackItem>;
  actions: Map<string, FeedbackAction>;
  totalFeedback: number;
  totalActions: number;
  integratedFeedback: number;
  averagePriority: number;
  averageImpact: number;
  channelDiversity: number;
  integrationRate: number;
  feedbackQuality: number;
}

// Factory
export function createFeedbackIntegrationEngineState(): FeedbackIntegrationEngineState {
  return {
    feedbackItems: new Map(),
    actions: new Map(),
    totalFeedback: 0,
    totalActions: 0,
    integratedFeedback: 0,
    averagePriority: 0.5,
    averageImpact: 0.5,
    channelDiversity: 0,
    integrationRate: 0,
    feedbackQuality: 0.5,
  };
}

// Receive feedback
export function receiveFeedback(
  state: FeedbackIntegrationEngineState,
  feedbackId: string,
  channel: FeedbackChannel,
  type: FeedbackType,
  content: string,
  source: string,
  priority: number = 0.5,
  impact: number = 0.5
): FeedbackIntegrationEngineState {
  const item: FeedbackItem = {
    feedbackId, channel, type, stage: 'received',
    content, source,
    priority: Math.min(1, Math.max(0, priority)),
    impact: Math.min(1, Math.max(0, impact)),
    timestamp: Date.now(),
  };
  const feedbackItems = new Map(state.feedbackItems).set(feedbackId, item);
  return recomputeFeedbackInt({ ...state, feedbackItems, totalFeedback: feedbackItems.size });
}

// Advance stage
export function advanceFeedbackStage(state: FeedbackIntegrationEngineState, feedbackId: string, stage: IntegrationStage): FeedbackIntegrationEngineState {
  const item = state.feedbackItems.get(feedbackId);
  if (!item) return state;

  const updated: FeedbackItem = { ...item, stage };
  const feedbackItems = new Map(state.feedbackItems).set(feedbackId, updated);
  const integratedFeedback = stage === 'verified' && item.stage !== 'verified' ? state.integratedFeedback + 1 : state.integratedFeedback;
  return recomputeFeedbackInt({ ...state, feedbackItems, integratedFeedback });
}

// Create action
export function createFeedbackAction(
  state: FeedbackIntegrationEngineState,
  actionId: string,
  feedbackId: string,
  description: string
): FeedbackIntegrationEngineState {
  const action: FeedbackAction = {
    actionId, feedbackId, description,
    status: 'planned', outcome: '', timestamp: Date.now(),
  };
  const actions = new Map(state.actions).set(actionId, action);
  return recomputeFeedbackInt({ ...state, actions, totalActions: actions.size });
}

// Complete action
export function completeFeedbackAction(state: FeedbackIntegrationEngineState, actionId: string, outcome: string): FeedbackIntegrationEngineState {
  const action = state.actions.get(actionId);
  if (!action) return state;

  const updated: FeedbackAction = { ...action, status: 'completed', outcome, timestamp: Date.now() };
  const actions = new Map(state.actions).set(actionId, updated);
  return recomputeFeedbackInt({ ...state, actions });
}

// Get feedback by channel
export function getFeedbackByChannel(state: FeedbackIntegrationEngineState, channel: FeedbackChannel): FeedbackItem[] {
  return Array.from(state.feedbackItems.values()).filter(f => f.channel === channel);
}

// Get feedback report
export function getFeedbackIntegrationReport(state: FeedbackIntegrationEngineState): {
  totalFeedback: number;
  totalActions: number;
  integratedFeedback: number;
  averagePriority: number;
  averageImpact: number;
  channelDiversity: number;
  integrationRate: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalFeedback === 0) recommendations.push('No feedback — gather feedback');
  if (state.integrationRate < 0.3) recommendations.push('Low integration — act on feedback');
  if (state.channelDiversity < 0.3) recommendations.push('Limited channels — diversify sources');

  return {
    totalFeedback: state.totalFeedback,
    totalActions: state.totalActions,
    integratedFeedback: state.integratedFeedback,
    averagePriority: Math.round(state.averagePriority * 100) / 100,
    averageImpact: Math.round(state.averageImpact * 100) / 100,
    channelDiversity: Math.round(state.channelDiversity * 100) / 100,
    integrationRate: Math.round(state.integrationRate * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeFeedbackInt(state: FeedbackIntegrationEngineState): FeedbackIntegrationEngineState {
  const items = Array.from(state.feedbackItems.values());
  const averagePriority = items.length === 0 ? 0.5
    : items.reduce((s, f) => s + f.priority, 0) / items.length;
  const averageImpact = items.length === 0 ? 0.5
    : items.reduce((s, f) => s + f.impact, 0) / items.length;

  const channelSet = new Set(items.map(f => f.channel));
  const channelDiversity = Math.min(1, channelSet.size / 5);

  const integrationRate = state.totalFeedback === 0 ? 0
    : state.integratedFeedback / state.totalFeedback;

  const feedbackQuality = (averagePriority * 0.4 + averageImpact * 0.3 + channelDiversity * 0.3);

  return { ...state, averagePriority, averageImpact, channelDiversity, integrationRate, feedbackQuality };
}

// Reset feedback state
export function resetFeedbackIntegrationEngineState(): FeedbackIntegrationEngineState {
  return createFeedbackIntegrationEngineState();
}