/**
 * ConsistencyDetector - V38
 * Detects character behavior inconsistencies across chapters
 */

import type { Detector, QualityIssue, CriticContext, ChapterContext } from '../types'

export interface ConsistencyIssue {
  type: 'consistency'
  character: string
  description: string
  firstOccurrence: { chapter: number; paragraph: number; text: string }
  inconsistentOccurrence: { chapter: number; paragraph: number; text: string }
}

export class ConsistencyDetector implements Detector {
  name = 'consistency'

  private readonly MIN_CHAR_OCCURRENCES = 3
  private readonly TRAIT_CONSISTENCY_THRESHOLD = 0.6

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { chapters } = context

    if (!chapters || chapters.length < 2) {
      return issues
    }

    // Extract character traits and behaviors from all chapters
    const characterTraits = this.extractCharacterTraits(chapters)
    
    // Check for inconsistencies
    for (const [character, traits] of Object.entries(characterTraits)) {
      if (traits.length < this.MIN_CHAR_OCCURRENCES) continue

      const inconsistencies = this.findInconsistencies(character, traits, chapters)
      issues.push(...inconsistencies)
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const issues = await this.detect(context)
    
    if (issues.length === 0) return 100
    
    // Deduct points based on severity and count
    const errorPenalty = issues.filter(i => i.severity === 'error').length * 20
    const warningPenalty = issues.filter(i => i.severity === 'warning').length * 10
    const infoPenalty = issues.filter(i => i.severity === 'info').length * 5
    
    return Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty)
  }

  private extractCharacterTraits(chapters: ChapterContext[]): Record<string, TraitOccurrence[]> {
    const characterTraits: Record<string, TraitOccurrence[]> = {}
    
    // Trait patterns: emotional, personality, physical, behavioral
    const traitPatterns = [
      // Emotional traits
      { pattern: /(紧张|焦虑|不安|担心|恐惧|害怕|担心|害怕|生气|愤怒|高兴|开心|快乐|悲伤|难过|哭泣|大笑|微笑)/g, trait: 'emotional' },
      { pattern: /(冷静|沉着|镇定|稳重|急躁|鲁莽|谨慎|小心)/g, trait: 'emotional' },
      // Personality traits  
      { pattern: /(善良|温柔|体贴|冷酷|残忍|邪恶|自私|大方|慷慨|小气)/g, trait: 'personality' },
      { pattern: /(聪明|愚蠢|笨拙|机智|狡猾|天真|成熟|幼稚)/g, trait: 'personality' },
      // Physical actions
      { pattern: /(颤抖|发抖|握手|拥抱|亲吻|拍打|推搡)/g, trait: 'physical' },
      { pattern: /(凝视|注视|瞥见|盯着|看|望|观察)/g, trait: 'physical' },
      // Behavioral patterns
      { pattern: /(犹豫|徘徊|踌躇|果断|坚决|坚定)/g, trait: 'behavioral' },
      { pattern: /(说话|说话|沉默|寡言|健谈|唠叨)/g, trait: 'behavioral' },
    ]

    for (const chapter of chapters) {
      for (let pIdx = 0; pIdx < chapter.paragraphs.length; pIdx++) {
        const paragraph = chapter.paragraphs[pIdx]
        
        // Extract character names (simplified Chinese + English pattern)
        const namePattern = /([A-Z][a-z]+|[A-Z]{2,}|[\u4e00-\u9fa5]{2,4})(?:说|道|问|答|叫|喊|叹|笑|哭|唱|写|读|看|望|想|觉得|感到|觉得)/g
        const namesInParagraph = new Set<string>()
        let nameMatch
        while ((nameMatch = namePattern.exec(paragraph)) !== null) {
          const name = nameMatch[1].trim()
          if (name.length >= 2 && !this.isCommonWord(name)) {
            namesInParagraph.add(name)
          }
        }

        // Check for traits
        for (const { pattern, trait } of traitPatterns) {
          pattern.lastIndex = 0
          let match
          while ((match = pattern.exec(paragraph)) !== null) {
            for (const character of namesInParagraph) {
              if (!characterTraits[character]) {
                characterTraits[character] = []
              }
              characterTraits[character].push({
                trait,
                keyword: match[1],
                chapterIndex: chapter.chapterIndex,
                paragraphIndex: pIdx,
                context: paragraph.slice(Math.max(0, match.index - 20), match.index + match[1].length + 20)
              })
            }
          }
        }
      }
    }

    return characterTraits
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      '他说', '她', '他们', '我们', '你们', '它', '这', '那', '人', '事', '时', '地', '的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '个', '上', '下', '来', '去', '着', '过', '里', '外', '前', '后', '天', '地', '人', '生', '死', '爱', '恨', '情', '义', '心', '手', '眼', '嘴', '头', '脚', '身体'
    ])
    return commonWords.has(word)
  }

  private findInconsistencies(character: string, traits: TraitOccurrence[], chapters: ChapterContext[]): QualityIssue[] {
    const issues: QualityIssue[] = []
    
    // Group traits by type
    const traitByType: Record<string, TraitOccurrence[]> = {}
    for (const trait of traits) {
      if (!traitByType[trait.trait]) {
        traitByType[trait.trait] = []
      }
      traitByType[trait.trait].push(trait)
    }

    // Check each trait type for inconsistencies
    for (const [traitType, occurrences] of Object.entries(traitByType)) {
      if (occurrences.length < 2) continue

      // Look for opposite traits in different chapters
      const emotionalOpposites: Record<string, string[]> = {
        '高兴': ['悲伤', '难过', '生气', '愤怒', '恐惧'],
        '悲伤': ['高兴', '开心', '快乐'],
        '愤怒': ['高兴', '开心', '平静'],
        '恐惧': ['勇敢', '镇定', '冷静'],
        '冷静': ['紧张', '激动', '愤怒'],
        '紧张': ['放松', '平静', '冷静'],
      }

      // Get keywords for this trait type
      const keywords = [...new Set(occurrences.map(o => o.keyword))]
      
      for (const keyword of keywords) {
        const opposites = emotionalOpposites[keyword]
        if (!opposites) continue

        for (const occurrence of occurrences) {
          if (occurrence.keyword === keyword) {
            // Check if opposite keyword appears in another chapter
            for (const otherOccurrence of occurrences) {
              if (otherOccurrence.chapterIndex !== occurrence.chapterIndex &&
                  opposites.includes(otherOccurrence.keyword)) {
                // Found inconsistency
                issues.push({
                  type: 'consistency',
                  severity: 'warning',
                  position: {
                    paragraph: occurrence.paragraphIndex,
                    chapter: occurrence.chapterIndex,
                    start: 0,
                    end: occurrence.context.length
                  },
                  message: `角色"${character}"在第${otherOccurrence.chapterIndex + 1}章表现出"${otherOccurrence.keyword}"，与第${occurrence.chapterIndex + 1}章的"${keyword}"不一致`,
                  suggestion: `建议保持角色行为的连贯性，或通过合理的成长/变化解释这种改变`,
                  priority: 'medium'
                })
              }
            }
          }
        }
      }
    }

    return issues
  }
}

interface TraitOccurrence {
  trait: string
  keyword: string
  chapterIndex: number
  paragraphIndex: number
  context: string
}