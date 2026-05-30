/**
 * V22 风格学习器
 * Phase 2: 风格学习
 * 
 * 功能：
 * - 从章节内容学习风格特征
 * - 获取风格建议
 * - 匹配目标风格
 */

import { longTermMemoryManager } from './LongTermMemoryManager'
import type {
  V22StyleMemory as StyleMemory,
  PatternRecord,
  VocabularyPreference,
  DialoguePattern,
  PacingProfile,
} from './types'

export interface StyleFeatures {
  sentencePatterns: string[]
  vocabularyLevel: 'simple' | 'moderate' | 'complex'
  dialogueRatio: number
  descriptionDensity: number
  emotionalTone: 'neutral' | 'warm' | 'intense'
  pacing: 'slow' | 'moderate' | 'fast'
  narrativeVoice: 'first' | 'second' | 'third'
}

export interface StyleAdvice {
  suggestion: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface StyleMatchResult {
  matchScore: number  // 0-100
  matchingFeatures: string[]
  mismatchingFeatures: string[]
  advice: StyleAdvice[]
}

class StyleLearner {
  /**
   * 从章节内容学习风格
   */
  async learnFromChapter(
    chapterContent: string,
    chapterNumber: number
  ): Promise<StyleFeatures> {
    const features = this.analyzeStyle(chapterContent)
    
    // 更新风格记忆
    await this.updateStyleMemory(features, chapterContent, chapterNumber)
    
    return features
  }

  /**
   * 分析文本风格特征
   */
  private analyzeStyle(content: string): StyleFeatures {
    const sentences = this.splitSentences(content)
    const paragraphs = content.split(/\n\s*\n/)
    
    // 句子模式分析
    const sentencePatterns = this.extractSentencePatterns(sentences)
    
    // 词汇复杂度
    const vocabularyLevel = this.analyzeVocabularyLevel(content)
    
    // 对话比例
    const dialogueRatio = this.calculateDialogueRatio(content)
    
    // 描写密度
    const descriptionDensity = this.calculateDescriptionDensity(content, paragraphs)
    
    // 情感色调
    const emotionalTone = this.analyzeEmotionalTone(content)
    
    // 节奏
    const pacing = this.analyzePacing(content, sentences, paragraphs)
    
    // 叙事视角
    const narrativeVoice = this.detectNarrativeVoice(content)

    return {
      sentencePatterns,
      vocabularyLevel,
      dialogueRatio,
      descriptionDensity,
      emotionalTone,
      pacing,
      narrativeVoice,
    }
  }

  /**
   * 分割句子
   */
  private splitSentences(content: string): string[] {
    return content
      .split(/[。！？.!?]+/)
      .filter(s => s.trim().length > 0)
  }

  /**
   * 提取句子模式
   */
  private extractSentencePatterns(sentences: string[]): string[] {
    const patterns: string[] = []
    
    // 简单句型识别
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      
      // 并列句模式
      if (/，[^，]+，[^，]+/.test(trimmed)) {
        patterns.push('compound_comma')
      }
      
      // 从句模式
      if (/由于|因为|虽然|但是|如果|当|虽然/.test(trimmed)) {
        patterns.push('subordinate_clause')
      }
      
      // 短句模式
      if (trimmed.length < 15) {
        patterns.push('short_sentence')
      }
      
      // 排比句模式
      if (/[，。].*[，。].*[，。]/.test(trimmed) && trimmed.length < 100) {
        patterns.push('parallel_structure')
      }
      
      // 对话引导模式
      if (/[""][""].*说|["""].*道/.test(trimmed)) {
        patterns.push('dialogue_tag')
      }
    }
    
    return [...new Set(patterns)]
  }

  /**
   * 分析词汇复杂度
   */
  private analyzeVocabularyLevel(content: string): 'simple' | 'moderate' | 'complex' {
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const uniqueWords = new Set(words)
    const typeTokenRatio = uniqueWords.size / words.length
    
    // 计算平均词长
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
    
    // 检测高级词汇
    const advancedWords = /[鳞甲|缥缈|浩瀚|峥嵘|苍茫|斑斓]/g
    const advancedCount = (content.match(advancedWords) || []).length
    
    if (typeTokenRatio > 0.6 && avgWordLength > 4 && advancedCount > 3) {
      return 'complex'
    } else if (typeTokenRatio > 0.4 && avgWordLength > 3) {
      return 'moderate'
    }
    return 'simple'
  }

  /**
   * 计算对话比例
   */
  private calculateDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/["""][^"""]+["""]/g) || []
    const dialogueChars = dialogueMatches.reduce((sum, m) => sum + m.length, 0)
    return Math.min(1, dialogueChars / content.length)
  }

  /**
   * 计算描写密度
   */
  private calculateDescriptionDensity(content: string, paragraphs: string[]): number {
    if (paragraphs.length === 0) return 0.5
    
    // 描写性段落特征：长、无对话、有形容词
    const descriptiveParagraphs = paragraphs.filter(p => {
      const hasDialogue = /["""][^"""]+["""]/.test(p)
      const hasAdjectives = /[的|地|得]/ .test(p) && p.length > 50
      return !hasDialogue && hasAdjectives
    })
    
    return descriptiveParagraphs.length / paragraphs.length
  }

  /**
   * 分析情感色调
   */
  private analyzeEmotionalTone(content: string): 'neutral' | 'warm' | 'intense' {
    const warmWords = /爱|温柔|温暖|关怀|甜蜜|幸福|快乐|喜欢|感动/g
    const intenseWords = /愤怒|恐惧|绝望|崩溃|疯狂|激烈|燃烧|毁灭|死亡|血腥/g
    
    const warmCount = (content.match(warmWords) || []).length
    const intenseCount = (content.match(intenseWords) || []).length
    
    const normalizedIntense = intenseCount * 1.5  // 强度词权重更高
    
    if (warmCount > intenseCount && warmCount > 5) {
      return 'warm'
    } else if (intenseCount > warmCount && intenseCount > 3) {
      return 'intense'
    }
    return 'neutral'
  }

  /**
   * 分析节奏
   */
  private analyzePacing(
    content: string,
    sentences: string[],
    paragraphs: string[]
  ): 'slow' | 'moderate' | 'fast' {
    // 快速节奏特征：短句、多对话、多动作词
    const actionWords = /跑|跳|冲|打|杀|飞|瞬|速|快|急/g
    const actionCount = (content.match(actionWords) || []).length
    
    // 慢速节奏特征：长句、多描写、多修饰
    const descriptiveWords = /仿佛|如同|似乎|慢慢|渐渐|缓缓|静静/g
    const descriptiveCount = (content.match(descriptiveWords) || []).length
    
    const avgSentenceLength = sentences.length > 0 
      ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
      : 50
    
    const pacingScore = actionCount * 2 + descriptiveCount * (-1) + (avgSentenceLength < 20 ? 2 : -1)
    
    if (pacingScore > 3) return 'fast'
    if (pacingScore < -2) return 'slow'
    return 'moderate'
  }

  /**
   * 检测叙事视角
   */
  private detectNarrativeVoice(content: string): 'first' | 'second' | 'third' {
    // 第一人称检测
    const firstPersonPatterns = [
      /我[的是想觉得看到听到感觉到]/,
      /我的[父亲母亲朋友]/,
      /我们[的是想]/,
    ]
    
    // 第二人称检测
    const secondPersonPatterns = [
      /你[的是想觉得]/,
      /你的/,
    ]
    
    for (const pattern of firstPersonPatterns) {
      if (pattern.test(content)) return 'first'
    }
    
    for (const pattern of secondPersonPatterns) {
      if (pattern.test(content)) return 'second'
    }
    
    return 'third'
  }

  /**
   * 更新风格记忆
   */
  private async updateStyleMemory(
    features: StyleFeatures,
    content: string,
    chapterNumber: number
  ): Promise<void> {
    // 更新句子模式
    for (const pattern of features.sentencePatterns) {
      await longTermMemoryManager.addSentencePattern(pattern, content.slice(0, 100), chapterNumber)
    }
    
    // 更新节奏配置
    const pacingMap = { slow: 0.3, moderate: 0.5, fast: 0.8 }
    await longTermMemoryManager.updatePacingProfile({
      dialogueRatio: features.dialogueRatio,
      descriptionDensity: features.descriptionDensity,
    })
    
    // 更新置信度（基于样本数量）
    const style = await longTermMemoryManager.getStyleMemory()
    const currentConfidence = style?.confidence || 0
    const newConfidence = Math.min(95, currentConfidence + 5)
    await longTermMemoryManager.updateStyleConfidence(newConfidence)
  }

  /**
   * 获取风格建议
   */
  async getStyleAdvice(targetGenre?: string): Promise<StyleAdvice[]> {
    const advice: StyleAdvice[] = []
    const style = await longTermMemoryManager.getStyleMemory()
    
    if (!style) {
      advice.push({
        suggestion: '开始写作以建立风格基准',
        reason: '系统尚未学习到足够的风格特征',
        priority: 'high',
      })
      return advice
    }

    // 基于当前风格的建议
    const pacingProfile = style.pacingProfile
    
    if (pacingProfile.dialogueRatio > 0.5) {
      advice.push({
        suggestion: '适当增加描写段落',
        reason: '当前对话比例较高(>50%)，可能影响场景氛围的营造',
        priority: 'medium',
      })
    }
    
    if (pacingProfile.descriptionDensity < 0.3) {
      advice.push({
        suggestion: '增加场景和细节描写',
        reason: '描写密度较低，读者可能难以构建画面感',
        priority: 'high',
      })
    }
    
    if (pacingProfile.averageChapterLength < 2000) {
      advice.push({
        suggestion: '考虑增加章节长度',
        reason: '章节平均长度较短，可能影响故事的完整性表达',
        priority: 'low',
      })
    }

    // 基于流派的建议
    if (targetGenre) {
      advice.push(...this.getGenreSpecificAdvice(targetGenre, style))
    }

    // 句子模式建议
    const sentencePatterns = style.sentencePatterns
    if (sentencePatterns.length < 3) {
      advice.push({
        suggestion: '丰富句式变化',
        reason: '句子模式较为单一，建议增加复合句和从句使用',
        priority: 'medium',
      })
    }

    return advice.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * 获取基于类型的风格建议
   */
  private getGenreSpecificAdvice(genre: string, style: StyleMemory): StyleAdvice[] {
    const advice: StyleAdvice[] = []

    switch (genre) {
      case '玄幻':
      case '奇幻':
        if (style.pacingProfile.descriptionDensity < 0.4) {
          advice.push({
            suggestion: '增强世界观和魔法描写',
            reason: '玄幻/奇幻类型需要详细的世界观和魔法系统描写',
            priority: 'high',
          })
        }
        break
        
      case '都市':
        if (style.pacingProfile.dialogueRatio < 0.3) {
          advice.push({
            suggestion: '增加对话比例',
            reason: '都市类型通常对话较多以展现人物关系',
            priority: 'medium',
          })
        }
        break
        
      case '悬疑':
        if (style.pacingProfile.averageChapterLength > 5000) {
          advice.push({
            suggestion: '精简章节长度',
            reason: '悬疑类型建议章节短小精悍，保持紧张感',
            priority: 'medium',
          })
        }
        break
        
      case '言情':
        if (style.pacingProfile.descriptionDensity < 0.35) {
          advice.push({
            suggestion: '增加情感和心理描写',
            reason: '言情类型需要细腻的情感刻画',
            priority: 'high',
          })
        }
        break
    }

    return advice
  }

  /**
   * 匹配目标风格
   */
  async matchStyle(targetStyle: StyleFeatures): Promise<StyleMatchResult> {
    const currentStyle = await longTermMemoryManager.getStyleMemory()
    
    if (!currentStyle) {
      return {
        matchScore: 0,
        matchingFeatures: [],
        mismatchingFeatures: ['vocabularyLevel', 'dialogueRatio', 'descriptionDensity', 'pacing', 'narrativeVoice'],
        advice: [{
          suggestion: '无法匹配：缺乏风格数据',
          reason: '请先通过写作建立风格基准',
          priority: 'high',
        }],
      }
    }

    const matchingFeatures: string[] = []
    const mismatchingFeatures: string[] = []
    const advice: StyleAdvice[] = []
    
    let score = 100

    // 对话比例匹配
    const dialogueDiff = Math.abs(currentStyle.pacingProfile.dialogueRatio - targetStyle.dialogueRatio)
    if (dialogueDiff < 0.15) {
      matchingFeatures.push('dialogueRatio')
    } else {
      mismatchingFeatures.push('dialogueRatio')
      score -= dialogueDiff * 30
      advice.push({
        suggestion: `调整对话比例至 ${(targetStyle.dialogueRatio * 100).toFixed(0)}%`,
        reason: `当前: ${(currentStyle.pacingProfile.dialogueRatio * 100).toFixed(0)}%, 目标: ${(targetStyle.dialogueRatio * 100).toFixed(0)}%`,
        priority: dialogueDiff > 0.3 ? 'high' : 'medium',
      })
    }

    // 描写密度匹配
    const descDiff = Math.abs(currentStyle.pacingProfile.descriptionDensity - targetStyle.descriptionDensity)
    if (descDiff < 0.2) {
      matchingFeatures.push('descriptionDensity')
    } else {
      mismatchingFeatures.push('descriptionDensity')
      score -= descDiff * 25
      advice.push({
        suggestion: `调整描写密度至 ${(targetStyle.descriptionDensity * 100).toFixed(0)}%`,
        reason: `当前描写较${currentStyle.pacingProfile.descriptionDensity > targetStyle.descriptionDensity ? '多' : '少'}`,
        priority: descDiff > 0.3 ? 'high' : 'medium',
      })
    }

    // 句子模式匹配
    const currentPatterns = new Set(currentStyle.sentencePatterns.map(p => p.pattern))
    const targetPatternSet = new Set(targetStyle.sentencePatterns)
    const patternOverlap = targetStyle.sentencePatterns.filter(p => currentPatterns.has(p)).length
    
    if (patternOverlap >= targetStyle.sentencePatterns.length * 0.5) {
      matchingFeatures.push('sentencePatterns')
    } else {
      mismatchingFeatures.push('sentencePatterns')
      score -= 15
      advice.push({
        suggestion: '增加目标风格的句式模式',
        reason: `当前模式与目标风格重叠度较低`,
        priority: 'medium',
      })
    }

    // 词汇水平匹配
    if (currentStyle.vocabularyPreferences.length > 0) {
      const avgFreq = currentStyle.vocabularyPreferences.reduce((sum, v) => sum + v.frequency, 0) / currentStyle.vocabularyPreferences.length
      const targetVocabLevel = targetStyle.vocabularyLevel === 'simple' ? 30 : targetStyle.vocabularyLevel === 'moderate' ? 50 : 70
      
      if (Math.abs(avgFreq - targetVocabLevel) < 20) {
        matchingFeatures.push('vocabularyLevel')
      } else {
        mismatchingFeatures.push('vocabularyLevel')
        score -= 15
        advice.push({
          suggestion: `调整词汇复杂度至 ${targetStyle.vocabularyLevel} 级别`,
          reason: '词汇使用频率与目标风格不符',
          priority: 'medium',
        })
      }
    }

    // 节奏匹配
    const pacingMap = { slow: 0.3, moderate: 0.5, fast: 0.8 }
    const currentPacing = currentStyle.pacingProfile.actionFrequency / 100
    const targetPacing = pacingMap[targetStyle.pacing]
    const pacingDiff = Math.abs(currentPacing - targetPacing)
    
    if (pacingDiff < 0.2) {
      matchingFeatures.push('pacing')
    } else {
      mismatchingFeatures.push('pacing')
      score -= pacingDiff * 20
      advice.push({
        suggestion: `调整叙事节奏至 ${targetStyle.pacing} 模式`,
        reason: `当前节奏${currentPacing > targetPacing ? '较快' : '较慢'}`,
        priority: pacingDiff > 0.4 ? 'high' : 'medium',
      })
    }

    // 叙事视角（这个不太容易调整）
    advice.push({
      suggestion: '注意保持叙事视角一致',
      reason: '叙事视角一旦确定很难改变，如需调整建议在新章节开始',
      priority: 'low',
    })

    return {
      matchScore: Math.max(0, Math.min(100, score)),
      matchingFeatures,
      mismatchingFeatures,
      advice: advice.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
    }
  }

  /**
   * 获取当前学习到的风格特征摘要
   */
  async getStyleSummary(): Promise<string> {
    const style = await longTermMemoryManager.getStyleMemory()
    
    if (!style) {
      return '尚无风格数据，开始写作后系统将自动学习风格特征。'
    }

    const lines: string[] = []
    lines.push('## 风格学习摘要\n')

    // 句子模式
    if (style.sentencePatterns.length > 0) {
      lines.push('### 常用句式')
      for (const p of style.sentencePatterns.slice(0, 5)) {
        lines.push(`- ${p.pattern}: 出现 ${p.frequency} 次`)
      }
      lines.push('')
    }

    // 节奏
    lines.push('### 节奏特征')
    const profile = style.pacingProfile
    lines.push(`- 对话比例: ${(profile.dialogueRatio * 100).toFixed(1)}%`)
    lines.push(`- 描写密度: ${(profile.descriptionDensity * 100).toFixed(1)}%`)
    lines.push(`- 动作频率: ${(profile.actionFrequency).toFixed(1)}%`)
    lines.push('')

    // 高频词汇
    if (style.vocabularyPreferences.length > 0) {
      lines.push('### 高频词汇')
      const topWords = style.vocabularyPreferences
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
      lines.push(topWords.map(v => `${v.word}(${v.frequency})`).join(', '))
      lines.push('')
    }

    // 置信度
    lines.push(`**学习置信度**: ${style.confidence.toFixed(0)}%`)

    return lines.join('\n')
  }

  /**
   * 重置风格学习数据
   */
  async resetStyleData(): Promise<void> {
    // 获取并重建空的风格记忆
    await longTermMemoryManager.getOrCreateStyleMemory()
    // 这里简化处理，实际可能需要 manager 提供 reset 方法
  }
}

// 单例导出
export const styleLearner = new StyleLearner()
export { StyleLearner }
