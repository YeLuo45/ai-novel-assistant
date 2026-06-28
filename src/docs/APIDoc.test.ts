/**
 * docs/APIDoc.test.ts (V1-V10) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  OpenAPIGenerator, GraphQLSchemaGenerator, TypeDocGenerator, RestDocGenerator, AsyncAPIGenerator,
  MarkdownRenderer, CodeHighlighter, DiagramGenerator, MermaidRenderer, MarkdownLinter,
} from './APIDoc'

describe('V1: OpenAPIGenerator', () => {
  it('generate', () => {
    const g = new OpenAPIGenerator()
    g.setInfo({ title: 'My API', version: '2.0.0' })
    g.addEndpoint({ path: '/users', method: 'GET', summary: 'List users' })
    const spec = g.generate()
    expect(spec).toContain('openapi')
    expect(spec).toContain('My API')
    expect(spec).toContain('List users')
  })
})

describe('V2: GraphQLSchemaGenerator', () => {
  it('generate schema', () => {
    const g = new GraphQLSchemaGenerator()
    g.addType('User', [{ name: 'id', type: 'ID!' }, { name: 'name', type: 'String!' }])
    g.addQuery('user', 'User', 'id: ID!')
    const schema = g.generate()
    expect(schema).toContain('type User')
    expect(schema).toContain('id: ID!')
    expect(schema).toContain('type Query')
    expect(schema).toContain('user(id: ID!): User')
  })

  it('addMutation', () => {
    const g = new GraphQLSchemaGenerator()
    g.addMutation('createUser', 'User!', 'name: String!')
    expect(g.generate()).toContain('createUser(name: String!): User!')
  })
})

describe('V3: TypeDocGenerator', () => {
  it('toMarkdown', () => {
    const t = new TypeDocGenerator()
    t.addExport({ name: 'foo', kind: 'function', description: 'A function', signature: 'foo(): void', returns: 'void' })
    const md = t.toMarkdown()
    expect(md).toContain('# API Reference')
    expect(md).toContain('## foo')
    expect(md).toContain('A function')
  })

  it('toJSON', () => {
    const t = new TypeDocGenerator()
    t.addExport({ name: 'bar', kind: 'class' })
    expect(JSON.parse(t.toJSON())[0].name).toBe('bar')
  })
})

describe('V4: RestDocGenerator', () => {
  it('toMarkdown table', () => {
    const r = new RestDocGenerator()
    r.add('GET', '/users', 'List users')
    r.add('POST', '/users', 'Create user', true)
    const md = r.toMarkdown()
    expect(md).toContain('GET')
    expect(md).toContain('POST')
    expect(md).toContain('🔒')
  })
})

describe('V5: AsyncAPIGenerator', () => {
  it('generate', () => {
    const a = new AsyncAPIGenerator()
    a.addChannel('user-events', 'User events')
    const spec = a.generate()
    expect(spec).toContain('asyncapi')
    expect(spec).toContain('user-events')
  })
})

describe('V6: MarkdownRenderer', () => {
  it('render basic', () => {
    const r = new MarkdownRenderer()
    const html = r.render('# Hello\n\nThis is **bold**')
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('render code block', () => {
    const r = new MarkdownRenderer()
    const html = r.render('```ts\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('language-ts')
  })

  it('toPlainText', () => {
    const r = new MarkdownRenderer()
    expect(r.toPlainText('**bold** and `code`')).toBe('bold and code')
  })
})

describe('V7: CodeHighlighter', () => {
  it('highlight TS keywords', () => {
    const h = new CodeHighlighter()
    const html = h.highlight('const x = 1', 'typescript')
    expect(html).toContain('class="keyword"')
    expect(html).toContain('1')
  })

  it('highlight strings', () => {
    const h = new CodeHighlighter()
    // Use a string that doesn't contain any HTML attribute-like quotes
    expect(h.highlight("const greeting = 'hello world'", 'typescript')).toContain('class="string"')
  })

  it('highlight comments', () => {
    const h = new CodeHighlighter()
    expect(h.highlight('// comment', 'typescript')).toContain('class="comment"')
  })
})

describe('V8: DiagramGenerator', () => {
  it('flowchart', () => {
    const d = new DiagramGenerator()
    const out = d.flowchart(
      [{ id: 'A', label: 'Start' }, { id: 'B', label: 'End' }],
      [{ from: 'A', to: 'B' }],
    )
    expect(out).toContain('flowchart TD')
    expect(out).toContain('A["Start"]')
    expect(out).toContain('A --> B')
  })

  it('sequence', () => {
    const d = new DiagramGenerator()
    const out = d.sequence(['A', 'B'], [{ from: 'A', to: 'B', label: 'request' }])
    expect(out).toContain('sequenceDiagram')
    expect(out).toContain('A->>B: request')
  })
})

describe('V9: MermaidRenderer', () => {
  it('validate flowchart', () => {
    const m = new MermaidRenderer()
    expect(m.validate('flowchart TD\n  A --- B').valid).toBe(true)
  })

  it('validate unknown type', () => {
    const m = new MermaidRenderer()
    const r = m.validate('unknown\n  A --- B')
    expect(r.valid).toBe(false)
  })

  it('toHTML', () => {
    const m = new MermaidRenderer()
    expect(m.toHTML('flowchart TD\n  A --> B')).toContain('class="mermaid"')
  })
})

describe('V10: MarkdownLinter', () => {
  it('clean MD', () => {
    const l = new MarkdownLinter()
    expect(l.lint('# Title\n\nBody\n').length).toBe(0)
  })

  it('heading without blank line', () => {
    const l = new MarkdownLinter()
    const issues = l.lint('Paragraph\n# Heading\n')
    expect(issues.length).toBeGreaterThan(0)
  })

  it('empty link URL', () => {
    const l = new MarkdownLinter()
    const issues = l.lint('Click [here]()')
    expect(issues.some(i => i.severity === 'error')).toBe(true)
  })
})