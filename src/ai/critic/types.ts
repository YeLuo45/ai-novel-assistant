/**
 * CriticAgent Quality Analysis Types
 */

export type IssueSeverity = 'error' | 'warning' | 'info'

export type IssueType = 
  | 'length' 
  | 'style' 
  | 'duplicate' 
  | 'dialogue_flow'

export interface QualityIssue {
  type: IssueType
  severity: IssueSeverity
  position: {
    paragraph?: number
    sentence?: number
    start: number
    end: number
  }
  message: string
  suggestion?: string
}

export interface RadarData {
  length: number      // 0-100 paragraph length health
  style: number       // 0-100 style consistency
  duplicate: number   // 0-100 duplicate-free score
  dialogue: number    // 0-100 dialogue flow health
}

export interface QualityResult {
  score: number        // 0-100 overall quality score
  issues: QualityIssue[]
  radarData: RadarData
}

export interface DialogueEntry {
  speaker: string
  content: string
  index: number
}

export interface CriticContext {
  content: string
  paragraph: string
  paragraphIndex: number
  previousChapterVocabulary?: string[]
  allDialogues?: DialogueEntry[]
}

export interface Detector {
  name: string
  detect(context: CriticContext): Promise<QualityIssue[]>
  getScore(context: CriticContext): Promise<number>
}
