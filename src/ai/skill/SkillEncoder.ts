// V2296 SkillEncoder - Direction K Iter 1/30
// Encode skill to compact wire format
// Source: thunderbolt
export interface EncodedSkill {
  raw: string;
  hash: string;
  tokens: number;
  format: 'markdown' | 'code' | 'json' | 'plain';
  ts: number;
}

export interface SkillEncoderState {
  encodings: Map<string, EncodedSkill>;
  counter: number;
}

export function createSkillEncoderState(): SkillEncoderState {
  return { encodings: new Map(), counter: 0 };
}

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

export function encodeSkill(state: SkillEncoderState, raw: string, format: 'markdown' | 'code' | 'json' | 'plain' = 'markdown'): { state: SkillEncoderState; skill: EncodedSkill } {
  state.counter++;
  const skill: EncodedSkill = { raw, hash: fnv1a(raw), tokens: estimateTokens(raw), format, ts: Date.now() };
  const encodings = new Map(state.encodings);
  encodings.set(raw, skill);
  return { state: { ...state, encodings }, skill };
}

export function getEncodedSkill(state: SkillEncoderState, raw: string): EncodedSkill | undefined {
  return state.encodings.get(raw);
}

export function skillCount(state: SkillEncoderState): number {
  return state.encodings.size;
}

export function skillsByFormat(state: SkillEncoderState, format: string): EncodedSkill[] {
  return Array.from(state.encodings.values()).filter((s) => s.format === format);
}

export function skillEncoderHealth(state: SkillEncoderState): { count: number; health: number } {
  return { count: state.encodings.size, health: state.encodings.size > 0 ? 1 : 0.5 };
}
