/**
 * V668 DialogueOrchestrationEngine — Direction C Iter 2/9 (Round 2)
 * Dialogue orchestration engine: multi-character dialogue flow + subtext
 * Sources: chatdev role + thunderbolt flow + nanobot multi-agent
 */

export type DialogueType = 'exposition' | 'conflict' | 'bonding' | 'banter' | 'revelation';
export type SpeakerRole = 'protagonist' | 'antagonist' | 'mentor' | 'sidekick' | 'narrator';

export interface DialogueLine {
  lineId: string;
  speaker: SpeakerRole;
  speakerId: string;
  text: string;
  subtext: number;
  emotionalWeight: number;
  type: DialogueType;
  timestamp: number;
}

export interface DialogueExchange {
  exchangeId: string;
  participants: string[];
  lines: DialogueLine[];
  startTime: number;
  endTime: number;
  type: DialogueType;
  emotionalArc: number[];
}

export interface DialogueOrchestrationState {
  exchanges: Map<string, DialogueExchange>;
  activeCharacters: Set<string>;
  totalLines: number;
  totalExchanges: number;
  averageSubtext: number;
  dialogueDensity: number;
  characterVoices: Map<string, SpeakerRole>;
}

// Factory
export function createDialogueOrchestrationState(): DialogueOrchestrationState {
  return {
    exchanges: new Map(),
    activeCharacters: new Set(),
    totalLines: 0,
    totalExchanges: 0,
    averageSubtext: 0.5,
    dialogueDensity: 0.5,
    characterVoices: new Map(),
  };
}

// Register character voice
export function registerCharacterVoice(
  state: DialogueOrchestrationState,
  characterId: string,
  role: SpeakerRole
): DialogueOrchestrationState {
  const characterVoices = new Map(state.characterVoices).set(characterId, role);
  return { ...state, characterVoices };
}

// Add dialogue line
export function addDialogueLine(
  state: DialogueOrchestrationState,
  exchangeId: string,
  line: DialogueLine,
  type: DialogueType
): DialogueOrchestrationState {
  const exchange = state.exchanges.get(exchangeId);
  let updatedExchange: DialogueExchange;

  if (exchange) {
    updatedExchange = {
      ...exchange,
      lines: [...exchange.lines, line],
      type,
      endTime: line.timestamp,
      emotionalArc: [...exchange.emotionalArc, line.emotionalWeight],
    };
  } else {
    updatedExchange = {
      exchangeId,
      participants: [line.speakerId],
      lines: [line],
      startTime: line.timestamp,
      endTime: line.timestamp,
      type,
      emotionalArc: [line.emotionalWeight],
    };
  }

  const exchanges = new Map(state.exchanges).set(exchangeId, updatedExchange);
  const activeCharacters = new Set(state.activeCharacters).add(line.speakerId);

  return recomputeDialogueMetrics({ ...state, exchanges, activeCharacters, totalLines: state.totalLines + 1 });
}

// Get exchange by type
export function getExchangesByType(
  state: DialogueOrchestrationState,
  type: DialogueType
): DialogueExchange[] {
  return Array.from(state.exchanges.values()).filter(e => e.type === type);
}

// Get character dialogues
export function getCharacterDialogues(
  state: DialogueOrchestrationState,
  characterId: string
): DialogueLine[] {
  const result: DialogueLine[] = [];
  state.exchanges.forEach(exchange => {
    exchange.lines.forEach(line => {
      if (line.speakerId === characterId) result.push(line);
    });
  });
  return result;
}

// Get dialogue flow
export function getDialogueFlow(state: DialogueOrchestrationState): DialogueLine[] {
  const allLines: DialogueLine[] = [];
  state.exchanges.forEach(exchange => {
    exchange.lines.forEach(line => allLines.push(line));
  });
  return allLines.sort((a, b) => a.timestamp - b.timestamp);
}

// Analyze subtext
export function analyzeSubtext(state: DialogueOrchestrationState): {
  highSubtext: number;
  lowSubtext: number;
  average: number;
  recommendations: string[];
} {
  const allLines: DialogueLine[] = [];
  state.exchanges.forEach(e => e.lines.forEach(l => allLines.push(l)));

  if (allLines.length === 0) {
    return { highSubtext: 0, lowSubtext: 0, average: 0, recommendations: ['No dialogue yet'] };
  }

  const highSubtext = allLines.filter(l => l.subtext > 0.7).length;
  const lowSubtext = allLines.filter(l => l.subtext < 0.3).length;
  const average = allLines.reduce((s, l) => s + l.subtext, 0) / allLines.length;

  const recommendations: string[] = [];
  if (average < 0.4) recommendations.push('Low subtext — add depth to dialogue');
  if (highSubtext / allLines.length < 0.2) recommendations.push('Few high-subtext lines — strengthen subtext');
  if (lowSubtext / allLines.length > 0.6) recommendations.push('Too many direct lines — add implied meanings');

  return {
    highSubtext,
    lowSubtext,
    average: Math.round(average * 100) / 100,
    recommendations,
  };
}

// Get dialogue report
export function getDialogueReport(state: DialogueOrchestrationState): {
  totalExchanges: number;
  totalLines: number;
  activeCharacterCount: number;
  averageSubtext: number;
  dialogueDensity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalLines < 5) recommendations.push('Few lines — add more dialogue');
  if (state.activeCharacters.size < 2) recommendations.push('Single character — add multi-character scenes');
  if (state.averageSubtext < 0.4) recommendations.push('Low subtext — strengthen implied meanings');
  if (state.dialogueDensity < 0.3) recommendations.push('Low density — increase dialogue frequency');

  return {
    totalExchanges: state.totalExchanges,
    totalLines: state.totalLines,
    activeCharacterCount: state.activeCharacters.size,
    averageSubtext: Math.round(state.averageSubtext * 100) / 100,
    dialogueDensity: Math.round(state.dialogueDensity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDialogueMetrics(state: DialogueOrchestrationState): DialogueOrchestrationState {
  const totalExchanges = state.exchanges.size;
  const allLines: DialogueLine[] = [];
  state.exchanges.forEach(e => e.lines.forEach(l => allLines.push(l)));

  const averageSubtext = allLines.length > 0
    ? allLines.reduce((s, l) => s + l.subtext, 0) / allLines.length
    : 0.5;

  const dialogueDensity = Math.min(1, allLines.length / 50);

  return {
    ...state,
    totalExchanges,
    averageSubtext,
    dialogueDensity,
  };
}

// Reset dialogue state
export function resetDialogueOrchestrationState(): DialogueOrchestrationState {
  return createDialogueOrchestrationState();
}