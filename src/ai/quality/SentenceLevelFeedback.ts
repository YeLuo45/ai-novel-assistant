/**
 * Sentence-Level Feedback - V53
 * Analyzes sentences and provides improvement suggestions
 */

import {
  type SentenceSuggestion,
  type SuggestionType,
  hashSentence,
  type SentenceFeedbackEntry,
  qualityStreamDb
} from './qualityStreamDb'

// LLM API integration placeholder
// Real implementation would use enrichProviderWithApiKey + callLLM

/**
 * Analyze a sentence and return improvement suggestions
 */
export async function analyzeSentence(sentence: string): Promise<SentenceSuggestion[]> {
  if (!sentence || sentence.trim().length < 5) {
    return []
  }

  const suggestions: SentenceSuggestion[] = []

  // 1. Check vocabulary repetition
  const words = sentence.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const wordFreq = new Map<string, number>()
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  }

  for (const [word, count] of Array.from(wordFreq.entries())) {
    if (count >= 3 && word.length > 2) {
      suggestions.push({
        type: 'vocabulary_replacement',
        original: word,
        suggestion: `[建议替换: ${word}]`,
        reason: `词语 "${word}" 出现 ${count} 次，建议使用同义词增加多样性`,
        confidence: 0.85
      })
    }
  }

  // 2. Check for sentence restructuring needs
  if (sentence.length > 100) {
    // Very long sentence
    suggestions.push({
      type: 'sentence_restructuring',
      original: sentence.substring(0, 40) + '...',
      suggestion: '建议将长句拆分为 2-3 个短句',
      reason: `句子长度 ${sentence.length} 字，过长会影响阅读节奏`,
      confidence: 0.8
    })
  }

  // Check for run-on sentences (no punctuation in long text)
  if (sentence.length > 50 && !/[，,。！？;；]/.test(sentence)) {
    suggestions.push({
      type: 'sentence_restructuring',
      original: sentence.substring(0, 30) + '...',
      suggestion: '建议在适当位置添加逗号或分号',
      reason: '句子缺少停顿标志，建议添加标点分隔',
      confidence: 0.75
    })
  }

// 3. Check for logical connection issues
  // Look for sentences starting with 但/却/然而/不过 without preceding context
  const logicalStarters = /^[但却然而不过可是]/
  if (logicalStarters.test(sentence)) {
    suggestions.push({
      type: 'logical_connection',
      original: sentence.substring(0, 10),
      suggestion: '注意上下文衔接',
      reason: '句子以转折词开头，需确保前文有明确的对照内容',
      confidence: 0.7
    })
  }

  // Check for "然后" overuse (common in Chinese writing)
  const thenCount = (sentence.match(/然后/g) || []).length
  if (thenCount >= 2) {
    suggestions.push({
      type: 'logical_connection',
      original: '然后' + (thenCount > 2 ? ` (出现${thenCount}次)` : ''),
      suggestion: '可用"接着"、"随后"、"之后"等替换部分"然后"',
      reason: '"然后"使用过于频繁，建议多样化表达',
      confidence: 0.75
    })
  }

  // Store feedback in database
  const feedbackEntry: SentenceFeedbackEntry = {
    sentenceHash: hashSentence(sentence),
    sentenceText: sentence,
    timestamp: Date.now(),
    suggestions,
    qualityScore: calculateSentenceScore(suggestions)
  }
  await qualityStreamDb.sentenceFeedback.add(feedbackEntry)

  return suggestions
}

/**
 * Analyze multiple sentences
 */
export async function analyzeSentences(sentences: string[]): Promise<Map<string, SentenceSuggestion[]>> {
  const results = new Map<string, SentenceSuggestion[]>()

  for (const sentence of sentences) {
    if (sentence.trim().length >= 5) {
      const suggestions = await analyzeSentence(sentence)
      if (suggestions.length > 0) {
        results.set(sentence, suggestions)
      }
    }
  }

  return results
}

/**
 * Get cached feedback for a sentence hash
 */
export async function getCachedFeedback(sentenceHash: string): Promise<SentenceSuggestion[] | null> {
  const entry = await qualityStreamDb.sentenceFeedback
    .where('sentenceHash')
    .equals(sentenceHash)
    .first()

  return entry?.suggestions || null
}

/**
 * Calculate quality score from suggestions
 */
function calculateSentenceScore(suggestions: SentenceSuggestion[]): number {
  if (suggestions.length === 0) return 1.0

  // Weight by confidence and type
  let penalty = 0
  for (const s of suggestions) {
    // Higher confidence = more serious issue
    penalty += (1 - s.confidence) * 0.2
  }

  return Math.max(0.3, 1.0 - penalty)
}

/**
 * Batch analyze sentences for performance
 */
export async function batchAnalyzeSentences(
  sentences: string[],
  batchSize = 10
): Promise<Map<string, SentenceSuggestion[]>> {
  const results = new Map<string, SentenceSuggestion[]>()

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize)
    const batchResults = await analyzeSentences(batch)

    for (const [sentence, suggestions] of batchResults) {
      results.set(sentence, suggestions)
    }
  }

  return results
}