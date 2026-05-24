/**
 * Tool Sandbox - Isolated iframe-based code execution environment
 * V52: Provides secure sandboxed execution using srcdoc iframe and postMessage
 */

import { generateId } from './toolMarketplaceDb'

// ============================================================================
// Type Definitions
// ============================================================================

export interface SandboxConfig {
  timeout: number // ms, default 30000
  enableIsolation: boolean
  blockedPatterns?: string[]
  maxOutputSize?: number
}

export interface SandboxResult {
  success: boolean
  result?: unknown
  error?: string
  executionTime: number
}

export interface SandboxMessage {
  type: 'execute' | 'result' | 'error'
  id: string
  code?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: string
}

// Default configuration
const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 30000,
  enableIsolation: true,
  blockedPatterns: [
    'eval',
    'Function',
    'constructor',
    '__proto__',
    'prototype',
    'window.top',
    'parent.opener',
    'document.cookie',
    'localStorage',
    'sessionStorage'
  ],
  maxOutputSize: 1000000 // 1MB
}

// ============================================================================
// ToolSandbox Class
// ============================================================================

export class ToolSandbox {
  private activeSandboxes = new Map<string, { iframe: HTMLIFrameElement; timeout: ReturnType<typeof setTimeout> }>()
  private messageHandlers = new Map<string, (result: SandboxResult) => void>()
  private config: SandboxConfig

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupMessageListener()
  }

  /**
   * Run code in a sandboxed iframe
   * @param code JavaScript code to execute
   * @param timeout Optional custom timeout in ms
   * @returns Promise resolving to execution result
   */
  async runSandboxed(code: string, timeout?: number): Promise<unknown> {
    const id = generateId()
    const effectiveTimeout = timeout || this.config.timeout

    return new Promise((resolve, reject) => {
      // Create sandboxed iframe
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.sandbox.add('allow-scripts')
      // No allow-same-origin - ensures full isolation

      // Track this sandbox
      let timeoutHandle: ReturnType<typeof setTimeout>
      let isCompleted = false

      const cleanup = () => {
        clearTimeout(timeoutHandle)
        window.removeEventListener('message', messageHandler)
        this.activeSandboxes.delete(id)
        this.messageHandlers.delete(id)
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      }

      const messageHandler = (event: MessageEvent) => {
        // Verify message source
        if (event.source !== iframe.contentWindow) return
        if (event.data.id !== id) return

        isCompleted = true
        cleanup()

        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }

      // Timeout handler
      timeoutHandle = setTimeout(() => {
        if (!isCompleted) {
          cleanup()
          reject(new Error(`Sandbox execution timeout after ${effectiveTimeout}ms`))
        }
      }, effectiveTimeout)

      window.addEventListener('message', messageHandler)

      // Store references for terminate()
      this.activeSandboxes.set(id, { iframe, timeout: timeoutHandle })
      this.messageHandlers.set(id, () => {
        // Handler is already registered above
      })

      // Append iframe to DOM before setting srcdoc
      document.body.appendChild(iframe)

      // Build sandbox HTML with code
      const sandboxHtml = this.buildSandboxHtml(id, code)
      iframe.srcdoc = sandboxHtml
    })
  }

  /**
   * Terminate a running sandbox by tool ID
   * @param toolId The tool ID to terminate
   */
  terminate(toolId: string): void {
    const sandbox = this.activeSandboxes.get(toolId)
    if (sandbox) {
      clearTimeout(sandbox.timeout)
      if (sandbox.iframe.parentNode) {
        sandbox.iframe.parentNode.removeChild(sandbox.iframe)
      }
      this.activeSandboxes.delete(toolId)
    }
  }

  /**
   * Terminate all active sandboxes
   */
  terminateAll(): void {
    Array.from(this.activeSandboxes.entries()).forEach(([id, sandbox]) => {
      clearTimeout(sandbox.timeout)
      if (sandbox.iframe.parentNode) {
        sandbox.iframe.parentNode.removeChild(sandbox.iframe)
      }
    })
    this.activeSandboxes.clear()
    this.messageHandlers.clear()
  }

  /**
   * Get count of active sandboxes
   */
  getActiveCount(): number {
    return this.activeSandboxes.size
  }

  /**
   * Update sandbox configuration
   */
  configure(config: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Only handle messages from our sandboxes
      if (!event.data || !event.data.id) return
      if (!this.messageHandlers.has(event.data.id)) return
    })
  }

  private buildSandboxHtml(id: string, code: string): string {
    // Wrap code to catch errors and return via postMessage
    const wrappedCode = `
      try {
        'use strict';
        const __params__ = (typeof params !== 'undefined') ? params : {};
        const __execute__ = async function() {
          ${code}
        };
        const __result__ = await __execute__();
        parent.postMessage({
          id: ${JSON.stringify(id)},
          result: __result__
        }, '*');
      } catch (__error__) {
        parent.postMessage({
          id: ${JSON.stringify(id)},
          error: __error__.message || String(__error__)
        }, '*');
      }
    `

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script>
    // Security: Block dangerous access patterns
    Object.defineProperty(window, 'top', { value: window, writable: false });
    Object.defineProperty(window, 'parent', { value: window, writable: false });
    Object.defineProperty(window, 'opener', { value: null, writable: false });
    
    // Block storage access
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    
    // Block prototype manipulation
    try {
      delete Object.prototype.__proto__;
    } catch (e) {}
    
    // Execute user code
    var params = {};
    ${wrappedCode}
  </script>
</head>
<body></body>
</html>`
  }

  private validateCode(code: string): { valid: boolean; error?: string } {
    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns || []) {
      if (code.includes(pattern)) {
        return { valid: false, error: `Blocked pattern detected: ${pattern}` }
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\s*eval\s*\(/,
      /\.\s*execScript\s*\(/,
      /with\s*\(/,
      /__defineGetter__/,
      /__defineSetter__/
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(code)) {
        return { valid: false, error: `Suspicious pattern detected` }
      }
    }

    return { valid: true }
  }

  private sanitizeOutput(output: unknown): unknown {
    if (this.config.maxOutputSize) {
      const outputStr = JSON.stringify(output)
      if (outputStr.length > this.config.maxOutputSize) {
        return { __truncated__: true, message: 'Output exceeded maximum size' }
      }
    }
    return output
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const toolSandbox = new ToolSandbox()