import type { WritingVersion, VersionComparison, VersionDifference, VersionRecommendation } from './types'

export class VersionComparator {
  /**
   * 对比多个版本
   */
  compare(versions: WritingVersion[]): VersionComparison {
    const differences = this.findDifferences(versions)
    const recommendations = this.generateRecommendations(versions, differences)
    
    return {
      versions,
      differences,
      recommendations
    }
  }
  
  /**
   * 找出版本间的差异
   */
  private findDifferences(versions: WritingVersion[]): VersionDifference[] {
    if (versions.length < 2) return []
    
    const differences: VersionDifference[] = []
    const paragraphsList = versions.map(v => v.content.split('\n\n'))
    const maxLen = Math.max(...paragraphsList.map(p => p.length))
    
    for (let i = 0; i < maxLen; i++) {
      const paragraphAtIndex = paragraphsList.map(p => p[i] || '')
      const uniqueParagraphs = new Set(paragraphAtIndex.filter(Boolean))
      
      if (uniqueParagraphs.size > 1) {
        differences.push({
          type: this.classifyDifference(paragraphAtIndex),
          location: { paragraph: i },
          versions: versions.reduce<{ [versionId: string]: string }>((acc, v, idx) => {
            acc[v.id] = paragraphAtIndex[idx] || ''
            return acc
          }, {}),
          highlightText: this.findHighlightText(paragraphAtIndex)
        })
      }
    }
    
    return differences
  }
  
  /**
   * 分类差异类型
   */
  private classifyDifference(paragraphs: string[]): VersionDifference['type'] {
    const hasDialogue = paragraphs.some(p => p.includes('"') || p.includes('"'))
    const hasDescription = paragraphs.some(p => 
      ['看到', '观察', '仿佛'].some(k => p.includes(k)))
    const emotionalWords = ['愤怒', '悲伤', '喜悦', '恐惧']
    const hasEmotion = paragraphs.some(p => 
      emotionalWords.some(w => p.includes(w)))
    
    if (hasDialogue && !hasDescription) return 'style'
    if (hasEmotion) return 'tone'
    if (hasDescription) return 'plot'
    return 'character'
  }
  
  /**
   * 找出高亮文本
   */
  private findHighlightText(paragraphs: string[]): string {
    const firstNonEmpty = paragraphs.find(p => p.trim().length > 0) || ''
    return firstNonEmpty.slice(0, 50) + (firstNonEmpty.length > 50 ? '...' : '')
  }
  
  /**
   * 生成推荐
   */
  private generateRecommendations(
    versions: WritingVersion[],
    differences: VersionDifference[]
  ): VersionRecommendation[] {
    return versions.map(version => {
      let score = 70
      
      if (version.analysis.emotionalIntensity > 50) score += 10
      if (version.analysis.conflictLevel > 50) score += 10
      if (version.analysis.pacing === 'moderate') score += 5
      
      const diffCount = differences.filter(d => 
        d.versions[version.id] && d.versions[version.id].trim().length > 0
      ).length
      
      score += Math.min(10, diffCount * 2)
      
      return {
        versionId: version.id,
        reason: this.generateReason(version, diffCount),
        score: Math.min(100, score),
        mergeSuggestions: this.suggestMerges(version, versions, differences)
      }
    }).sort((a, b) => b.score - a.score)
  }
  
  private generateReason(version: WritingVersion, diffCount: number): string {
    const parts: string[] = []
    
    if (version.analysis.tone === 'lively') parts.push('文风活泼')
    if (version.analysis.conflictLevel > 60) parts.push('冲突感强')
    if (version.analysis.emotionalIntensity > 50) parts.push('情感充沛')
    if (diffCount > 3) parts.push(`有${diffCount}处独特表达`)
    
    return parts.length > 0 ? parts.join('，') : '整体表现均衡'
  }
  
  private suggestMerges(
    targetVersion: WritingVersion,
    _allVersions: WritingVersion[],
    differences: VersionDifference[]
  ): VersionRecommendation['mergeSuggestions'] {
    const merges: VersionRecommendation['mergeSuggestions'] = []
    
    for (const diff of differences) {
      const targetContent = diff.versions[targetVersion.id] || ''
      const otherVersions = Object.entries(diff.versions)
        .filter(([id]) => id !== targetVersion.id)
      
      for (const [otherId, otherContent] of otherVersions) {
        if (otherContent.length > targetContent.length + 20) {
          merges.push({
            fromVersion: otherId,
            toVersion: targetVersion.id,
            section: { start: diff.location.paragraph, end: diff.location.paragraph },
            reason: '此处其他版本描写更丰富'
          })
        }
      }
    }
    
    return merges.slice(0, 3)
  }
}

export const versionComparator = new VersionComparator()
