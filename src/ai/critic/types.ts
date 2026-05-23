/**
 * CriticAgent Quality Analysis Types
 */

export type IssueSeverity = 'error' | 'warning' | 'info'

export type IssueType = 
  | 'length' 
  | 'style' 
  | 'duplicate' 
  | 'dialogue_flow'
  | 'consistency'
  | 'pacing'
  | 'tension'

export interface QualityIssue {
  type: IssueType
  severity: IssueSeverity
  position: {
    paragraph?: number
    chapter?: number
    sentence?: number
    start: number
    end: number
  }
  message: string
  suggestion?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface RadarData {
  length: number      // 0-100 paragraph length health
  style: number       // 0-100 style consistency
  duplicate: number   // 0-100 duplicate-free score
  dialogue: number    // 0-100 dialogue flow health
  consistency: number // 0-100 character consistency
  pacing: number      // 0-100 story pacing
  tension: number     // 0-100 tension/conflict
}

export interface ExtendedRadarData {
  overall: number
  consistency: number
  pacing: number
  tension: number
  dialogue: number
  style: number
  length: number
}

export interface QualityScore {
  overall: number     // 0-100
  consistency: number // 0-100
  pacing: number
  tension: number
  dialogue: number
  style: number
  length: number
}

export interface ChapterContext {
  chapterIndex: number
  chapterTitle?: string
  content: string
  paragraphs: string[]
}

export interface DialogueEntry {
  speaker: string
  content: string
  index: number
}

export interface QualityResult {
  score: number        // 0-100 overall quality score
  issues: QualityIssue[]
  radarData: RadarData
}

export interface CriticContext {
  content: string
  paragraph: string
  paragraphIndex: number
  previousChapterVocabulary?: string[]
  allDialogues?: DialogueEntry[]
  chapters?: ChapterContext[]
  previousChapterContent?: string
}

export interface Detector {
  name: string
  detect(context: CriticContext): Promise<QualityIssue[]>
  getScore(context: CriticContext): Promise<number>
}
