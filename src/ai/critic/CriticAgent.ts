/**
 * CriticAgent - Quality Analysis Engine
 * Analyzes novel content for quality issues using multiple detectors
 */

import type { QualityResult, RadarData, CriticContext, DialogueEntry } from './types'
import { LengthDetector } from './detectors/LengthDetector'
import { StyleDetector } from './detectors/StyleDetector'
import { DuplicateDetector } from './detectors/DuplicateDetector'
import { DialogueFlowDetector } from './detectors/DialogueFlowDetector'
import type { Detector } from './types'

export interface CriticAgentOptions {
  previousChapterVocabulary?: string[]
}

export class CriticAgent {
  private detectors: Detector[]

  constructor(options: CriticAgentOptions = {}) {
    this.detectors = [
      new LengthDetector(),
      new StyleDetector(),
      new DuplicateDetector(),
      new DialogueFlowDetector()
    ]
  }

  /**
   * Analyze content and return quality results
   */
  async analyze(
    content: string,
    options: CriticAgentOptions = {}
  ): Promise<QualityResult> {
    const paragraphs = this.splitIntoParagraphs(content)
    const allIssues: QualityResult['issues'] = []
    const radarData: RadarData = { length: 0, style: 0, duplicate: 0, dialogue: 0 }
    const detectorCount = this.detectors.length

    // Collect all dialogues for dialogue flow analysis
    const allDialogues = this.extractAllDialogues(content)

    // Analyze each paragraph
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const context: CriticContext = {
        content,
        paragraph,
        paragraphIndex: i,
        previousChapterVocabulary: options.previousChapterVocabulary,
        allDialogues
      }

      // Run all detectors
      for (const detector of this.detectors) {
        const issues = await detector.detect(context)
        allIssues.push(...issues)
      }
    }

    // Calculate radar scores
    for (const detector of this.detectors) {
      const scores = await Promise.all(
        paragraphs.map(p => {
          const context: CriticContext = {
            content,
            paragraph: p,
            paragraphIndex: 0,
            previousChapterVocabulary: options.previousChapterVocabulary,
            allDialogues
          }
          return detector.getScore(context)
        })
      )

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 100

      switch (detector.name) {
        case 'length':
          radarData.length = avgScore
          break
        case 'style':
          radarData.style = avgScore
          break
        case 'duplicate':
          radarData.duplicate = avgScore
          break
        case 'dialogue_flow':
          radarData.dialogue = avgScore
          break
      }
    }

    // Calculate overall score (weighted average)
    const score = this.calculateOverallScore(radarData)

    return {
      score,
      issues: allIssues,
      radarData
    }
  }

  /**
   * Get list of detector names
   */
  getDetectorNames(): string[] {
    return this.detectors.map(d => d.name)
  }

  private splitIntoParagraphs(content: string): string[] {
    // Split by double newline or single newline with empty line
    return content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
  }

  private extractAllDialogues(content: string): DialogueEntry[] {
    const dialogues: DialogueEntry[] = []
    const regex = /([A-Za-z\u4e00-\u9fa5]+)[\s]*[:：][\s]*["""']([^""'"]+)["""]/g
    let match

    while ((match = regex.exec(content)) !== null) {
      dialogues.push({
        speaker: match[1].trim(),
        content: match[2].trim(),
        index: match.index
      })
    }

    return dialogues
  }

  private calculateOverallScore(radarData: RadarData): number {
    // Weighted average: length (25%), style (25%), duplicate (30%), dialogue (20%)
    const weights = {
      length: 0.25,
      style: 0.25,
      duplicate: 0.30,
      dialogue: 0.20
    }

    const score = Math.round(
      radarData.length * weights.length +
      radarData.style * weights.style +
      radarData.duplicate * weights.duplicate +
      radarData.dialogue * weights.dialogue
    )

    return Math.max(0, Math.min(100, score))
  }
}
