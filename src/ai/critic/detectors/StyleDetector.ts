/**
 * Style Detector
 * Detects style inconsistencies by comparing with previous chapter vocabulary
 */

import type { Detector, QualityIssue, CriticContext } from '../types'

export class StyleDetector implements Detector {
  name = 'style'

  private readonly LOWERCASE_WORDS_TO_IGNORE = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'up', 'down',
    'out', 'over', 'under', 'again', 'further', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
  ])

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { paragraph, previousChapterVocabulary } = context

    if (!previousChapterVocabulary || previousChapterVocabulary.length === 0) {
      return issues
    }

    const paragraphWords = this.extractWords(paragraph)
    const paragraphWordSet = new Set(paragraphWords)

    // Find words not seen in previous chapters
    const newWords = paragraphWords.filter(w => !previousChapterVocabulary.includes(w.toLowerCase()))

    // Count overused words in this paragraph
    const wordFrequency = this.countWordFrequency(paragraphWords)
    const overusedWords = Object.entries(wordFrequency)
      .filter(([_, count]) => count >= 3)
      .map(([word]) => word)

    if (overusedWords.length > 0) {
      const wordList = overusedWords.slice(0, 5).join('、')
      issues.push({
        type: 'style',
        severity: 'warning',
        position: {
          start: 0,
          end: paragraph.length
        },
        message: `段落中发现重复使用3次以上的词汇：${wordList}`,
        suggestion: `建议使用同义词替换或改变句式结构`
      })
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const { paragraph, previousChapterVocabulary } = context

    if (!previousChapterVocabulary || previousChapterVocabulary.length === 0) {
      return 80 // No previous data to compare
    }

    const paragraphWords = this.extractWords(paragraph)
    const newWordRatio = paragraphWords.length > 0
      ? new Set(paragraphWords.filter(w => previousChapterVocabulary.includes(w.toLowerCase()))).size / paragraphWords.length
      : 1

    // Score based on vocabulary consistency (40%) and variety (60%)
    const wordFrequency = this.countWordFrequency(paragraphWords)
    const overusedCount = Object.values(wordFrequency).filter(c => c >= 3).length
    const repetitionPenalty = Math.min(overusedCount * 10, 40)

    const score = Math.max(0, Math.min(100, newWordRatio * 60 + repetitionPenalty))
    return score
  }

  private extractWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.LOWERCASE_WORDS_TO_IGNORE.has(w))
  }

  private countWordFrequency(words: string[]): Record<string, number> {
    const frequency: Record<string, number> = {}
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1
    }
    return frequency
  }
}
