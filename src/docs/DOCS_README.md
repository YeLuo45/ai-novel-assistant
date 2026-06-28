# Documentation & DX (V3) — Direction V

**Version**: 1.0.0
**Engines**: V2956-V2985 (30 engines, 6 batches)
**Tests**: 41 tests, 100% pass

## 目标

完整文档与开发者体验：OpenAPI/GraphQL/TypeDoc/REST/AsyncAPI 文档生成、Markdown 渲染、代码高亮、Mermaid 图表、Storybook 组件目录、Template 引擎、Recipe 系统、API 版本化、Contract Test、DeprecationTracker。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| V1-V10 | `APIDoc.ts` | OpenAPIGenerator + GraphQLSchemaGenerator + TypeDocGenerator + RestDocGenerator + AsyncAPIGenerator + MarkdownRenderer + CodeHighlighter (6 languages) + DiagramGenerator (flowchart/sequence) + MermaidRenderer + MarkdownLinter |
| V11-V25 | `DocsAdvanced.ts` | StorybookConfig + ComponentCatalog + PropTable + StoryControls + DocExtractor (JSDoc + TODO/FIXME) + RecipeSystem + TemplateEngine (Mustache-like + each) + SnippetCollector + ExampleBuilder + Cookbook + SpecValidator + ContractTest + APIVersioning + CompatChecker + DeprecationTracker |

## 核心 API 示例

### 1. API 文档生成

```ts
import { OpenAPIGenerator, GraphQLSchemaGenerator, TypeDocGenerator, RestDocGenerator } from '@/docs'

const openapi = new OpenAPIGenerator()
openapi.setInfo({ title: 'My API', version: '2.0.0' })
openapi.addEndpoint({ path: '/users', method: 'GET', summary: 'List users' })
console.log(openapi.generate())

const gql = new GraphQLSchemaGenerator()
gql.addType('User', [{ name: 'id', type: 'ID!' }])
gql.addQuery('user', 'User', 'id: ID!')
console.log(gql.generate())

const td = new TypeDocGenerator()
td.addExport({ name: 'foo', kind: 'function', description: 'A function' })
console.log(td.toMarkdown())
```

### 2. Markdown 工具

```ts
import { MarkdownRenderer, CodeHighlighter, DiagramGenerator, MermaidRenderer, MarkdownLinter } from '@/docs'

const md = new MarkdownRenderer()
const html = md.render('# Hello\n\n**bold**')

const h = new CodeHighlighter()
h.highlight('const x = 1', 'typescript')

const d = new DiagramGenerator()
const flowchart = d.flowchart([{ id: 'A', label: 'Start' }], [{ from: 'A', to: 'A', label: 'loop' }])

const m = new MermaidRenderer()
m.validate('flowchart TD\n  A --> B')

const l = new MarkdownLinter()
l.lint('# Heading without blank line\nbody')
```

### 3. Storybook & Component Catalog

```ts
import { StorybookConfig, ComponentCatalog, PropTable, StoryControls } from '@/docs'

const sb = new StorybookConfig()
sb.addStory({ storyId: 'btn-1', title: 'Primary', component: 'Button' })

const catalog = new ComponentCatalog()
catalog.register({ name: 'Button', category: 'form', description: 'A button', tags: ['ui'] })

const pt = new PropTable()
console.log(pt.generate([{ name: 'color', type: 'string', required: true }]))

const sc = new StoryControls()
sc.add({ name: 'label', type: 'text', defaultValue: 'Click me' })
sc.generateArgs()
```

### 4. Recipe & Template

```ts
import { RecipeSystem, TemplateEngine, SnippetCollector, ExampleBuilder, Cookbook } from '@/docs'

const recipe = new RecipeSystem()
recipe.add({ recipeId: 'r1', title: 'Recipe', description: '', ingredients: [], steps: ['s1'], difficulty: 'easy' })

const tpl = new TemplateEngine()
tpl.render('Hello {{name}}', { name: 'World' })
tpl.renderEach('{{#each items}}[{{name}}]{{/each}}', 'items', [{ name: 'a' }], (i: any) => ({ name: i.name }))

const cookbook = new Cookbook()
cookbook.addRecipe({ recipeId: 'r1', title: 'Hello', description: '', ingredients: [], steps: ['step 1'], difficulty: 'easy' })
cookbook.addSection({ sectionId: 'intro', title: 'Intro', recipes: ['r1'] })
cookbook.toMarkdown()
```

### 5. API Versioning & Contracts

```ts
import { SpecValidator, ContractTest, APIVersioning, CompatChecker, DeprecationTracker } from '@/docs'

const spec = new SpecValidator()
spec.validate({ name: 'API', version: '1.0.0', endpoints: [{ method: 'GET', path: '/users' }] })

const contract = new ContractTest()
contract.define('user', [{ field: 'name', rule: 'type', value: 'string' }])
contract.verify('user', { name: 'Alice' })

const ver = new APIVersioning()
ver.add('1.0.0')
ver.deprecate('1.0.0')
ver.resolve('1.0.0')  // '2.0.0' if added

const compat = new CompatChecker()
compat.addRule({ from: '1.0', to: '2.0', breakingChanges: ['removed X'] })

const deprec = new DeprecationTracker()
deprec.mark('old-fn', 'function', 'use new instead', 'new-fn')
deprec.warning('old-fn')  // "[DEPRECATED] function 'old-fn'..."
```

## 验证命令

```bash
npx vitest run src/docs/  # 41 passed
```

## 灵感

- OpenAPI 3.0 / Swagger
- GraphQL SDL
- TypeDoc / JSDoc
- Markdown / MDX
- Storybook
- Mustache templates
- Keep a Changelog

## 累计

- Direction A-V: **835 engines / ~7,789 tests**
- 23 commits pushed
- 灵感: OpenAPI + GraphQL + TypeDoc + Storybook + Mustache + Keep a Changelog