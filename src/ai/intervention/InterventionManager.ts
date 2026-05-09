import type { ExecutionStatus, InterventionPoint, UserAction, PauseCondition, InterventionType } from './types'

type StatusChangeCallback = (status: ExecutionStatus) => void
type InterventionPointCallback = (point: InterventionPoint) => void
type ResumeCallback = () => void

export class InterventionManager {
  private status: ExecutionStatus = 'idle'
  private interventionPoints: InterventionPoint[] = []
  private currentPoint: InterventionPoint | null = null
  private pauseConditions: PauseCondition[]
  private autoResume: boolean
  private autoResumeTimeout: number
  private agentOutputCount: Map<string, number> = new Map()
  
  onStatusChange?: StatusChangeCallback
  onInterventionPoint?: InterventionPointCallback
  onResume?: ResumeCallback
  
  constructor(
    pauseConditions: PauseCondition[] = [],
    autoResume: boolean = false,
    autoResumeTimeout: number = 30
  ) {
    this.pauseConditions = pauseConditions
    this.autoResume = autoResume
    this.autoResumeTimeout = autoResumeTimeout
  }
  
  startExecution(): void {
    this.status = 'running'
    this.agentOutputCount.clear()
    this.emitStatusChange()
  }
  
  checkPauseConditions(agentId: string, output: string): InterventionPoint | null {
    for (const condition of this.pauseConditions) {
      if (this.evaluateCondition(condition, agentId, output)) {
        const point = this.createInterventionPoint('agent_output', agentId, output)
        return point
      }
    }
    return null
  }
  
  createInterventionPoint(
    type: InterventionType,
    agentId: string | null,
    content: string,
    suggestedEdit?: string
  ): InterventionPoint {
    const point: InterventionPoint = {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      agentId,
      status: 'pending',
      content,
      suggestedEdit,
      createdAt: Date.now()
    }
    
    this.interventionPoints.push(point)
    this.currentPoint = point
    this.status = 'waiting_approval'
    this.emitStatusChange()
    
    if (this.onInterventionPoint) {
      this.onInterventionPoint(point)
    }
    
    return point
  }
  
  async handleUserAction(action: UserAction): Promise<{ resume: boolean, modifiedContent?: string }> {
    if (!this.currentPoint) {
      return { resume: true }
    }
    
    switch (action.type) {
      case 'approve':
        this.currentPoint.status = 'approved'
        this.currentPoint.userAction = action
        this.currentPoint.resolvedAt = Date.now()
        this.resumeExecution()
        return { resume: true }
      
      case 'reject':
        this.currentPoint.status = 'rejected'
        this.currentPoint.userAction = action
        this.currentPoint.userComment = action.userComment
        this.currentPoint.resolvedAt = Date.now()
        return { resume: true }
      
      case 'modify':
        this.currentPoint.status = 'modified'
        this.currentPoint.userAction = action
        this.currentPoint.modifiedContent = action.modifiedContent || ''
        this.currentPoint.userComment = action.userComment
        this.currentPoint.resolvedAt = Date.now()
        this.resumeExecution()
        return { resume: true, modifiedContent: action.modifiedContent }
      
      case 'rerun':
        this.currentPoint.status = 'rejected'
        this.currentPoint.userAction = action
        this.currentPoint.resolvedAt = Date.now()
        return { resume: false }
      
      case 'skip':
        this.currentPoint.status = 'approved'
        this.currentPoint.userAction = action
        this.currentPoint.resolvedAt = Date.now()
        this.resumeExecution()
        return { resume: true }
      
      case 'pause':
        this.status = 'paused'
        this.emitStatusChange()
        return { resume: false }
      
      default:
        return { resume: true }
    }
  }
  
  resumeExecution(): void {
    this.status = 'resuming'
    this.emitStatusChange()
    
    setTimeout(() => {
      this.status = 'running'
      this.currentPoint = null
      this.emitStatusChange()
      
      if (this.onResume) {
        this.onResume()
      }
    }, 100)
  }
  
  completeExecution(): void {
    this.status = 'completed'
    this.emitStatusChange()
  }
  
  reset(): void {
    this.status = 'idle'
    this.interventionPoints = []
    this.currentPoint = null
    this.agentOutputCount.clear()
    this.emitStatusChange()
  }
  
  private evaluateCondition(condition: PauseCondition, agentId: string, output: string): boolean {
    if (condition.trigger === 'agent_complete') {
      if (condition.agentId && condition.agentId !== agentId) {
        return false
      }
      
      // 更新计数
      const count = (this.agentOutputCount.get(agentId) || 0) + 1
      this.agentOutputCount.set(agentId, count)
      
      if (condition.params.afterCount && count % condition.params.afterCount === 0) {
        return true
      }
      
      if (condition.params.ifContentLengthOver && output.length > condition.params.ifContentLengthOver) {
        return true
      }
    }
    
    return false
  }
  
  private emitStatusChange(): void {
    if (this.onStatusChange) {
      this.onStatusChange(this.status)
    }
  }
  
  getStatus(): ExecutionStatus {
    return this.status
  }
  
  getInterventionPoints(): InterventionPoint[] {
    return this.interventionPoints
  }
  
  getCurrentPoint(): InterventionPoint | null {
    return this.currentPoint
  }
}