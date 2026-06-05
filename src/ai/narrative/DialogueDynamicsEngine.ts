/**
 * V770 DialogueDynamicsEngine — Direction B Iter 8/9 (Round 3)
 * Dialogue dynamics engine: rhythm + subtext + dynamic flow
 * Sources: chatdev dialogue + thunderbolt dynamic + nanobot
 */

export type DialogueFunction = 'advance_plot' | 'reveal_character' | 'create_tension' | 'convey_theme' | 'provide_exposition' | 'humor';
export type DialogueRhythm = 'rapid' | 'measured' | 'slow' | 'variable' | 'paused';
export type SubtextLevel = 'explicit' | 'moderate' | 'subtle' | 'deep' | 'hidden';

export interface DialogueLine {
  lineId: string;
  speakerId: string;
  content: string;
  function: DialogueFunction;
  subtext: string;
  subtextLevel: SubtextLevel;
  rhythm: DialogueRhythm;
  timestamp: number;
}

export interface DialogueExchange {
  exchangeId: string;
  participantIds: string[];
  lines: string[];
  primaryFunction: DialogueFunction;
  tension: number;
  cohesion: number;
  startTime: number;
  endTime: number | null;
}

export interface DialogueDynamicsEngineState {
  lines: Map<string, DialogueLine>;
  exchanges: Map<string, DialogueExchange>;
  totalLines: number;
  totalExchanges: number;
  activeExchanges: number;
  averageTension: number;
  functionDistribution: Map<DialogueFunction, number>;
  averageSubtextDepth: number;
  dynamicScore: number;
}

// Factory
export function createDialogueDynamicsEngineState(): DialogueDynamicsEngineState {
  return {
    lines: new Map(),
    exchanges: new Map(),
    totalLines: 0,
    totalExchanges: 0,
    activeExchanges: 0,
    averageTension: 0.3,
    functionDistribution: new Map(),
    averageSubtextDepth: 0.5,
    dynamicScore: 0.5,
  };
}

// Add dialogue line
export function addDialogueLine(
  state: DialogueDynamicsEngineState,
  lineId: string,
  speakerId: string,
  content: string,
  func: DialogueFunction,
  subtext: string = '',
  subtextLevel: SubtextLevel = 'moderate',
  rhythm: DialogueRhythm = 'measured'
): DialogueDynamicsEngineState {
  const line: DialogueLine = { lineId, speakerId, content, function: func, subtext, subtextLevel, rhythm, timestamp: Date.now() };
  const lines = new Map(state.lines).set(lineId, line);
  const functionDistribution = new Map(state.functionDistribution);
  functionDistribution.set(func, (functionDistribution.get(func) || 0) + 1);
  return recomputeDialogueDynamics({ ...state, lines, functionDistribution, totalLines: lines.size });
}

// Create exchange
export function createDialogueExchange(
  state: DialogueDynamicsEngineState,
  exchangeId: string,
  participantIds: string[],
  primaryFunction: DialogueFunction
): DialogueDynamicsEngineState {
  const exchange: DialogueExchange = {
    exchangeId,
    participantIds,
    lines: [],
    primaryFunction,
    tension: 0.3,
    cohesion: 0.7,
    startTime: Date.now(),
    endTime: null,
  };
  const exchanges = new Map(state.exchanges).set(exchangeId, exchange);
  return recomputeDialogueDynamics({ ...state, exchanges, totalExchanges: exchanges.size, activeExchanges: state.activeExchanges + 1 });
}

// Add line to exchange
export function addLineToExchange(state: DialogueDynamicsEngineState, exchangeId: string, lineId: string, tension: number = 0.3): DialogueDynamicsEngineState {
  const exchange = state.exchanges.get(exchangeId);
  if (!exchange) return state;

  const updated: DialogueExchange = { ...exchange, lines: [...exchange.lines, lineId], tension: Math.min(1, Math.max(0, tension)) };
  const exchanges = new Map(state.exchanges).set(exchangeId, updated);
  return recomputeDialogueDynamics({ ...state, exchanges });
}

// End exchange
export function endDialogueExchange(state: DialogueDynamicsEngineState, exchangeId: string, cohesion: number = 0.7): DialogueDynamicsEngineState {
  const exchange = state.exchanges.get(exchangeId);
  if (!exchange) return state;

  const updated: DialogueExchange = { ...exchange, endTime: Date.now(), cohesion: Math.min(1, Math.max(0, cohesion)) };
  const exchanges = new Map(state.exchanges).set(exchangeId, updated);
  return recomputeDialogueDynamics({ ...state, exchanges, activeExchanges: Math.max(0, state.activeExchanges - 1) });
}

// Get lines by function
export function getLinesByFunction(state: DialogueDynamicsEngineState, functionType: DialogueFunction): DialogueLine[] {
  return Array.from(state.lines.values()).filter(l => l.function === functionType);
}

// Get lines by speaker
export function getLinesBySpeaker(state: DialogueDynamicsEngineState, speakerId: string): DialogueLine[] {
  return Array.from(state.lines.values()).filter(l => l.speakerId === speakerId);
}

// Get dialogue dynamics report
export function getDialogueDynamicsReport(state: DialogueDynamicsEngineState): {
  totalLines: number;
  totalExchanges: number;
  averageTension: number;
  averageSubtextDepth: number;
  dynamicScore: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLines === 0) recommendations.push('No lines — add dialogue');
  if (state.averageTension < 0.3) recommendations.push('Low tension — increase dramatic tension');
  if (state.averageSubtextDepth < 0.4) recommendations.push('Low subtext — add layers');

  return {
    totalLines: state.totalLines,
    totalExchanges: state.totalExchanges,
    averageTension: Math.round(state.averageTension * 100) / 100,
    averageSubtextDepth: Math.round(state.averageSubtextDepth * 100) / 100,
    dynamicScore: Math.round(state.dynamicScore * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDialogueDynamics(state: DialogueDynamicsEngineState): DialogueDynamicsEngineState {
  const lines = Array.from(state.lines.values());
  const exchanges = Array.from(state.exchanges.values());

  const averageTension = exchanges.length === 0 ? 0.3
    : exchanges.reduce((s, e) => s + e.tension, 0) / exchanges.length;

  const subtextMap: Record<SubtextLevel, number> = { explicit: 0.1, moderate: 0.3, subtle: 0.5, deep: 0.7, hidden: 1.0 };
  const averageSubtextDepth = lines.length === 0 ? 0.5
    : lines.reduce((s, l) => s + subtextMap[l.subtextLevel], 0) / lines.length;

  const functionCount = state.functionDistribution.size;
  const functionBalance = functionCount === 0 ? 0.5 : Math.min(1, functionCount / 6);
  const dynamicScore = (averageTension + averageSubtextDepth + functionBalance) / 3;

  return { ...state, averageTension, averageSubtextDepth, dynamicScore };
}

// Reset dialogue dynamics state
export function resetDialogueDynamicsEngineState(): DialogueDynamicsEngineState {
  return createDialogueDynamicsEngineState();
}