/**
 * V822 NarrativeLearningEngine — Direction E Iter 7/9 (Round 3)
 * Narrative learning engine: continuous learning + skill acquisition
 * Sources: generic-agent learning + thunderbolt + nanobot
 */

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'social';
export type LearningPhase = 'acquisition' | 'practice' | 'mastery' | 'transfer' | 'forgetting';
export type SkillLevel = 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert';

export interface LearningExperience {
  experienceId: string;
  subject: string;
  style: LearningStyle;
  phase: LearningPhase;
  duration: number;
  retention: number;
  transferScore: number;
  timestamp: number;
}

export interface Skill {
  skillId: string;
  name: string;
  level: SkillLevel;
  progress: number;
  practiceHours: number;
  lastImproved: number;
  prerequisites: string[];
}

export interface NarrativeLearningEngineState {
  experiences: Map<string, LearningExperience>;
  skills: Map<string, Skill>;
  totalExperiences: number;
  totalSkills: number;
  averageRetention: number;
  averageProgress: number;
  learningVelocity: number;
  masteryCount: number;
  learningBalance: number;
}

// Factory
export function createNarrativeLearningEngineState(): NarrativeLearningEngineState {
  return {
    experiences: new Map(),
    skills: new Map(),
    totalExperiences: 0,
    totalSkills: 0,
    averageRetention: 0.5,
    averageProgress: 0,
    learningVelocity: 0,
    masteryCount: 0,
    learningBalance: 0.5,
  };
}

// Record experience
export function recordLearningExperience(
  state: NarrativeLearningEngineState,
  experienceId: string,
  subject: string,
  style: LearningStyle,
  phase: LearningPhase,
  duration: number,
  retention: number = 0.5,
  transferScore: number = 0.5
): NarrativeLearningEngineState {
  const experience: LearningExperience = {
    experienceId, subject, style, phase, duration,
    retention: Math.min(1, Math.max(0, retention)),
    transferScore: Math.min(1, Math.max(0, transferScore)),
    timestamp: Date.now(),
  };
  const experiences = new Map(state.experiences).set(experienceId, experience);
  return recomputeLearning({ ...state, experiences, totalExperiences: experiences.size });
}

// Add skill
export function addSkill(
  state: NarrativeLearningEngineState,
  skillId: string,
  name: string,
  level: SkillLevel = 'novice',
  prerequisites: string[] = []
): NarrativeLearningEngineState {
  const skill: Skill = {
    skillId, name, level, progress: 0,
    practiceHours: 0, lastImproved: Date.now(), prerequisites,
  };
  const skills = new Map(state.skills).set(skillId, skill);
  return recomputeLearning({ ...state, skills, totalSkills: skills.size });
}

// Practice skill
export function practiceSkill(state: NarrativeLearningEngineState, skillId: string, hours: number): NarrativeLearningEngineState {
  const skill = state.skills.get(skillId);
  if (!skill) return state;

  // 10 hours = 10% progress
  const newProgress = Math.min(1, skill.progress + hours / 100);
  const level: SkillLevel = newProgress < 0.2 ? 'novice'
    : newProgress < 0.4 ? 'beginner'
    : newProgress < 0.6 ? 'competent'
    : newProgress < 0.8 ? 'proficient'
    : 'expert';
  const updated: Skill = { ...skill, level, progress: newProgress, practiceHours: skill.practiceHours + hours, lastImproved: Date.now() };
  const skills = new Map(state.skills).set(skillId, updated);
  return recomputeLearning({ ...state, skills });
}

// Get experiences by style
export function getExperiencesByStyle(state: NarrativeLearningEngineState, style: LearningStyle): LearningExperience[] {
  return Array.from(state.experiences.values()).filter(e => e.style === style);
}

// Get skills by level
export function getSkillsByLevel(state: NarrativeLearningEngineState, level: SkillLevel): Skill[] {
  return Array.from(state.skills.values()).filter(s => s.level === level);
}

// Get learning report
export function getLearningEngineReport(state: NarrativeLearningEngineState): {
  totalExperiences: number;
  totalSkills: number;
  averageRetention: number;
  averageProgress: number;
  learningVelocity: number;
  masteryCount: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalSkills === 0) recommendations.push('No skills — add skills');
  if (state.averageRetention < 0.4) recommendations.push('Low retention — reinforce learning');
  if (state.learningBalance < 0.3) recommendations.push('Imbalanced — diversify styles');

  return {
    totalExperiences: state.totalExperiences,
    totalSkills: state.totalSkills,
    averageRetention: Math.round(state.averageRetention * 100) / 100,
    averageProgress: Math.round(state.averageProgress * 100) / 100,
    learningVelocity: Math.round(state.learningVelocity * 100) / 100,
    masteryCount: state.masteryCount,
    recommendations,
  };
}

// Recompute metrics
function recomputeLearning(state: NarrativeLearningEngineState): NarrativeLearningEngineState {
  const experiences = Array.from(state.experiences.values());
  const averageRetention = experiences.length === 0 ? 0.5
    : experiences.reduce((s, e) => s + e.retention, 0) / experiences.length;

  const skills = Array.from(state.skills.values());
  const averageProgress = skills.length === 0 ? 0
    : skills.reduce((s, sk) => s + sk.progress, 0) / skills.length;

  const styleSet = new Set(experiences.map(e => e.style));
  const learningBalance = Math.min(1, styleSet.size / 5);

  const learningVelocity = state.totalExperiences === 0 ? 0
    : Math.min(1, state.totalExperiences / 10);
  const masteryCount = skills.filter(s => s.level === 'expert').length;

  return { ...state, averageRetention, averageProgress, learningBalance, learningVelocity, masteryCount };
}

// Reset learning state
export function resetNarrativeLearningEngineState(): NarrativeLearningEngineState {
  return createNarrativeLearningEngineState();
}