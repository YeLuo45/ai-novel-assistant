/**
 * V698 ProseStyleEngine — Direction B Iter 8/9 (Round 2)
 * Prose style engine: sentence variety + word choice + rhythm + clarity
 * Sources: chatdev style + thunderbolt quality + nanobot
 */

export type StyleDimension = 'clarity' | 'conciseness' | 'imagery' | 'rhythm' | 'voice' | 'economy';
export type StyleScore = 'poor' | 'fair' | 'good' | 'excellent';

export interface StyleMetrics {
  sentenceLengthAvg: number;
  sentenceLengthVariance: number;
  wordComplexity: number;
  passiveVoiceRatio: number;
  adverbUsage: number;
  metaphorDensity: number;
  lexicalDiversity: number;
}

export interface ProseStyleState {
  metrics: StyleMetrics;
  styleScores: Map<StyleDimension, StyleScore>;
  totalAnalyses: number;
  averageClarity: number;
  overallQuality: number;
  improvements: string[];
}

// Factory
export function createProseStyleState(): ProseStyleState {
  return {
    metrics: {
      sentenceLengthAvg: 15,
      sentenceLengthVariance: 5,
      wordComplexity: 0.5,
      passiveVoiceRatio: 0.2,
      adverbUsage: 0.1,
      metaphorDensity: 0.3,
      lexicalDiversity: 0.5,
    },
    styleScores: new Map(),
    totalAnalyses: 0,
    averageClarity: 0.7,
    overallQuality: 0.7,
    improvements: [],
  };
}

// Analyze prose
export function analyzeProse(state: ProseStyleState, text: string): ProseStyleState {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  const sentenceLengthAvg = sentences.length > 0
    ? words.length / sentences.length
    : 15;

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const mean = sentenceLengthAvg;
  const sentenceLengthVariance = sentenceLengths.length > 0
    ? sentenceLengths.reduce((s, l) => s + Math.pow(l - mean, 2), 0) / sentenceLengths.length
    : 0;

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 0;

  const passiveMatches = (text.match(/\b(is|was|were|are|been)\s+\w+ed\b/gi) || []).length;
  const passiveVoiceRatio = words.length > 0 ? passiveMatches / words.length : 0;

  const adverbMatches = (text.match(/\b\w+ly\b/g) || []).length;
  const adverbUsage = words.length > 0 ? adverbMatches / words.length : 0;

  const wordLengths = words.map(w => w.length);
  const avgWordLength = wordLengths.length > 0
    ? wordLengths.reduce((s, l) => s + l, 0) / wordLengths.length
    : 5;
  const wordComplexity = Math.min(1, avgWordLength / 8);

  const metaphorIndicators = (text.match(/\b(as|like)\b/gi) || []).length;
  const metaphorDensity = words.length > 0 ? Math.min(1, metaphorIndicators / (words.length / 10)) : 0;

  const metrics: StyleMetrics = {
    sentenceLengthAvg,
    sentenceLengthVariance,
    wordComplexity,
    passiveVoiceRatio,
    adverbUsage,
    metaphorDensity,
    lexicalDiversity,
  };

  const styleScores = computeStyleScores(metrics);
  const improvements = generateImprovements(metrics);

  const averageClarity = 1 - Math.min(1, passiveVoiceRatio * 2 + adverbUsage);
  const overallQuality = computeOverallQuality(styleScores);

  return {
    ...state,
    metrics,
    styleScores,
    improvements,
    averageClarity,
    overallQuality,
    totalAnalyses: state.totalAnalyses + 1,
  };
}

// Compute style scores
function computeStyleScores(metrics: StyleMetrics): Map<StyleDimension, StyleScore> {
  const scores = new Map<StyleDimension, StyleScore>();

  // Clarity (based on sentence length and passive voice)
  const clarityScore = metrics.sentenceLengthAvg < 20 && metrics.passiveVoiceRatio < 0.15 ? 'excellent' :
    metrics.sentenceLengthAvg < 30 ? 'good' : 'fair';
  scores.set('clarity', clarityScore);

  // Conciseness
  const concisenessScore = metrics.sentenceLengthAvg < 18 ? 'excellent' :
    metrics.sentenceLengthAvg < 25 ? 'good' : 'fair';
  scores.set('conciseness', concisenessScore);

  // Imagery (based on metaphor density)
  const imageryScore = metrics.metaphorDensity > 0.4 ? 'excellent' :
    metrics.metaphorDensity > 0.2 ? 'good' : 'fair';
  scores.set('imagery', imageryScore);

  // Rhythm (based on variance)
  const rhythmScore = metrics.sentenceLengthVariance > 5 && metrics.sentenceLengthVariance < 15 ? 'excellent' :
    metrics.sentenceLengthVariance > 2 ? 'good' : 'fair';
  scores.set('rhythm', rhythmScore);

  // Voice (based on passive voice ratio)
  const voiceScore = metrics.passiveVoiceRatio < 0.1 ? 'excellent' :
    metrics.passiveVoiceRatio < 0.2 ? 'good' : 'fair';
  scores.set('voice', voiceScore);

  // Economy (based on adverb usage)
  const economyScore = metrics.adverbUsage < 0.05 ? 'excellent' :
    metrics.adverbUsage < 0.1 ? 'good' : 'fair';
  scores.set('economy', economyScore);

  return scores;
}

// Generate improvements
function generateImprovements(metrics: StyleMetrics): string[] {
  const improvements: string[] = [];
  if (metrics.passiveVoiceRatio > 0.2) improvements.push('Reduce passive voice');
  if (metrics.adverbUsage > 0.1) improvements.push('Cut unnecessary adverbs');
  if (metrics.sentenceLengthAvg > 25) improvements.push('Break up long sentences');
  if (metrics.sentenceLengthVariance < 2) improvements.push('Vary sentence length');
  if (metrics.metaphorDensity < 0.1) improvements.push('Add more imagery');
  return improvements;
}

// Compute overall quality
function computeOverallQuality(scores: Map<StyleDimension, StyleScore>): number {
  const qualityMap: Record<StyleScore, number> = { poor: 0.25, fair: 0.5, good: 0.75, excellent: 1.0 };
  const values = Array.from(scores.values()).map(s => qualityMap[s]);
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0.7;
}

// Get style report
export function getStyleReport(state: ProseStyleState): {
  totalAnalyses: number;
  averageClarity: number;
  overallQuality: number;
  styleScores: Record<string, string>;
  improvements: string[];
} {
  const styleScores: Record<string, string> = {};
  state.styleScores.forEach((score, dim) => {
    styleScores[dim] = score;
  });

  return {
    totalAnalyses: state.totalAnalyses,
    averageClarity: Math.round(state.averageClarity * 100) / 100,
    overallQuality: Math.round(state.overallQuality * 100) / 100,
    styleScores,
    improvements: state.improvements,
  };
}

// Reset prose state
export function resetProseStyleState(): ProseStyleState {
  return createProseStyleState();
}