import type { GenreId, GenreDetectionResult } from './types'
import { getGenreConfig } from './genreConfig'
import { mysteryDetector } from './detectors/mysteryDetector'
import { romanceDetector } from './detectors/romanceDetector'
import { scifiDetector } from './detectors/scifiDetector'
import { fanficDetector } from './detectors/fanficDetector'

/**
 * 根据类型执行检测
 */
export function detectByGenre(content: string, genreId: GenreId): GenreDetectionResult {
  const config = getGenreConfig(genreId)
  
  if (!config.detectors.enabled) {
    return { genreId, issues: [], metrics: {} }
  }
  
  switch (genreId) {
    case 'mystery':
      return mysteryDetector.detect(content)
    case 'romance':
      return romanceDetector.detect(content)
    case 'scifi':
      return scifiDetector.detect(content)
    case 'fanfiction':
      return fanficDetector.detect(content)
    default:
      return { genreId, issues: [], metrics: {} }
  }
}

/**
 * 获取类型增强的提示词
 */
export function getGenreEnhancedPrompt(
  basePrompt: string,
  agentType: 'plotExpert' | 'dialogueMaster' | 'styleGuard' | 'criticAgent',
  genreId: GenreId
): string {
  const config = getGenreConfig(genreId)
  const enhancements = config.agentEnhancements[agentType]
  
  if (!enhancements || enhancements.length === 0) {
    return basePrompt
  }
  
  return `${basePrompt}

【${config.name}类型增强】
${enhancements.map(e => `- ${e}`).join('\n')}`
}
