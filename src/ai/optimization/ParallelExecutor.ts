import type { AgentId } from '../collaboration/types'

export interface ParallelTask {
  id: string
  agentId: AgentId
  prompt: string
  dependencies: string[]
}

export interface ParallelResult {
  id: string
  success: boolean
  output?: string
  error?: string
}

export class ParallelExecutor {
  private maxConcurrency: number = 2
  
  async execute(
    tasks: ParallelTask[],
    executor: (agentId: AgentId, prompt: string) => Promise<string>
  ): Promise<Map<string, ParallelResult>> {
    const results = new Map<string, ParallelResult>()
    const pending = new Set(tasks.map(t => t.id))
    const executing = new Set<string>()
    const taskMap = new Map(tasks.map(t => [t.id, t]))
    
    while (pending.size > 0) {
      const ready = tasks.filter(t => 
        pending.has(t.id) && 
        !executing.has(t.id) &&
        t.dependencies.every(dep => results.has(dep))
      )
      
      const toStart = ready.slice(0, this.maxConcurrency - executing.size)
      
      for (const task of toStart) {
        executing.add(task.id)
        
        this.executeTask(task, executor, results, taskMap).then(result => {
          results.set(task.id, result)
          pending.delete(task.id)
          executing.delete(task.id)
        })
      }
      
      if (executing.size === 0 && pending.size > 0) {
        console.error('Circular dependency detected')
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }
  
  private async executeTask(
    task: ParallelTask,
    executor: (agentId: AgentId, prompt: string) => Promise<string>,
    results: Map<string, ParallelResult>,
    taskMap: Map<string, ParallelTask>
  ): Promise<ParallelResult> {
    try {
      let enhancedPrompt = task.prompt
      
      for (const depId of task.dependencies) {
        const depResult = results.get(depId)
        if (depResult?.success && depResult.output) {
          enhancedPrompt = `【前置任务 ${depId} 的输出】\n${depResult.output}\n\n${enhancedPrompt}`
        }
      }
      
      const output = await executor(task.agentId, enhancedPrompt)
      return { id: task.id, success: true, output }
    } catch (error) {
      return { id: task.id, success: false, error: String(error) }
    }
  }
  
  static fromSequential(subtasks: Array<{ responsible: AgentId; prompt: string }>): ParallelTask[] {
    return subtasks.map((st, index) => ({
      id: `task_${index}`,
      agentId: st.responsible,
      prompt: st.prompt,
      dependencies: index > 0 ? [`task_${index - 1}`] : []
    }))
  }
}

export const parallelExecutor = new ParallelExecutor()
