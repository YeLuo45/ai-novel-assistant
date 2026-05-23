/**
 * Duplicate Detector
 * Highlights words appearing 3+ times in the same paragraph
 */

import type { Detector, QualityIssue, CriticContext } from '../types'

export class DuplicateDetector implements Detector {
  name = 'duplicate'

  private readonly MIN_DUPLICATE_COUNT = 3

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { paragraph, paragraphIndex } = context

    const words = this.extractWords(paragraph)
    const frequency = this.countWordFrequency(words)

    const duplicates: { word: string; count: number; positions: number[] }[] = []

    for (const [word, count] of Object.entries(frequency)) {
      if (count >= this.MIN_DUPLICATE_COUNT) {
        const positions = this.findWordPositions(word, paragraph)
        duplicates.push({ word, count, positions })
      }
    }

    for (const dup of duplicates) {
      const examplePos = Math.max(0, dup.positions[0] - 20)
      issues.push({
        type: 'duplicate',
        severity: 'warning',
        position: {
          paragraph: paragraphIndex,
          start: dup.positions[0],
          end: dup.positions[dup.positions.length - 1] + dup.word.length
        },
        message: `词汇"${dup.word}"在段落中重复出现${dup.count}次`,
        suggestion: `建议使用同义词、指代词或省略来减少重复`
      })
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const { paragraph } = context

    const words = this.extractWords(paragraph)
    if (words.length === 0) return 100

    const frequency = this.countWordFrequency(words)
    const maxDuplicates = Math.max(...Object.values(frequency), 0)

    if (maxDuplicates <= 1) return 100
    if (maxDuplicates === 2) return 85
    if (maxDuplicates === 3) return 70
    if (maxDuplicates === 4) return 55
    if (maxDuplicates >= 5) return Math.max(30, 55 - (maxDuplicates - 4) * 10)

    return 100
  }

  private extractWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
  }

  private countWordFrequency(words: string[]): Record<string, number> {
    const frequency: Record<string, number> = {}
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1
    }
    return frequency
  }

  private findWordPositions(word: string, text: string): number[] {
    const positions: number[] = []
    const lowerText = text.toLowerCase()
    const lowerWord = word.toLowerCase()
    let pos = 0

    while (true) {
      pos = lowerText.indexOf(lowerWord, pos)
      if (pos === -1) break
      positions.push(pos)
      pos += 1
    }

    return positions
  }
}
