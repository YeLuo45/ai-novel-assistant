/**
 * SceneTransitionValidator - V154
 * Scene Continuity & Transition Validation Engine
 */

export type TransitionQuality = 'seamless' | 'abrupt' | 'overlapped' | 'confusing' | 'incomplete'
export type TransitionType = 'scene_to_scene' | 'time_jump' | 'perspective_shift' | 'parallel_action' | 'montage' | 'fade' | 'cut'

export interface SceneElement {
  sceneId: string; location: string; timeOfDay: string; characters: string[]; mood: string; duration: number; transitionFrom: string | null; transitionTo: string | null;
}

export interface TransitionValidation {
  fromScene: string; toScene: string; quality: TransitionQuality; transitionType: TransitionType; continuityScore: number; issues: string[]; suggestions: string[];
}

export interface TransitionState {
  scenes: Map<string, SceneElement>; transitions: Map<string, TransitionValidation>; validationHistory: Array<{timestamp: number; from: string; to: string; quality: TransitionQuality}>; currentStoryId: string | null; lastValidatedTransition: string | null;
}

export function createEmptyValidatorState(): TransitionState {
  return { scenes: new Map(), transitions: new Map(), validationHistory: [], currentStoryId: null, lastValidatedTransition: null };
}

export function createSceneElement(sceneId: string, location: string, timeOfDay: string, characters: string[], mood: string, duration: number = 0): SceneElement {
  return { sceneId, location, timeOfDay, characters, mood, duration, transitionFrom: null, transitionTo: null };
}

export function registerScene(state: TransitionState, scene: SceneElement): TransitionState {
  const newScenes = new Map(state.scenes);
  newScenes.set(scene.sceneId, scene);
  return { ...state, scenes: newScenes, currentStoryId: scene.sceneId.split('_')[0] || state.currentStoryId };
}

const LOC_MAP: Record<string, string[]> = { indoor: ['indoor','covered'], outdoor: ['outdoor','nature'], urban: ['city','street'], rural: ['village','countryside'] };
const TIME_MAP: Record<string, string[]> = { dawn: ['dawn','morning'], morning: ['dawn','morning','midday'], midday: ['morning','midday'], afternoon: ['midday','afternoon'], evening: ['afternoon','evening'], night: ['evening','night'], midnight: ['night','midnight'] };

function getLocCat(loc: string): string {
  const l = loc.toLowerCase();
  for (const [cat, kws] of Object.entries(LOC_MAP)) if (kws.some(k => l.includes(k))) return cat;
  return 'unknown';
}

function getTimeCat(time: string): string {
  const l = time.toLowerCase();
  for (const [cat, kws] of Object.entries(TIME_MAP)) if (kws.some(k => l.includes(k))) return cat;
  return 'unknown';
}

function charOverlap(c1: string[], c2: string[]): number {
  if (!c1.length || !c2.length) return 50;
  const ov = c1.filter(c => c2.includes(c)).length;
  return (ov / Math.max(c1.length, c2.length)) * 100;
}

function inferType(from: SceneElement, to: SceneElement): TransitionType {
  const fc = getLocCat(from.location), tc = getLocCat(to.location);
  const ft = getTimeCat(from.timeOfDay), tt = getTimeCat(to.timeOfDay);
  const times = ['dawn','morning','midday','afternoon','evening','night','midnight'];
  const fi = times.indexOf(ft), ti = times.indexOf(tt);
  if (ft !== tt && fc === tc) return 'time_jump';
  if (fc !== tc && Math.abs(fi - ti) > 2) return 'scene_to_scene';
  if (fc !== tc && ft === tt) return 'cut';
  if (charOverlap(from.characters, to.characters) < 30) return 'parallel_action';
  return 'scene_to_scene';
}

export function validateTransition(fromScene: SceneElement, toScene: SceneElement): TransitionValidation {
  const issues: string[] = [], suggestions: string[] = [];
  const fc = getLocCat(fromScene.location), tc = getLocCat(toScene.location);
  if (fc !== 'unknown' && tc !== 'unknown' && fc !== tc) {
    if (fc === 'indoor' && tc === 'outdoor') { issues.push('Abrupt transition from indoor to outdoor'); suggestions.push('Add transitional scene'); }
    if (fc === 'urban' && tc === 'rural') { issues.push('Major location shift'); suggestions.push('Add context for the journey'); }
  }
  const ft = getTimeCat(fromScene.timeOfDay), tt = getTimeCat(toScene.timeOfDay);
  if (ft !== 'unknown' && tt !== 'unknown') {
    const times = ['dawn','morning','midday','afternoon','evening','night','midnight'];
    const diff = Math.abs(times.indexOf(ft) - times.indexOf(tt));
    if (diff > 3) { issues.push('Large time gap'); suggestions.push('Consider montage'); }
  }
  const co = charOverlap(fromScene.characters, toScene.characters);
  if (co < 30 && fromScene.characters.length && toScene.characters.length) {
    issues.push('Low character continuity'); suggestions.push('Verify parallel narrative');
  }
  let score = 100 - issues.length * 15 - suggestions.length * 8 - Math.max(0, (5 - co) * 2);
  let quality: TransitionQuality = score >= 85 ? 'seamless' : score >= 65 ? 'abrupt' : score >= 45 ? 'overlapped' : score >= 25 ? 'confusing' : 'incomplete';
  return { fromScene: fromScene.sceneId, toScene: toScene.sceneId, quality, transitionType: inferType(fromScene, toScene), continuityScore: Math.max(0, score), issues, suggestions };
}

export function validateScenePair(state: TransitionState, fromId: string, toId: string): TransitionState {
  const fromScene = state.scenes.get(fromId), toScene = state.scenes.get(toId);
  if (!fromScene || !toScene) return state;
  const validation = validateTransition(fromScene, toScene);
  const key = fromId + '→' + toId;
  const newTrans = new Map(state.transitions); newTrans.set(key, validation);
  return { ...state, transitions: newTrans, validationHistory: [...state.validationHistory.slice(-49), {timestamp: Date.now(), from: fromId, to: toId, quality: validation.quality}], lastValidatedTransition: key };
}

export function validateAllTransitions(state: TransitionState): TransitionState {
  let ns = {...state};
  for (const [id, scene] of state.scenes) if (scene.transitionTo) ns = validateScenePair(ns, id, scene.transitionTo);
  return ns;
}

export function getTransitionReport(state: TransitionState) {
  const ts = Array.from(state.transitions.values());
  if (!ts.length) return {total:0,seamless:0,abrupt:0,overlapped:0,confusing:0,incomplete:0,avgScore:0};
  return { total: ts.length, seamless: ts.filter(t=>t.quality==='seamless').length, abrupt: ts.filter(t=>t.quality==='abrupt').length, overlapped: ts.filter(t=>t.quality==='overlapped').length, confusing: ts.filter(t=>t.quality==='confusing').length, incomplete: ts.filter(t=>t.quality==='incomplete').length, avgScore: ts.reduce((a,t)=>a+t.continuityScore,0)/ts.length };
}

export function formatTransitionValidation(v: TransitionValidation): string {
  let s = 'Transition: ' + v.fromScene + ' → ' + v.toScene + '\nQuality: ' + v.quality + ' (' + v.continuityScore + '%)\nType: ' + v.transitionType;
  if (v.issues.length) { s += '\n\nIssues:'; v.issues.forEach(i => { s += '\n  ⚠ ' + i; }); }
  if (v.suggestions.length) { s += '\n\nSuggestions:'; v.suggestions.forEach(sg => { s += '\n  → ' + sg; }); }
  return s;
}

export function formatTransitionDashboard(state: TransitionState): string {
  let s = '=== Scene Transition Validation Dashboard ===\nScenes registered: ' + state.scenes.size + '\nTransitions validated: ' + state.transitions.size + '\n\n';
  const r = getTransitionReport(state);
  if (r.total) {
    s += '--- Transition Quality Summary ---\n  Seamless: ' + r.seamless + '\n  Abrupt: ' + r.abrupt + '\n  Overlapped: ' + r.overlapped + '\n  Confusing: ' + r.confusing + '\n  Incomplete: ' + r.incomplete + '\n  Average Score: ' + r.avgScore.toFixed(1) + '%\n\n';
    const prob = Array.from(state.transitions.values()).filter(t => t.quality === 'confusing' || t.quality === 'incomplete');
    if (prob.length) { s += '--- Transitions Needing Attention ---\n'; prob.slice(0,3).forEach(p => { s += '  ' + p.fromScene + ' → ' + p.toScene + ': ' + p.quality + '\n'; }); }
  }
  return s;
}
