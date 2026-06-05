/**
 * V854 DialogueMasteryEngine — Direction B Iter 5/15 (Round 4)
 * Dialogue mastery engine: dialogue craft + character voice
 * Sources: chatdev dialogue + thunderbolt + nanobot
 */

export type DialogueType = 'direct' | 'indirect' | 'subtext' | 'banter' | 'monologue' | 'exposition';
export type VoiceConsistency = 'perfect' | 'strong' | 'moderate' | 'weak' | 'inconsistent';
export type DialogueQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'masterful';

export interface DialogueLine {
  lineId: string;
  speakerId: string;
  type: DialogueType;
  text: string;
  voiceConsistency: VoiceConsistency;
  quality: DialogueQuality;
  revealsAbout: string[];
  advances: string[];
  subtext: string;
}

export interface DialogueExchange {
  exchangeId: string;
  participantIds: string[];
  lineIds: string[];
  dynamic: string;
  chemistry: number;
  completed: boolean;
}

export interface DialogueMasteryEngineState {
  lines: Map<string, DialogueLine>;
  exchanges: Map<string, DialogueExchange>;
  totalLines: number;
  totalExchanges: number;
  averageQuality: number;
  averageChemistry: number;
  voiceConsistency: number;
  dialogueMastery: number;
  characterVoice: number;
}

// Factory
export function createDialogueMasteryEngineState(): DialogueMasteryEngineState {
  return {
    lines: new Map(),
    exchanges: new Map(),
    totalLines: 0,
    totalExchanges: 0,
    averageQuality: 0.5,
    averageChemistry: 0.5,
    voiceConsistency: 0.5,
    dialogueMastery: 0.5,
    characterVoice: 0.5,
  };
}

// Add dialogue line
export function addDialogueLine(
  state: DialogueMasteryEngineState,
  lineId: string,
  speakerId: string,
  text: string,
  type: DialogueType = 'direct',
  quality: DialogueQuality = 'good',
  subtext: string = ''
): DialogueMasteryEngineState {
  const line: DialogueLine = {
    lineId, speakerId, type, text,
    voiceConsistency: 'strong',
    quality, revealsAbout: [], advances: [], subtext,
  };
  const lines = new Map(state.lines).set(lineId, line);
  return recomputeDialogueMastery({ ...state, lines, totalLines: lines.size });
}

// Set voice consistency
export function setLineVoiceConsistency(state: DialogueMasteryEngineState, lineId: string, consistency: VoiceConsistency): DialogueMasteryEngineState {
  const line = state.lines.get(lineId);
  if (!line) return state;

  const updated: DialogueLine = { ...line, voiceConsistency: consistency };
  const lines = new Map(state.lines).set(lineId, updated);
  return recomputeDialogueMastery({ ...state, lines });
}

// Create exchange
export function createDialogueExchange(
  state: DialogueMasteryEngineState,
  exchangeId: string,
  participantIds: string[],
  lineIds: string[],
  dynamic: string,
  chemistry: number = 0.5
): DialogueMasteryEngineState {
  const exchange: DialogueExchange = { exchangeId, participantIds, lineIds, dynamic, chemistry, completed: false };
  const exchanges = new Map(state.exchanges).set(exchangeId, exchange);
  return recomputeDialogueMastery({ ...state, exchanges, totalExchanges: exchanges.size });
}

// Complete exchange
export function completeDialogueExchange(state: DialogueMasteryEngineState, exchangeId: string): DialogueMasteryEngineState {
  const exchange = state.exchanges.get(exchangeId);
  if (!exchange) return state;

  const updated: DialogueExchange = { ...exchange, completed: true };
  const exchanges = new Map(state.exchanges).set(exchangeId, updated);
  return recomputeDialogueMastery({ ...state, exchanges });
}

// Get lines by speaker
export function getLinesBySpeaker(state: DialogueMasteryEngineState, speakerId: string): DialogueLine[] {
  return Array.from(state.lines.values()).filter(l => l.speakerId === speakerId);
}

// Get dialogue mastery report
export function getDialogueMasteryReport(state: DialogueMasteryEngineState): {
  totalLines: number;
  totalExchanges: number;
  averageQuality: number;
  averageChemistry: number;
  voiceConsistency: number;
  dialogueMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLines === 0) recommendations.push('No lines — add dialogue');
  if (state.averageQuality < 0.5) recommendations.push('Low quality — improve');
  if (state.voiceConsistency < 0.5) recommendations.push('Low consistency — refine voice');

  return {
    totalLines: state.totalLines,
    totalExchanges: state.totalExchanges,
    averageQuality: Math.round(state.averageQuality * 100) / 100,
    averageChemistry: Math.round(state.averageChemistry * 100) / 100,
    voiceConsistency: Math.round(state.voiceConsistency * 100) / 100,
    dialogueMastery: Math.round(state.dialogueMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDialogueMastery(state: DialogueMasteryEngineState): DialogueMasteryEngineState {
  const lines = Array.from(state.lines.values());
  const qualityMap: Record<DialogueQuality, number> = { poor: 0.2, fair: 0.4, good: 0.6, excellent: 0.8, masterful: 1.0 };
  const averageQuality = lines.length === 0 ? 0.5
    : lines.reduce((s, l) => s + qualityMap[l.quality], 0) / lines.length;
  const voiceMap: Record<VoiceConsistency, number> = { perfect: 1.0, strong: 0.8, moderate: 0.6, weak: 0.4, inconsistent: 0.2 };
  const voiceConsistency = lines.length === 0 ? 0.5
    : lines.reduce((s, l) => s + voiceMap[l.voiceConsistency], 0) / lines.length;

  const exchanges = Array.from(state.exchanges.values());
  const averageChemistry = exchanges.length === 0 ? 0.5
    : exchanges.reduce((s, e) => s + e.chemistry, 0) / exchanges.length;

  const dialogueMastery = (averageQuality * 0.4 + voiceConsistency * 0.3 + averageChemistry * 0.3);
  const characterVoice = voiceConsistency;

  return { ...state, averageQuality, voiceConsistency, averageChemistry, dialogueMastery, characterVoice };
}

// Reset dialogue mastery state
export function resetDialogueMasteryEngineState(): DialogueMasteryEngineState {
  return createDialogueMasteryEngineState();
}