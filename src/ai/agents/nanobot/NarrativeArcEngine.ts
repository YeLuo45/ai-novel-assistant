/**
 * NarrativeArcEngine - V158
 * Story Arc Tracking & Climax Prediction Engine
 */

export type ArcPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'
export type ArcType = 'hero' | 'fall' | 'transformation' | 'rebirth' | 'quest' | 'intrigue' | 'tragedy' | 'comedy'

export interface ArcSegment {
  segmentId: string
  startChapter: number
  endChapter: number
  phase: ArcPhase
  tensionLevel: number  // 0-100
  keyEvents: string[]
  characterFocus: string[]
}

export interface NarrativeArc {
  arcId: string
  arcType: ArcType
  title: string
  segments: ArcSegment[]
  currentPhase: ArcPhase
  projectedClimaxChapter: number | null
  actualClimaxChapter: number | null
  theme: string
  protagonist: string
}

export interface ArcState {
  arcs: Map<string, NarrativeArc>
  currentStoryId: string | null
  chapterCount: number
  globalTensionCurve: Array<{chapter: number; tension: number}>
  predictedClimax: number | null
  warnings: string[]
}

// State Management
export function createEmptyArcState(): ArcState {
  return { arcs: new Map(), currentStoryId: null, chapterCount: 0, globalTensionCurve: [], predictedClimax: null, warnings: [] };
}

export function createArc(arcId: string, arcType: ArcType, title: string, protagonist: string, theme: string): NarrativeArc {
  return { arcId, arcType, title, segments: [], currentPhase: 'setup', projectedClimaxChapter: null, actualClimaxChapter: null, theme, protagonist };
}

export function registerArc(state: ArcState, arc: NarrativeArc): ArcState {
  const newArcs = new Map(state.arcs);
  newArcs.set(arc.arcId, arc);
  return { ...state, arcs: newArcs, currentStoryId: arc.arcId.split('_')[0] || state.currentStoryId };
}

// Segment Management
export function addSegment(state: ArcState, arcId: string, segment: Omit<ArcSegment, 'segmentId'>): ArcState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;
  
  const newSegment: ArcSegment = { ...segment, segmentId: 'seg_' + Date.now() };
  const updated = { ...arc, segments: [...arc.segments, newSegment] };
  const newArcs = new Map(state.arcs);
  newArcs.set(arcId, updated);
  return { ...state, arcs: newArcs };
}

// Phase Detection
export function detectCurrentPhase(segments: ArcSegment[]): ArcPhase {
  if (!segments.length) return 'setup';
  const last = segments[segments.length - 1];
  return last.phase;
}

export function calculateTension(segments: ArcSegment[]): number {
  if (!segments.length) return 0;
  const last = segments[segments.length - 1];
  return last.tensionLevel;
}

// Climax Prediction (based on arc structure)
export function predictClimax(state: ArcState, arcId: string): number | null {
  const arc = state.arcs.get(arcId);
  if (!arc) return null;
  
  // Hero arc: climax at ~70% through
  // Tragedy: climax at ~80-90%
  // Quest: climax at ~60%
  const multipliers: Record<ArcType, number> = {
    hero: 0.70, fall: 0.85, transformation: 0.65, rebirth: 0.68,
    quest: 0.60, intrigue: 0.75, tragedy: 0.85, comedy: 0.50
  };
  const mult = multipliers[arc.arcType] || 0.70;
  return Math.round(state.chapterCount * mult);
}

// Update Arc Progress
export function updateArcPhase(state: ArcState, arcId: string): ArcState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;
  
  const phase = detectCurrentPhase(arc.segments);
  const tension = calculateTension(arc.segments);
  const predicted = predictClimax(state, arcId);
  
  const updated = { ...arc, currentPhase: phase, projectedClimaxChapter: predicted };
  const newArcs = new Map(state.arcs);
  newArcs.set(arcId, updated);
  
  // Global tension tracking
  const newCurve = [...state.globalTensionCurve];
  if (newCurve.length === 0 || newCurve[newCurve.length - 1].chapter < state.chapterCount) {
    newCurve.push({ chapter: state.chapterCount, tension });
  }
  
  return { ...state, arcs: newArcs, globalTensionCurve: newCurve, predictedClimax: predicted };
}

// Record Climax
export function recordClimax(state: ArcState, arcId: string, chapter: number): ArcState {
  const arc = state.arcs.get(arcId);
  if (!arc) return state;
  
  const updated = { ...arc, actualClimaxChapter: chapter };
  const newArcs = new Map(state.arcs);
  newArcs.set(arcId, updated);
  return { ...state, arcs: newArcs };
}

// Validation
export function validateArcStructure(arc: NarrativeArc): {valid: boolean; issues: string[]} {
  const issues: string[] = [];
  
  if (arc.segments.length < 3) issues.push('Arc needs at least 3 segments');
  
  const phases = arc.segments.map(s => s.phase);
  if (!phases.includes('climax')) issues.push('Arc missing climax phase');
  if (!phases.includes('resolution') && arc.segments.length > 5) issues.push('Arc missing resolution');
  
  // Check tension progression
  for (let i = 1; i < arc.segments.length; i++) {
    if (arc.segments[i].tensionLevel < arc.segments[i-1].tensionLevel && arc.segments[i].phase === 'rising') {
      issues.push('Tension should increase during rising action');
      break;
    }
  }
  
  return { valid: issues.length === 0, issues };
}

// Chapter count
export function incrementChapter(state: ArcState): ArcState {
  return { ...state, chapterCount: state.chapterCount + 1 };
}

// Formatters
export function formatArcSummary(arc: NarrativeArc): string {
  let s = '=== ' + arc.title + ' (' + arc.arcType + ') ===\n';
  s += 'Protagonist: ' + arc.protagonist + '\n';
  s += 'Theme: ' + arc.theme + '\n';
  s += 'Current Phase: ' + arc.currentPhase + '\n';
  s += 'Segments: ' + arc.segments.length + '\n';
  if (arc.projectedClimaxChapter) s += 'Projected Climax: Chapter ' + arc.projectedClimaxChapter + '\n';
  if (arc.actualClimaxChapter) s += 'Actual Climax: Chapter ' + arc.actualClimaxChapter + '\n';
  return s;
}

export function formatArcDashboard(state: ArcState): string {
  let s = '=== Narrative Arc Dashboard ===\n';
  s += 'Total Arcs: ' + state.arcs.size + '\n';
  s += 'Chapter Count: ' + state.chapterCount + '\n';
  if (state.predictedClimax) s += 'Global Predicted Climax: Chapter ' + state.predictedClimax + '\n';
  s += '\n--- Arcs ---\n';
  for (const [id, arc] of state.arcs) {
    s += formatArcSummary(arc) + '\n';
  }
  if (state.warnings.length) {
    s += '\n--- Warnings ---\n';
    for (const w of state.warnings) s += '⚠ ' + w + '\n';
  }
  return s;
}
