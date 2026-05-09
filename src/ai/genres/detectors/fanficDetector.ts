import type { GenreDetectionResult, GenreIssue } from '../types'

export class FanficDetector {
  // 检测OOC（Out of Character）
  checkOOCBehavior(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化：检测角色是否有不符合"正常"行为的表现
    // 实际应该基于角色卡来判断
    const extremeBehavior = content.match(/(?:突然|竟然|居然)[^\n]{0,20}(?:杀人|暴力|自杀)/g) || []
    
    if (extremeBehavior.length > 2) {
      issues.push({
        type: 'ooc_behavior',
        severity: 'critical',
        description: '检测到可能的OOC行为',
        suggestion: '确保角色行为符合原作人设'
      })
    }
    
    return issues
  }
  
  checkOOCDialogue(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化：检测是否使用了过于现代的网络用语
    const modernSlang = content.match(/(?:绝了|太卷了|YYDS|CP|嗑)/g) || []
    
    if (modernSlang.length > 3) {
      issues.push({
        type: 'ooc_dialogue',
        severity: 'major',
        description: '检测到可能OOC的现代用语',
        suggestion: '同人创作应尽量保持原作语言风格'
      })
    }
    
    return issues
  }
  
  checkCrossover(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    // 简化
    return issues
  }
  
  calculateMetrics(content: string) {
    return {
      characterAccuracy: 80,
      originalFlavor: 75,
      innovationBalance: 70
    }
  }
  
  detect(content: string): GenreDetectionResult {
    const issues: GenreIssue[] = [
      ...this.checkOOCBehavior(content),
      ...this.checkOOCDialogue(content),
      ...this.checkCrossover(content)
    ]
    
    return {
      genreId: 'fanfiction',
      issues,
      metrics: this.calculateMetrics(content)
    }
  }
}

export const fanficDetector = new FanficDetector()
