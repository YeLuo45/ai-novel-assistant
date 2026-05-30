/**
 * Quality Stream Database - V53
 * Dexie tables for real-time quality streaming and sentence feedback
 */

import Dexie, { type Table } from 'dexie'

// Quality stream event log entry
export interface QualityStreamLogEntry {
  id?: number
  sessionId: string
  timestamp: number
  chunkText: string
  accumulatedText: string
  score: number
  metrics: QualityMetrics
  eventType: 'quality_update' | 'sentence_complete' | 'threshold_breach'
}

// Sentence-level feedback entry
export interface SentenceFeedbackEntry {
  id?: number
  sentenceHash: string
  sentenceText: string
  timestamp: number
  suggestions: SentenceSuggestion[]
  qualityScore: number
}

// Quality metrics for 5 dimensions
export interface QualityMetrics {
  coherence: number      // 0-1, 逻辑连贯性
  expression: number    // 0-1, 表达流畅性
  creativity: number    // 0-1, 创意程度
  structure: number     // 0-1, 结构合理性
  engagement: number   // 0-1, 读者吸引力
}

// Sentence suggestion types
export type SuggestionType = 'vocabulary_replacement' | 'sentence_restructuring' | 'logical_connection'

// Individual suggestion
export interface SentenceSuggestion {
  type: SuggestionType
  original: string
  suggestion: string
  reason: string
  confidence: number  // 0-1
}

// Quality stream event for real-time UI updates
export interface QualityStreamEvent {
  type: 'quality_update' | 'sentence_complete' | 'threshold_breach'
  timestamp: number
  score: number
  metrics: QualityMetrics
  accumulatedText: string
  sentenceFeedback?: SentenceSuggestion[]
}

// Database class
export class QualityStreamDatabase extends Dexie {
  qualityStreamLogs!: Table<QualityStreamLogEntry>
  sentenceFeedback!: Table<SentenceFeedbackEntry>

  constructor() {
    super('QualityStreamDB')

    this.version(1).stores({
      qualityStreamLogs: '++id, sessionId, timestamp, eventType',
      sentenceFeedback: '++id, sentenceHash, timestamp, qualityScore'
    })
  }
}

// Singleton instance
export const qualityStreamDb = new QualityStreamDatabase()

// Helper function to hash sentence for deduplication
export function hashSentence(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// Calculate metrics from text (simplified quality scoring)
export function calculateMetrics(text: string): QualityMetrics {
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim())

  // Coherence: sentence count and average length
  const avgLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    : 0
  const coherence = Math.min(1, sentences.length / 5) * Math.min(1, avgLength / 20)

  // Expression: check for varied punctuation and structure
  const punctuationDiversity = (text.match(/[，,、；;]/g) || []).length
  const expression = Math.min(1, punctuationDiversity / 10)

  // Creativity: check for metaphors and descriptive words
  const creativeWords = (text.match(/[像如似仿佛宛如犹如仿佛]/g) || []).length
  const creativity = Math.min(1, creativeWords / 3)

  // Structure: check paragraph count and dialogue
  const paragraphs = text.split(/\n\n/).length
  const dialogueCount = (text.match(/[""][^""]*[""]/g) || []).length
  const structure = Math.min(1, (paragraphs / 3 + dialogueCount / 5) / 2)

  // Engagement: check for emotional words and questions
  const emotionalWords = (text.match(/[高兴悲伤愤怒惊讶恐惧震撼激动]/g) || []).length
  const questions = (text.match(/[？?]/g) || []).length
  const engagement = Math.min(1, (emotionalWords + questions * 0.5) / 5)

  return {
    coherence: Math.round(coherence * 100) / 100,
    expression: Math.round(expression * 100) / 100,
    creativity: Math.round(creativity * 100) / 100,
    structure: Math.round(structure * 100) / 100,
    engagement: Math.round(engagement * 100) / 100
  }
}

// Calculate overall score from metrics
export function calculateOverallScore(metrics: QualityMetrics): number {
  return Math.round(
    (metrics.coherence * 0.3 +
      metrics.expression * 0.25 +
      metrics.creativity * 0.2 +
      metrics.structure * 0.15 +
      metrics.engagement * 0.1) * 100
  ) / 100
}