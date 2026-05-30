/**
 * QualityScorer - V38
 * Calculates quality scores based on detector results
 */

import type { QualityScore, QualityIssue, ExtendedRadarData } from './types'

export interface DetectorResult {
  name: string
  score: number
  issues: QualityIssue[]
}

export class QualityScorer {
  // Default weights for overall score calculation
  private readonly DEFAULT_WEIGHTS = {
    consistency: 0.18,
    pacing: 0.18,
    tension: 0.18,
    dialogue: 0.15,
    style: 0.16,
    length: 0.15
  }

  /**
   * Calculate comprehensive quality scores from detector results
   */
  calculateScore(detectorResults: DetectorResult[]): QualityScore {
    const scores: Record<string, number> = {
      consistency: 100,
      pacing: 100,
      tension: 100,
      dialogue: 100,
      style: 100,
      length: 100
    }

    // Aggregate scores by detector name
    for (const result of detectorResults) {
      const name = this.mapDetectorName(result.name)
      if (name && scores[name] !== undefined) {
        // Use lowest score if multiple detectors of same type
        scores[name] = Math.min(scores[name], result.score)
      }
    }

    // Calculate overall weighted score
    const overall = this.calculateOverallScore(scores)

    return {
      overall,
      consistency: Math.round(scores.consistency),
      pacing: Math.round(scores.pacing),
      tension: Math.round(scores.tension),
      dialogue: Math.round(scores.dialogue),
      style: Math.round(scores.style),
      length: Math.round(scores.length)
    }
  }

  /**
   * Convert radar data to ExtendedRadarData format for 7-dimension display
   */
  toExtendedRadarData(qualityScore: QualityScore): ExtendedRadarData {
    return {
      overall: qualityScore.overall,
      consistency: qualityScore.consistency,
      pacing: qualityScore.pacing,
      tension: qualityScore.tension,
      dialogue: qualityScore.dialogue,
      style: qualityScore.style,
      length: qualityScore.length
    }
  }

  /**
   * Get radar chart data format for recharts
   */
  getRadarChartData(qualityScore: QualityScore) {
    return [
      { dimension: '综合', value: qualityScore.overall, fullMark: 100 },
      { dimension: '一致性', value: qualityScore.consistency, fullMark: 100 },
      { dimension: '节奏', value: qualityScore.pacing, fullMark: 100 },
      { dimension: '张力', value: qualityScore.tension, fullMark: 100 },
      { dimension: '对话', value: qualityScore.dialogue, fullMark: 100 },
      { dimension: '风格', value: qualityScore.style, fullMark: 100 },
      { dimension: '长度', value: qualityScore.length, fullMark: 100 }
    ]
  }

  /**
   * Calculate overall score from individual dimension scores
   */
  private calculateOverallScore(scores: Record<string, number>): number {
    const weights = this.DEFAULT_WEIGHTS

    const score = Math.round(
      scores.consistency * weights.consistency +
      scores.pacing * weights.pacing +
      scores.tension * weights.tension +
      scores.dialogue * weights.dialogue +
      scores.style * weights.style +
      scores.length * weights.length
    )

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Map old detector names to new dimension names
   */
  private mapDetectorName(name: string): string | null {
    const nameMap: Record<string, string> = {
      'dialogue_flow': 'dialogue',
      'duplicate': 'style', // duplicates affect style score
      'length': 'length',
      'style': 'style',
      'consistency': 'consistency',
      'pacing': 'pacing',
      'tension': 'tension'
    }
    return nameMap[name] || name
  }

  /**
   * Get score grade description
   */
  static getGrade(score: number): { grade: string; color: string; description: string } {
    if (score >= 90) {
      return { grade: 'A', color: 'text-green-600', description: '优秀 - 写作质量很高' }
    } else if (score >= 80) {
      return { grade: 'B', color: 'text-green-500', description: '良好 - 写作质量良好' }
    } else if (score >= 70) {
      return { grade: 'C', color: 'text-amber-500', description: '中等 - 有改进空间' }
    } else if (score >= 60) {
      return { grade: 'D', color: 'text-orange-500', description: '及格 - 需要较多改进' }
    } else {
      return { grade: 'F', color: 'text-red-500', description: '不及格 - 需要大幅改进' }
    }
  }

  /**
   * Compare two quality scores
   */
  static compareScores(before: QualityScore, after: QualityScore): {
    overall: number
    dimensions: Record<string, number>
  } {
    return {
      overall: after.overall - before.overall,
      dimensions: {
        consistency: after.consistency - before.consistency,
        pacing: after.pacing - before.pacing,
        tension: after.tension - before.tension,
        dialogue: after.dialogue - before.dialogue,
        style: after.style - before.style,
        length: after.length - before.length
      }
    }
  }
}