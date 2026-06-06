/**
 * V972 NarrativeFeedbackLoopCore — Direction A Iter 4/15 (Round 5)
 * Feedback loop core: closed-loop feedback for narrative quality
 * Sources: thunderbolt feedback + generic-agent + nanobot
 */

export type FeedbackType = 'positive' | 'negative' | 'neutral' | 'constructive' | 'critical' | 'celebratory';
export type FeedbackChannel = 'reader' | 'editor' | 'peer' | 'self' | 'metric' | 'ai';
export type LoopPhase = 'sense' | 'interpret' | 'evaluate' | 'respond' | 'learn' | 'evolve';

export interface FeedbackSignal {
  signalId: string;
  type: FeedbackType;
  channel: FeedbackChannel;
  phase: LoopPhase;
  content: string;
  magnitude: number;
  sentiment: number;
  chapter: number;
}

export interface FeedbackLoop {
  loopId: string,
  name: string,
  signalIds: string[],
  closure: number,
  effectiveness: number,
}

export interface NarrativeFeedbackLoopCoreState {
  signals: Map<string, FeedbackSignal>;
  loops: Map<string, FeedbackLoop>;
  totalSignals: number;
  totalLoops: number;
  averageSentiment: number;
  averageMagnitude: number;
  loopClosure: number;
  feedbackMastery: number;
}

// Factory
export function createNarrativeFeedbackLoopCoreState(): NarrativeFeedbackLoopCoreState {
  return {
    signals: new Map(),
    loops: new Map(),
    totalSignals: 0,
    totalLoops: 0,
    averageSentiment: 0.5,
    averageMagnitude: 0.5,
    loopClosure: 0.5,
    feedbackMastery: 0.5,
  };
}

// Add signal
export function addFeedbackSignal(
  state: NarrativeFeedbackLoopCoreState,
  signalId: string,
  type: FeedbackType,
  channel: FeedbackChannel,
  phase: LoopPhase,
  content: string,
  magnitude: number,
  sentiment: number,
  chapter: number
): NarrativeFeedbackLoopCoreState {
  const signal: FeedbackSignal = { signalId, type, channel, phase, content,
    magnitude: Math.min(1, Math.max(0, magnitude)),
    sentiment: Math.min(1, Math.max(0, sentiment)),
    chapter };
  const signals = new Map(state.signals).set(signalId, signal);
  return recomputeFeedbackLoop({ ...state, signals, totalSignals: signals.size });
}

// Create loop
export function createFeedbackLoop(
  state: NarrativeFeedbackLoopCoreState,
  loopId: string,
  name: string,
  signalIds: string[]
): NarrativeFeedbackLoopCoreState {
  const signals = signalIds.map(id => state.signals.get(id)).filter((s): s is FeedbackSignal => s !== undefined);
  // Closure: did loop cover all phases?
  const phases = new Set(signals.map(s => s.phase));
  const closure = phases.size / 6;
  const effectiveness = signals.length === 0 ? 0.5
    : signals.reduce((s, sig) => s + sig.magnitude, 0) / signals.length;
  const loop: FeedbackLoop = { loopId, name, signalIds, closure, effectiveness };
  const loops = new Map(state.loops).set(loopId, loop);
  return recomputeFeedbackLoop({ ...state, loops, totalLoops: loops.size });
}

// Get signals by type
export function getSignalsByType(state: NarrativeFeedbackLoopCoreState, type: FeedbackType): FeedbackSignal[] {
  return Array.from(state.signals.values()).filter(s => s.type === type);
}

// Get feedback report
export function getFeedbackLoopReport(state: NarrativeFeedbackLoopCoreState): {
  totalSignals: number;
  totalLoops: number;
  averageSentiment: number;
  loopClosure: number;
  feedbackMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSignals === 0) recommendations.push('No signals — add feedback signals');
  if (state.loopClosure < 0.3) recommendations.push('Low closure — close loops');
  if (state.feedbackMastery < 0.5) recommendations.push('Low mastery — improve');

  return {
    totalSignals: state.totalSignals,
    totalLoops: state.totalLoops,
    averageSentiment: Math.round(state.averageSentiment * 100) / 100,
    loopClosure: Math.round(state.loopClosure * 100) / 100,
    feedbackMastery: Math.round(state.feedbackMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeFeedbackLoop(state: NarrativeFeedbackLoopCoreState): NarrativeFeedbackLoopCoreState {
  const signals = Array.from(state.signals.values());
  const averageSentiment = signals.length === 0 ? 0.5
    : signals.reduce((s, sig) => s + sig.sentiment, 0) / signals.length;
  const averageMagnitude = signals.length === 0 ? 0.5
    : signals.reduce((s, sig) => s + sig.magnitude, 0) / signals.length;

  const loops = Array.from(state.loops.values());
  const loopClosure = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.closure, 0) / loops.length;
  const avgEffectiveness = loops.length === 0 ? 0.5
    : loops.reduce((s, l) => s + l.effectiveness, 0) / loops.length;

  const feedbackMastery = (loopClosure * 0.4 + averageSentiment * 0.3 + avgEffectiveness * 0.3);

  return { ...state, averageSentiment, averageMagnitude, loopClosure, feedbackMastery };
}

// Reset
export function resetNarrativeFeedbackLoopCoreState(): NarrativeFeedbackLoopCoreState {
  return createNarrativeFeedbackLoopCoreState();
}