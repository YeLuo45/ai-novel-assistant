/**
 * CriticAgent Module
 * Quality analysis for novel content
 */

export { CriticAgent } from './CriticAgent'
export type { CriticAgentOptions } from './CriticAgent'
export type { 
  QualityResult, 
  QualityIssue, 
  RadarData, 
  IssueSeverity, 
  IssueType,
  ExtendedRadarData,
  QualityScore,
  ChapterContext,
  DialogueEntry,
  CriticContext,
  Detector
} from './types'

// Export new detectors
export { ConsistencyDetector } from './detectors/ConsistencyDetector'
export { PacingDetector } from './detectors/PacingDetector'
export { TensionDetector } from './detectors/TensionDetector'

// Export scoring and suggestion modules
export { QualityScorer } from './QualityScorer'
export { SuggestionGenerator } from './SuggestionGenerator'
export type { Suggestion } from './SuggestionGenerator'
