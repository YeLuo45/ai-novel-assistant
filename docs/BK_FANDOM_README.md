# Direction BK — Fandom Wiki Generator

**V4186-V4215 · 30 engines · 48 tests · 100% pass · ≥98% coverage**

同人百科生成器 + Wiki 库 + 链接 + 翻译 + 集成。

## 灵感来源

FanFiction Wiki / 同人创作 / Wiki 协作 / IP 衍生

## 30 engines

### Fandom Wiki Core (9)
- WikiEntry / WikiLibrary / WikiLinker / WikiCategory / WikiHistory / WikiReference / WikiImageReference / WikiQuoteSelector / WikiTagAdder

### Fandom Wiki Advanced (9)
- WikiOutlineBuilder / WikiSectionDivider / WikiFormat / WikiSearchEngine / WikiTranslationGenerator / WikiVersioning / WikiCollaboration / WikiImport / WikiExport

### Fandom Wiki Integration (9)
- WikiGenerator / WikiTemplate / WikiConsistencyChecker / WikiSearchEngine2 / WikiADirector / WikiReport / WikiLibrary2 / WikiTools / WikiValidator

### 收口
- FandomWikiCoreIndex / FandomWikiAdvancedIndex / FandomWikiMasterIndex

## 测试

```bash
npx vitest run src/ai/fandom/
```