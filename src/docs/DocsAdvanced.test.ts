/**
 * docs/DocsAdvanced.test.ts (V11-V25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  StorybookConfig, ComponentCatalog, PropTable, StoryControls, DocExtractor,
  RecipeSystem, TemplateEngine, SnippetCollector, ExampleBuilder, Cookbook,
  SpecValidator, ContractTest, APIVersioning, CompatChecker, DeprecationTracker,
} from './DocsAdvanced'

describe('V11: StorybookConfig', () => {
  it('addStory + generateIndex', () => {
    const sb = new StorybookConfig()
    sb.addStory({ storyId: 'btn-1', title: 'Primary', component: 'Button' })
    expect(sb.generateIndex()).toContain('btn-1')
  })
})

describe('V12: ComponentCatalog', () => {
  it('register + byCategory + search', () => {
    const c = new ComponentCatalog()
    c.register({ name: 'Button', category: 'form', description: 'A button', tags: ['ui'] })
    c.register({ name: 'Modal', category: 'overlay', description: 'Modal dialog', tags: ['ui'] })
    expect(c.byCategory('form').length).toBe(1)
    expect(c.search('button').length).toBe(1)
    expect(c.categories()).toContain('form')
  })
})

describe('V13: PropTable', () => {
  it('generate markdown table', () => {
    const p = new PropTable()
    const md = p.generate([
      { name: 'color', type: 'string', required: true, defaultValue: 'blue' },
      { name: 'size', type: 'number', required: false },
    ])
    expect(md).toContain('| color |')
    expect(md).toContain('✓')
    expect(md).toContain('blue')
  })
})

describe('V14: StoryControls', () => {
  it('add + generateArgs + toJSON', () => {
    const c = new StoryControls()
    c.add({ name: 'label', type: 'text', defaultValue: 'Click me' })
    c.add({ name: 'disabled', type: 'boolean', defaultValue: false })
    expect(c.generateArgs()).toEqual({ label: 'Click me', disabled: false })
  })
})

describe('V15: DocExtractor', () => {
  it('fromCode (JSDoc)', () => {
    const e = new DocExtractor()
    const code = `
/** Adds two numbers */
function add(a, b) { return a + b }
`
    const r = e.fromCode(code)
    expect(r[0]?.name).toBe('add')
  })

  it('fromComments (TODO/FIXME)', () => {
    const e = new DocExtractor()
    const code = `// TODO: refactor\n// FIXME: bug\n// regular comment\n`
    const r = e.fromComments(code)
    expect(r.length).toBe(2)
    expect(r.some(i => i.type === 'TODO')).toBe(true)
  })
})

describe('V16: RecipeSystem', () => {
  it('add + byDifficulty', () => {
    const r = new RecipeSystem()
    r.add({ recipeId: 'r1', title: 'Easy recipe', description: '', ingredients: [], steps: ['step 1'], difficulty: 'easy' })
    r.add({ recipeId: 'r2', title: 'Hard recipe', description: '', ingredients: [], steps: ['step 1'], difficulty: 'hard' })
    expect(r.byDifficulty('easy').length).toBe(1)
  })
})

describe('V17: TemplateEngine', () => {
  it('render basic', () => {
    const t = new TemplateEngine()
    expect(t.render('Hello {{name}}', { name: 'World' })).toBe('Hello World')
  })

  it('renderConditional', () => {
    const t = new TemplateEngine()
    const out = t.renderConditional('{{#if show}}visible{{/if}}', { show: true })
    expect(out).toBe('visible')
  })

  it('renderEach', () => {
    const t = new TemplateEngine()
    const out = t.renderEach('{{#each items}}[{{name}}]{{/each}}', 'items', [{ name: 'a' }, { name: 'b' }], (item: any) => ({ name: item.name }))
    expect(out).toBe('[a][b]')
  })
})

describe('V18: SnippetCollector', () => {
  it('add + byTag + search', () => {
    const s = new SnippetCollector()
    s.add({ snippetId: 's1', title: 'Fetch user', language: 'typescript', code: 'await fetch("/user")', tags: ['api', 'fetch'] })
    expect(s.byTag('api').length).toBe(1)
    expect(s.search('fetch').length).toBe(1)
  })
})

describe('V19: ExampleBuilder', () => {
  it('build + format', () => {
    const e = new ExampleBuilder()
    e.add('ex1', 'Hello', ['step 1', 'step 2'], 'Hello, World!')
    const md = e.build('ex1')
    expect(md).toContain('Hello')
    expect(md).toContain('1. step 1')
  })
})

describe('V20: Cookbook', () => {
  it('addRecipe + addSection + toMarkdown', () => {
    const cb = new Cookbook()
    cb.addRecipe({ recipeId: 'r1', title: 'Recipe 1', description: 'desc', ingredients: [], steps: ['s1'], difficulty: 'easy' })
    cb.addSection({ sectionId: 's1', title: 'Getting Started', recipes: ['r1'] })
    const md = cb.toMarkdown()
    expect(md).toContain('Cookbook')
    expect(md).toContain('Recipe 1')
  })
})

describe('V21: SpecValidator', () => {
  it('valid spec', () => {
    const v = new SpecValidator()
    expect(v.validate({ name: 'API', version: '1.0.0', endpoints: [{ method: 'GET', path: '/users' }] }).valid).toBe(true)
  })

  it('duplicate endpoint', () => {
    const v = new SpecValidator()
    const r = v.validate({ name: 'API', version: '1.0.0', endpoints: [{ method: 'GET', path: '/x' }, { method: 'GET', path: '/x' }] })
    expect(r.valid).toBe(false)
  })
})

describe('V22: ContractTest', () => {
  it('verify type rule', () => {
    const c = new ContractTest()
    c.define('user', [{ field: 'name', rule: 'type', value: 'string' }, { field: 'age', rule: 'min', value: 0 }])
    expect(c.verify('user', { name: 'Alice', age: 30 }).valid).toBe(true)
    expect(c.verify('user', { name: 123, age: -1 }).valid).toBe(false)
  })
})

describe('V23: APIVersioning', () => {
  it('add + deprecate + resolve', () => {
    const v = new APIVersioning()
    v.add('1.0.0')
    v.add('2.0.0')
    v.deprecate('1.0.0')
    expect(v.isDeprecated('1.0.0')).toBe(true)
    expect(v.resolve('1.0.0')).toBe('2.0.0')
  })
})

describe('V24: CompatChecker', () => {
  it('check compatible', () => {
    const c = new CompatChecker()
    c.addRule({ from: '1.0', to: '2.0', breakingChanges: ['removed X'] })
    const r = c.check('1.0', '2.0')
    expect(r.compatible).toBe(false)
  })

  it('check unknown compatible', () => {
    const c = new CompatChecker()
    expect(c.check('1.0', '2.0').compatible).toBe(true)
  })
})

describe('V25: DeprecationTracker', () => {
  it('mark + warning', () => {
    const t = new DeprecationTracker()
    t.mark('old-fn', 'function', 'use new instead', 'new-fn')
    expect(t.isDeprecated('old-fn')).toBe(true)
    const w = t.warning('old-fn')
    expect(w).toContain('new-fn')
  })
})