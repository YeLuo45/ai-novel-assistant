/**
 * Length Detector
 * Warns when paragraphs exceed 500 characters (common readability threshold)
 */

import type { Detector, QualityIssue, CriticContext } from '../types'

export class LengthDetector implements Detector {
  name = 'length'

  private readonly MAX_PARAGRAPH_LENGTH = 500

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { paragraph, paragraphIndex } = context

    if (paragraph.length > this.MAX_PARAGRAPH_LENGTH) {
      const start = paragraph.indexOf(paragraph.slice(0, 50))
      issues.push({
        type: 'length',
        severity: 'warning',
        position: {
          paragraph: paragraphIndex,
          start: 0,
          end: paragraph.length
        },
        message: `段落过长 (${paragraph.length}字符)，超过${this.MAX_PARAGRAPH_LENGTH}字符的可读性阈值`,
        suggestion: `建议将段落拆分为多个较短段落，或使用对话/动作打断长段落`
      })
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const { paragraph } = context
    const length = paragraph.length

    if (length <= 200) return 100
    if (length <= 300) return 90
    if (length <= 400) return 80
    if (length <= 500) return 70
    if (length <= 700) return 50
    if (length <= 1000) return 30
    return 10
  }
}
