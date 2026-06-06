/**
 * V1010 NarrativeDialogueTagEngine — Direction B Iter 8/15 (Round 5)
 * Dialogue tag engine: dialogue tags + speech attribution
 * Sources: chatdev dialogue + thunderbolt + nanobot
 */

export type TagType = 'said' | 'asked' | 'whispered' | 'shouted' | 'murmured' | 'exclaimed' | 'custom';
export type TagPosition = 'before' | 'after' | 'between' | 'omitted';
export type TagEffectiveness = 'weak' | 'adequate' | 'good' | 'strong' | 'exceptional';

export interface DialogueTag {
  tagId: string;
  type: TagType;
  position: TagPosition;
  effectiveness: TagEffectiveness;
  verb: string;
  context: string;
  clarity: number;
  style: number;
  chapter: number;
}

export interface DialogueExchange {
  exchangeId: string,
  character1Id: string,
  character2Id: string,
  tagIds: string[],
  naturalness: number,
  voice: number,
}

export interface NarrativeDialogueTagEngineState {
  tags: Map<string, DialogueTag>;
  exchanges: Map<string, DialogueExchange>;
  totalTags: number;
  totalExchanges: number;
  averageClarity: number;
  averageStyle: number;
  voiceConsistency: number;
  dialogueTagMastery: number;
}

// Factory
export function createNarrativeDialogueTagEngineState(): NarrativeDialogueTagEngineState {
  return {
    tags: new Map(),
    exchanges: new Map(),
    totalTags: 0,
    totalExchanges: 0,
    averageClarity: 0.5,
    averageStyle: 0.5,
    voiceConsistency: 0.5,
    dialogueTagMastery: 0.5,
  };
}

// Add tag
export function addDialogueTag(
  state: NarrativeDialogueTagEngineState,
  tagId: string,
  type: TagType,
  position: TagPosition,
  effectiveness: TagEffectiveness,
  verb: string,
  context: string,
  clarity: number,
  style: number,
  chapter: number
): NarrativeDialogueTagEngineState {
  const tag: DialogueTag = { tagId, type, position, effectiveness, verb, context, clarity, style, chapter };
  const tags = new Map(state.tags).set(tagId, tag);
  return recomputeDialogueTag({ ...state, tags, totalTags: tags.size });
}

// Create exchange
export function createDialogueExchange(
  state: NarrativeDialogueTagEngineState,
  exchangeId: string,
  character1Id: string,
  character2Id: string,
  tagIds: string[]
): NarrativeDialogueTagEngineState {
  const tags = tagIds.map(id => state.tags.get(id)).filter((t): t is DialogueTag => t !== undefined);
  const naturalness = tags.length === 0 ? 0.5
    : tags.reduce((s, t) => s + t.style, 0) / tags.length;
  const voice = tags.length === 0 ? 0.5
    : tags.reduce((s, t) => s + t.clarity, 0) / tags.length;
  const exchange: DialogueExchange = { exchangeId, character1Id, character2Id, tagIds, naturalness, voice };
  const exchanges = new Map(state.exchanges).set(exchangeId, exchange);
  return recomputeDialogueTag({ ...state, exchanges, totalExchanges: exchanges.size });
}

// Get tags by type
export function getDialogueTagsByType(state: NarrativeDialogueTagEngineState, type: TagType): DialogueTag[] {
  return Array.from(state.tags.values()).filter(t => t.type === type);
}

// Get dialogue report
export function getDialogueTagReport(state: NarrativeDialogueTagEngineState): {
  totalTags: number;
  totalExchanges: number;
  averageClarity: number;
  averageStyle: number;
  dialogueTagMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalTags === 0) recommendations.push('No tags — add dialogue tags');
  if (state.averageClarity < 0.5) recommendations.push('Low clarity — improve');
  if (state.dialogueTagMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalTags: state.totalTags,
    totalExchanges: state.totalExchanges,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    averageStyle: Math.round(state.averageStyle * 100) / 100,
    dialogueTagMastery: Math.round(state.dialogueTagMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeDialogueTag(state: NarrativeDialogueTagEngineState): NarrativeDialogueTagEngineState {
  const tags = Array.from(state.tags.values());
  const averageClarity = tags.length === 0 ? 0.5
    : tags.reduce((s, t) => s + t.clarity, 0) / tags.length;
  const averageStyle = tags.length === 0 ? 0.5
    : tags.reduce((s, t) => s + t.style, 0) / tags.length;

  const exchanges = Array.from(state.exchanges.values());
  const voiceConsistency = exchanges.length === 0 ? 0.5
    : exchanges.reduce((s, e) => s + e.voice, 0) / exchanges.length;

  const dialogueTagMastery = (averageClarity * 0.3 + averageStyle * 0.3 + voiceConsistency * 0.4);

  return { ...state, averageClarity, averageStyle, voiceConsistency, dialogueTagMastery };
}

// Reset
export function resetNarrativeDialogueTagEngineState(): NarrativeDialogueTagEngineState {
  return createNarrativeDialogueTagEngineState();
}