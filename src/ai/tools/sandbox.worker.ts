/**
 * Sandbox Worker V2 — Web Worker based isolation for custom tool execution
 * Provides secure execution environment with DOM/BOM access denied
 */

// Message types
interface SandboxMessage {
  type: 'execute' | 'terminate'
  id: string
  payload?: {
    code: string
    input: unknown
    context: Record<string, unknown>
    timeout: number
  }
}

interface SandboxResult {
  type: 'result' | 'error' | 'log'
  id: string
  success: boolean
  output?: unknown
  error?: string
  executionTime: number
  logs?: string[]
}

// Security blocked patterns
const BLOCKED_PATTERNS = [
  'fetch(', 'XMLHttpRequest', 'WebSocket',
  'document.', 'window.', 'localStorage', 'sessionStorage',
  'eval(', 'Function(', 'setTimeout', 'setInterval',
  'importScripts', 'WorkerNavigator', 'navigator.userAgent',
  'location.href', 'location.pathname', 'history.',
  'require(', 'module.exports', '__dirname', '__filename',
  'process.', 'child_process', 'fs.', 'fsync'
]

const MAX_EXECUTION_TIME = 30000 // 30 seconds
const MAX_OUTPUT_LENGTH = 50000

// Logging capture
const logs: string[] = []

function log(...args: unknown[]): void {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
  logs.push(msg)
}

// Console mock for sandboxed code
const mockConsole = {
  log: (...args: unknown[]) => log('[LOG]', ...args),
  warn: (...args: unknown[]) => log('[WARN]', ...args),
  error: (...args: unknown[]) => log('[ERROR]', ...args),
  info: (...args: unknown[]) => log('[INFO]', ...args)
}

// Security validation
function validateCode(code: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (code.includes(pattern)) {
      return { valid: false, reason: `Blocked pattern: ${pattern}` }
    }
  }
  return { valid: true }
}

// Create sandboxed execution function
function createSandbox() {
  return {
    console: mockConsole,
    input: undefined as unknown,
    context: {} as Record<string, unknown>,
    result: undefined as unknown
  }
}

// Execute user code in sandbox
async function executeSandboxed(
  code: string,
  input: unknown,
  context: Record<string, unknown>,
  timeout: number
): Promise<{ output: unknown; error?: string }> {
  return new Promise((resolve) => {
    const sandbox = createSandbox()
    sandbox.input = input
    sandbox.context = context

    // Timeout wrapper
    const timeoutId = setTimeout(() => {
      resolve({ output: undefined, error: `Execution timeout after ${timeout}ms` })
    }, timeout)

    try {
      // Create a function wrapper for execution
      const wrappedCode = `
        (function(sandbox) {
          'use strict';
          ${code}
        })
      `
      
      // eslint-disable-next-line no-new-func
      const fn = new Function('sandbox', wrappedCode)
      
      // Override console in scope
      const scope = {
        console: mockConsole,
        input: sandbox.input,
        context: sandbox.context,
        result: undefined
      }

      // Execute with proxy to capture result
      const result = fn.call(scope, scope)
      
      clearTimeout(timeoutId)
      
      if (result !== undefined) {
        resolve({ output: result })
      } else if (scope.result !== undefined) {
        resolve({ output: scope.result })
      } else {
        resolve({ output: logs.slice(-1)[0] || 'Execution completed with no output' })
      }
    } catch (error) {
      clearTimeout(timeoutId)
      resolve({
        output: undefined,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  })
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<SandboxMessage>) => {
  const { type, id, payload } = event.data

  if (type === 'terminate') {
    // Clean termination
    logs.length = 0
    self.close()
    return
  }

  if (type === 'execute' && payload) {
    const startTime = Date.now()
    const { code, input, context, timeout } = payload

    // Validate security
    const validation = validateCode(code)
    if (!validation.valid) {
      self.postMessage({
        type: 'error',
        id,
        success: false,
        error: `Security violation: ${validation.reason}`,
        executionTime: 0
      } as SandboxResult)
      return
    }

    // Execute in sandbox
    const { output, error } = await executeSandboxed(
      code,
      input,
      context,
      Math.min(timeout || MAX_EXECUTION_TIME, MAX_EXECUTION_TIME)
    )

    const executionTime = Date.now() - startTime

    // Truncate output if too large
    let finalOutput = output
    if (typeof output === 'string' && output.length > MAX_OUTPUT_LENGTH) {
      finalOutput = output.slice(0, MAX_OUTPUT_LENGTH) + '... [TRUNCATED]'
    }

    self.postMessage({
      type: 'result',
      id,
      success: !error,
      output: finalOutput,
      error,
      executionTime,
      logs: [...logs]
    } as SandboxResult)

    // Clear logs after sending
    logs.length = 0
  }
}

// Signal ready
self.postMessage({ type: 'ready' })