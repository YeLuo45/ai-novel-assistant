/**
 * docs/APIDoc.ts (V1-V10) - 10 engines
 *
 * - V1 OpenAPIGenerator: OpenAPI/Swagger schema
 * - V2 GraphQLSchemaGenerator: GraphQL SDL
 * - V3 TypeDocGenerator: TypeScript 文档
 * - V4 RestDocGenerator: REST API 文档
 * - V5 AsyncAPIGenerator: 异步 API 文档
 * - V6 MarkdownRenderer: Markdown 渲染
 * - V7 CodeHighlighter: 代码高亮
 * - V8 DiagramGenerator: 图表生成
 * - V9 MermaidRenderer: Mermaid 渲染
 * - V10 MarkdownLinter: Markdown 检查
 */

// =============================================================================
// V1: OpenAPIGenerator
// =============================================================================

export interface OpenAPIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  summary: string
  parameters?: Array<{ name: string; in: 'query' | 'path' | 'header' | 'body'; required: boolean; type: string; description?: string }>
  responses?: Record<string, { description: string; schema?: Record<string, unknown> }>
  tags?: string[]
}

export class OpenAPIGenerator {
  private _endpoints: OpenAPIEndpoint[] = []
  private _info: { title: string; version: string; description?: string } = { title: 'API', version: '1.0.0' }

  setInfo(info: Partial<OpenAPIGenerator['_info']>): void { Object.assign(this._info, info) }

  addEndpoint(endpoint: OpenAPIEndpoint): void { this._endpoints.push(endpoint) }

  generate(): string {
    const paths: Record<string, Record<string, unknown>> = {}
    for (const ep of this._endpoints) {
      if (!paths[ep.path]) paths[ep.path] = {}
      paths[ep.path]![ep.method.toLowerCase()] = {
        summary: ep.summary,
        tags: ep.tags ?? [],
        parameters: ep.parameters ?? [],
        responses: ep.responses ?? { '200': { description: 'OK' } },
      }
    }
    return JSON.stringify({
      openapi: '3.0.0',
      info: this._info,
      paths,
    }, null, 2)
  }

  count(): number { return this._endpoints.length }
}

// =============================================================================
// V2: GraphQLSchemaGenerator
// =============================================================================

export class GraphQLSchemaGenerator {
  private _types: Map<string, { fields: Array<{ name: string; type: string; args?: string[] }> }> = new Map()
  private _queries: Array<{ name: string; returnType: string; args?: string }> = []
  private _mutations: Array<{ name: string; returnType: string; args?: string }> = []

  addType(name: string, fields: Array<{ name: string; type: string; args?: string[] }>): void {
    this._types.set(name, { fields })
  }

  addQuery(name: string, returnType: string, args?: string): void {
    this._queries.push({ name, returnType, args })
  }

  addMutation(name: string, returnType: string, args?: string): void {
    this._mutations.push({ name, returnType, args })
  }

  generate(): string {
    const lines: string[] = []
    for (const [name, def] of this._types) {
      lines.push(`type ${name} {`)
      for (const f of def.fields) {
        const args = f.args && f.args.length > 0 ? `(${f.args.join(', ')})` : ''
        lines.push(`  ${f.name}${args}: ${f.type}`)
      }
      lines.push('}')
      lines.push('')
    }
    if (this._queries.length > 0) {
      lines.push('type Query {')
      for (const q of this._queries) {
        const args = q.args ? `(${q.args})` : ''
        lines.push(`  ${q.name}${args}: ${q.returnType}`)
      }
      lines.push('}')
      lines.push('')
    }
    if (this._mutations.length > 0) {
      lines.push('type Mutation {')
      for (const m of this._mutations) {
        const args = m.args ? `(${m.args})` : ''
        lines.push(`  ${m.name}${args}: ${m.returnType}`)
      }
      lines.push('}')
    }
    return lines.join('\n')
  }
}

// =============================================================================
// V3: TypeDocGenerator
// =============================================================================

export interface TSExport {
  name: string
  kind: 'class' | 'function' | 'interface' | 'type' | 'const' | 'enum'
  signature?: string
  description?: string
  params?: Array<{ name: string; type: string; description?: string }>
  returns?: string
  example?: string
}

export class TypeDocGenerator {
  private _exports: TSExport[] = []

  addExport(exp: TSExport): void { this._exports.push(exp) }

  /** 生成 Markdown */
  toMarkdown(): string {
    const lines: string[] = ['# API Reference', '']
    for (const exp of this._exports) {
      lines.push(`## ${exp.name}`, '')
      lines.push(`*${exp.kind}*`, '')
      if (exp.description) lines.push(exp.description, '')
      if (exp.signature) lines.push('```typescript', exp.signature, '```', '')
      if (exp.params && exp.params.length > 0) {
        lines.push('**Parameters**:', '')
        for (const p of exp.params) {
          lines.push(`- \`${p.name}\` *(${p.type})*: ${p.description ?? ''}`)
        }
        lines.push('')
      }
      if (exp.returns) {
        lines.push(`**Returns**: \`${exp.returns}\``, '')
      }
      if (exp.example) {
        lines.push('**Example**:', '')
        lines.push('```typescript', exp.example, '```', '')
      }
    }
    return lines.join('\n')
  }

  /** JSON format */
  toJSON(): string {
    return JSON.stringify(this._exports, null, 2)
  }

  count(): number { return this._exports.length }
}

// =============================================================================
// V4: RestDocGenerator
// =============================================================================

export class RestDocGenerator {
  private _endpoints: Array<{ method: string; path: string; description: string; auth?: boolean }> = []

  add(method: string, path: string, description: string, auth: boolean = false): void {
    this._endpoints.push({ method, path, description, auth })
  }

  toMarkdown(): string {
    const lines: string[] = ['# REST API', '', '| Method | Path | Description | Auth |', '|--------|------|-------------|------|']
    for (const ep of this._endpoints) {
      lines.push(`| ${ep.method} | \`${ep.path}\` | ${ep.description} | ${ep.auth ? '🔒' : '🔓'} |`)
    }
    return lines.join('\n')
  }

  count(): number { return this._endpoints.length }
}

// =============================================================================
// V5: AsyncAPIGenerator
// =============================================================================

export class AsyncAPIGenerator {
  private _channels: Map<string, { description: string; subscribe?: { message: { name: string; payload: unknown } }; publish?: { message: { name: string; payload: unknown } } }> = new Map()

  addChannel(name: string, desc: string, subscribe?: any, publish?: any): void {
    this._channels.set(name, { description: desc, subscribe, publish })
  }

  generate(): string {
    const lines: string[] = ['asyncapi: 2.0.0', '', 'channels:']
    for (const [name, ch] of this._channels) {
      lines.push(`  ${name}:`)
      lines.push(`    description: ${ch.description}`)
      if (ch.subscribe) lines.push(`    subscribe: ${JSON.stringify(ch.subscribe)}`)
      if (ch.publish) lines.push(`    publish: ${JSON.stringify(ch.publish)}`)
    }
    return lines.join('\n')
  }
}

// =============================================================================
// V6: MarkdownRenderer
// =============================================================================

export class MarkdownRenderer {
  render(md: string): string {
    let html = md
    // headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // bold/italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang ?? ''}">${code.trim()}</code></pre>`)
    // inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    // links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // paragraphs
    html = html.split('\n\n').map(p => p.startsWith('<') ? p : `<p>${p}</p>`).join('\n')
    return html
  }

  toPlainText(md: string): string {
    return md.replace(/[#*`]/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1')
  }
}

// =============================================================================
// V7: CodeHighlighter
// =============================================================================

export type Language = 'typescript' | 'javascript' | 'python' | 'json' | 'bash' | 'markdown'

const KEYWORDS: Record<Language, string[]> = {
  typescript: ['function', 'interface', 'type', 'const', 'let', 'var', 'export', 'import', 'from', 'return', 'if', 'else', 'while', 'for', 'async', 'await', 'new', 'this', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'enum', 'namespace', 'module', 'declare', 'abstract'],
  javascript: ['function', 'const', 'let', 'var', 'export', 'import', 'from', 'return', 'if', 'else', 'while', 'for', 'async', 'await', 'new', 'this', 'extends', 'class', 'static'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'while', 'for', 'async', 'await', 'with', 'as'],
  json: [],
  bash: ['if', 'else', 'fi', 'for', 'do', 'done', 'while', 'function'],
  markdown: [],
}

export class CodeHighlighter {
  highlight(code: string, lang: Language): string {
    const keywords = KEYWORDS[lang] ?? []
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    // strings FIRST (so they don't get re-wrapped by attribute quotes from keywords)
    html = html.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="string">$1</span>')
    // keywords
    for (const kw of keywords) {
      const re = new RegExp(`\\b(${kw})\\b`, 'g')
      html = html.replace(re, '<span class="keyword">$1</span>')
    }
    // numbers
    html = html.replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    // comments
    html = html.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="comment">$1</span>')
    return html
  }
}

// =============================================================================
// V8: DiagramGenerator
// =============================================================================

export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'state' | 'er'

export class DiagramGenerator {
  /** ASCII flowchart */
  flowchart(nodes: Array<{ id: string; label: string }>, edges: Array<{ from: string; to: string; label?: string }>): string {
    return [
      'flowchart TD',
      ...nodes.map(n => `  ${n.id}["${n.label}"]`),
      ...edges.map(e => `  ${e.from} -->${e.label ? `|${e.label}|` : ''} ${e.to}`),
    ].join('\n')
  }

  sequence(actors: string[], messages: Array<{ from: string; to: string; label: string }>): string {
    return [
      'sequenceDiagram',
      ...actors.map(a => `  participant ${a}`),
      ...messages.map(m => `  ${m.from}->>${m.to}: ${m.label}`),
    ].join('\n')
  }
}

// =============================================================================
// V9: MermaidRenderer
// =============================================================================

export class MermaidRenderer {
  /** 验证 mermaid 语法基本完整性 */
  validate(code: string): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    const firstWord = code.split(/[\s\n]/)[0]
    if (!firstWord) issues.push('empty diagram')
    else if (!['flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'graph', 'gitGraph'].includes(firstWord)) {
      issues.push(`unknown diagram type: ${firstWord}`)
    }
    const hasRelationship = code.includes('-->') || code.includes('---') || code.includes('->>') || code.includes('--') || code.includes('-')
    if (!hasRelationship) issues.push('no relationships found')
    return { valid: issues.length === 0, issues }
  }

  toHTML(code: string): string {
    return `<div class="mermaid">\n${code}\n</div>`
  }
}

// =============================================================================
// V10: MarkdownLinter
// =============================================================================

export interface LintIssue {
  line: number
  severity: 'error' | 'warning'
  message: string
}

export class MarkdownLinter {
  lint(md: string): LintIssue[] {
    const issues: LintIssue[] = []
    const lines = md.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      // 跳过代码块
      if (line.trim().startsWith('```')) continue
      // heading 后没有空行
      if (/^#{1,6}\s/.test(line) && i > 0 && lines[i - 1]!.trim() !== '') {
        issues.push({ line: i + 1, severity: 'warning', message: 'heading should have blank line before' })
      }
      // trailing whitespace
      if (line !== line.trimEnd()) {
        issues.push({ line: i + 1, severity: 'warning', message: 'trailing whitespace' })
      }
      // 链接文本为空
      if (/\[.*?\]\(\s*\)/.test(line)) {
        issues.push({ line: i + 1, severity: 'error', message: 'empty link URL' })
      }
    }
    return issues
  }
}