/**
 * V1014 NarrativeChapterEndEngine — Direction B Iter 10/15 (Round 5)
 * Chapter end engine: chapter endings + chapter-end hooks
 * Sources: thunderbolt chapter + chatdev + nanobot
 */

export type ChapterEndType = 'resolution' | 'cliffhanger' | 'revelation' | 'quiet_moment' | 'mystery_deepens' | 'transformation';
export type ChapterEndStrength = 'weak' | 'moderate' | 'strong' | 'compelling' | 'unforgettable';
export type ChapterEndPurpose = 'satisfaction' | 'curiosity' | 'reflection' | 'emotion' | 'setup' | 'breathing';

export interface ChapterEnding {
  endingId: string;
  type: ChapterEndType;
  strength: ChapterEndStrength;
  purpose: ChapterEndPurpose;
  description: string;
  retention: number;
  anticipation: number;
  chapter: number;
}

export interface ChapterEndPattern {
  patternId: string,
  endingIds: string[],
  cumulativePull: number,
  effectiveness: number,
}

export interface NarrativeChapterEndEngineState {
  endings: Map<string, ChapterEnding>;
  patterns: Map<string, ChapterEndPattern>;
  totalEndings: number;
  totalPatterns: number;
  averageRetention: number;
  averageAnticipation: number;
  patternEffectiveness: number;
  chapterEndMastery: number;
}

// Factory
export function createNarrativeChapterEndEngineState(): NarrativeChapterEndEngineState {
  return {
    endings: new Map(),
    patterns: new Map(),
    totalEndings: 0,
    totalPatterns: 0,
    averageRetention: 0.5,
    averageAnticipation: 0.5,
    patternEffectiveness: 0.5,
    chapterEndMastery: 0.5,
  };
}

// Add ending
export function addChapterEnding(
  state: NarrativeChapterEndEngineState,
  endingId: string,
  type: ChapterEndType,
  strength: ChapterEndStrength,
  purpose: ChapterEndPurpose,
  description: string,
  retention: number,
  anticipation: number,
  chapter: number
): NarrativeChapterEndEngineState {
  const ending: ChapterEnding = { endingId, type, strength, purpose, description, retention, anticipation, chapter };
  const endings = new Map(state.endings).set(endingId, ending);
  return recomputeChapterEnd({ ...state, endings, totalEndings: endings.size });
}

// Create pattern
export function createChapterEndPattern(
  state: NarrativeChapterEndEngineState,
  patternId: string,
  endingIds: string[]
): NarrativeChapterEndEngineState {
  const endings = endingIds.map(id => state.endings.get(id)).filter((e): e is ChapterEnding => e !== undefined);
  const pulls = endings.map(e => e.anticipation);
  const cumulativePull = pulls.length === 0 ? 0.5
    : pulls.reduce((s, p) => s + p, 0) / pulls.length;
  const effectiveness = endings.length === 0 ? 0.5
    : endings.reduce((s, e) => s + e.retention, 0) / endings.length;
  const pattern: ChapterEndPattern = { patternId, endingIds, cumulativePull, effectiveness };
  const patterns = new Map(state.patterns).set(patternId, pattern);
  return recomputeChapterEnd({ ...state, patterns, totalPatterns: patterns.size });
}

// Get endings by type
export function getChapterEndingsByType(state: NarrativeChapterEndEngineState, type: ChapterEndType): ChapterEnding[] {
  return Array.from(state.endings.values()).filter(e => e.type === type);
}

// Get chapter end report
export function getChapterEndReport(state: NarrativeChapterEndEngineState): {
  totalEndings: number;
  totalPatterns: number;
  averageRetention: number;
  averageAnticipation: number;
  chapterEndMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalEndings === 0) recommendations.push('No endings — add chapter endings');
  if (state.averageAnticipation < 0.5) recommendations.push('Low anticipation — strengthen');
  if (state.chapterEndMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalEndings: state.totalEndings,
    totalPatterns: state.totalPatterns,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    averageAnticipation: Math.round(state.averageAnticipation * 100) / 100,
    chapterEndMastery: Math.round(state.chapterEndMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeChapterEnd(state: NarrativeChapterEndEngineState): NarrativeChapterEndEngineState {
  const endings = Array.from(state.endings.values());
  const averageRetention = endings.length === 0 ? 0.5
    : endings.reduce((s, e) => s + e.retention, 0) / endings.length;
  const averageAnticipation = endings.length === 0 ? 0.5
    : endings.reduce((s, e) => s + e.anticipation, 0) / endings.length;

  const patterns = Array.from(state.patterns.values());
  const patternEffectiveness = patterns.length === 0 ? 0.5
    : patterns.reduce((s, p) => s + p.effectiveness, 0) / patterns.length;

  const chapterEndMastery = (averageRetention * 0.4 + averageAnticipation * 0.4 + patternEffectiveness * 0.2);

  return { ...state, averageRetention, averageAnticipation, patternEffectiveness, chapterEndMastery };
}

// Reset
export function resetNarrativeChapterEndEngineState(): NarrativeChapterEndEngineState {
  return createNarrativeChapterEndEngineState();
}