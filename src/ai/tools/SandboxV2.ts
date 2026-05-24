/**
 * Sandbox V2 — Web Worker based execution environment
 * Provides isolated execution for custom tools
 */

import type { WritingToolV2, ToolInput, ToolOutput } from "./types"

export interface SandboxConfig {
  timeout: number
  enableIsolation: boolean
  allowedDomains?: string[]
  blockedPatterns?: string[]
}

export interface SandboxResult {
  success: boolean
  output: string
  error?: string
  executionTime: number
  logs?: string[]
}

// Sandbox worker URL
const SANDBOX_WORKER_URL = new URL("./sandbox.worker.ts", import.meta.url)

class SandboxExecutor {
  private worker: Worker | null = null
  private pendingRequests = new Map<string, {
    resolve: (result: SandboxResult) => void
    reject: (error: Error) => void
    timeoutId: ReturnType<typeof setTimeout>
  }>()

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(SANDBOX_WORKER_URL, { type: "module" })
      this.worker.onmessage = this.handleMessage.bind(this)
      this.worker.onerror = this.handleError.bind(this)
    } catch (error) {
      console.error("Failed to initialize sandbox worker:", error)
    }
  }

  private handleMessage(event: MessageEvent): void {
    const { type, id, success, output, error, executionTime, logs } = event.data

    if (type === "ready") return

    const pending = this.pendingRequests.get(id)
    if (pending) {
      clearTimeout(pending.timeoutId)
      this.pendingRequests.delete(id)
      pending.resolve({ success, output: String(output ?? ""), error, executionTime, logs })
    }
  }

  private handleError(error: ErrorEvent): void {
    console.error("Sandbox worker error:", error)
  }

  async execute(
    code: string,
    input: unknown,
    context: Record<string, unknown> = {},
    config: Partial<SandboxConfig> = {}
  ): Promise<SandboxResult> {
    const timeout = config.timeout || 30000

    if (!this.worker) {
      return { success: false, output: "", error: "Sandbox worker not initialized", executionTime: 0 }
    }

    return new Promise((resolve) => {
      const id = `sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id)
        resolve({ success: false, output: "", error: `Execution timeout after ${timeout}ms`, executionTime: timeout })
      }, timeout)

      this.pendingRequests.set(id, { resolve, reject: () => {}, timeoutId })
      this.worker!.postMessage({ type: "execute", id, payload: { code, input, context, timeout } })
    })
  }

  terminate(): void {
    if (this.worker) {
      this.worker.postMessage({ type: "terminate" })
      this.worker.terminate()
      this.worker = null
      this.pendingRequests.forEach(({ timeoutId }) => clearTimeout(timeoutId))
      this.pendingRequests.clear()
    }
  }
}

export const sandboxExecutor = new SandboxExecutor()

export async function executeInSandboxV2(
  tool: WritingToolV2,
  input: ToolInput,
  context: { projectId: number; chapterId: number }
): Promise<ToolOutput> {
  const startTime = Date.now()
  const customCode = (tool as any).customCode

  if (!customCode) {
    return tool.execute(input, context)
  }

  const result = await sandboxExecutor.execute(
    customCode,
    { text: input.text, context: input.context },
    { projectId: context.projectId, chapterId: context.chapterId }
  )

  return {
    success: result.success,
    output: result.output,
    error: result.error,
    metadata: { executionTime: result.executionTime, logs: result.logs }
  }
}

export default sandboxExecutor
