/**
 * Dialogue Flow Detector
 * Detects repeated conversation patterns and dialogue stagnation
 */

import type { Detector, QualityIssue, CriticContext } from '../types'

interface DialogueEntry {
  speaker: string
  content: string
  index: number
}

export class DialogueFlowDetector implements Detector {
  name = 'dialogue_flow'

  private readonly MIN_PATTERN_LENGTH = 2
  private readonly PATTERN_SIMILARITY_THRESHOLD = 0.7

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { paragraph, paragraphIndex, allDialogues } = context

    if (!allDialogues || allDialogues.length < 4) {
      return issues
    }

    // Extract dialogues from current paragraph
    const currentDialogues = this.extractDialogues(paragraph)
    if (currentDialogues.length < 2) return issues

    // Find repeated patterns in recent dialogues
    const recentDialogues = allDialogues.slice(-10)
    const patterns = this.findRepeatedPatterns(recentDialogues)

    for (const pattern of patterns) {
      if (pattern.length >= this.MIN_PATTERN_LENGTH) {
        issues.push({
          type: 'dialogue_flow',
          severity: 'warning',
          position: {
            paragraph: paragraphIndex,
            start: 0,
            end: paragraph.length
          },
          message: `检测到对话模式重复：${pattern.map(d => `"${d.speaker}:${d.content.slice(0, 10)}..."`).join(' → ')}`,
          suggestion: `建议改变对话顺序、引入新话题或使用旁白/动作打断`
        })
      }
    }

    // Check for same-speaker consecutive dialogues
    for (let i = 1; i < currentDialogues.length; i++) {
      if (currentDialogues[i].speaker === currentDialogues[i - 1].speaker) {
        issues.push({
          type: 'dialogue_flow',
          severity: 'info',
          position: {
            paragraph: paragraphIndex,
            start: currentDialogues[i].index,
            end: currentDialogues[i].index + currentDialogues[i].content.length
          },
          message: `连续对话中同一角色"${currentDialogues[i].speaker}"连续发言`,
          suggestion: `建议加入其他角色回应或动作描写`
        })
      }
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const { paragraph, allDialogues } = context

    if (!allDialogues || allDialogues.length < 4) return 80

    const currentDialogues = this.extractDialogues(paragraph)
    if (currentDialogues.length < 2) return 100

    // Check for pattern repetition in recent dialogues
    const recentDialogues = allDialogues.slice(-10)
    const patterns = this.findRepeatedPatterns(recentDialogues)

    const patternPenalty = patterns.length * 15

    // Check for consecutive same-speaker
    let sameSpeakerPenalty = 0
    for (let i = 1; i < currentDialogues.length; i++) {
      if (currentDialogues[i].speaker === currentDialogues[i - 1].speaker) {
        sameSpeakerPenalty += 10
      }
    }

    return Math.max(0, 100 - patternPenalty - sameSpeakerPenalty)
  }

  private extractDialogues(text: string): DialogueEntry[] {
    const dialogues: DialogueEntry[] = []
    // Match patterns like "Speaker: dialogue" or "Speaker "dialogue""
    const regex = /([A-Za-z\u4e00-\u9fa5]+)[\s]*[:：][\s]*["""']([^""'"]+)["""]/g
    let match

    while ((match = regex.exec(text)) !== null) {
      dialogues.push({
        speaker: match[1].trim(),
        content: match[2].trim(),
        index: match.index
      })
    }

    return dialogues
  }

  private findRepeatedPatterns(dialogues: DialogueEntry[]): DialogueEntry[][] {
    const patterns: DialogueEntry[][] = []
    const n = dialogues.length

    for (let len = 2; len <= Math.floor(n / 2); len++) {
      for (let i = 0; i <= n - len * 2; i++) {
        const pattern1 = dialogues.slice(i, i + len)
        const pattern2 = dialogues.slice(i + len, i + len * 2)

        if (this.patternsAreSimilar(pattern1, pattern2)) {
          patterns.push(pattern1)
        }
      }
    }

    return patterns
  }

  private patternsAreSimilar(p1: DialogueEntry[], p2: DialogueEntry[]): boolean {
    if (p1.length !== p2.length) return false

    for (let i = 0; i < p1.length; i++) {
      // Same speaker
      if (p1[i].speaker !== p2[i].speaker) return false
      // Similar content
      if (!this.contentIsSimilar(p1[i].content, p2[i].content)) return false
    }

    return true
  }

  private contentIsSimilar(content1: string, content2: string): boolean {
    const words1 = content1.toLowerCase().split(/\s+/)
    const words2 = content2.toLowerCase().split(/\s+/)

    const set1 = new Set(words1)
    const set2 = new Set(words2)

    let intersection = 0
    set1.forEach(word => {
      if (set2.has(word)) intersection++
    })

    const unionSet = new Set<string>()
    set1.forEach(w => unionSet.add(w))
    set2.forEach(w => unionSet.add(w))
    const union = unionSet.size
    const similarity = union > 0 ? intersection / union : 0

    return similarity >= this.PATTERN_SIMILARITY_THRESHOLD
  }
}
