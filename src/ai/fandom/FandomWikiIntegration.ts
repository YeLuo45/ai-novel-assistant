/**
 * FandomWikiIntegration.ts — Direction BK, V4206-V4215 (Batch 3/3 收口)
 * Fandom Wiki Generator: 集成 + 收口
 */

import type { WikiEntry } from './FandomWikiCore';
import { WikiLibrary } from './FandomWikiCore';

export class WikiGenerator { generate(library: WikiLibrary, entry: WikiEntry): string { library.add(entry); return `# ${entry.name}\n\n${entry.description}`; } isGenerated(s: string): boolean { return s.startsWith('#'); } }
export class WikiTemplate { template: string = ''; apply(content: string): string { return this.template.replace('{content}', content); } isApplied(s: string): boolean { return s.length > 0; } }
export class WikiConsistencyChecker { check(library: WikiLibrary): { issues: string[]; consistent: boolean } { const issues: string[] = []; if (library.count() === 0) issues.push('empty'); return { issues, consistent: issues.length === 0 }; } isConsistent(r: { consistent: boolean }): boolean { return r.consistent; } }
export class WikiSearchEngine2 { searchByTag(library: WikiLibrary, tag: string): WikiEntry[] { return Array.from(library['_entries'].values() as IterableIterator<WikiEntry>).filter((e) => e.description.includes(tag)); } hasResults(r: WikiEntry[]): boolean { return r.length > 0; } }
export class WikiADirector { decide(state: { hasEntries: boolean; categorized: boolean }): string { if (!state.hasEntries) return 'add'; if (!state.categorized) return 'categorize'; return 'finalize'; } }
export class WikiReport { generate(stats: { entries: number; categories: number }): string { return `${stats.entries} 项, ${stats.categories} 分类`; } hasReport(s: string): boolean { return s.includes('项'); } }
export class WikiLibrary2 { private _library = new WikiLibrary(); add(entry: WikiEntry): void { this._library.add(entry); } search(query: string): WikiEntry[] { return Array.from(this._library['_entries'].values() as IterableIterator<WikiEntry>).filter((e) => e.name.includes(query) || e.description.includes(query)); } count(): number { return this._library.count(); } }
export class WikiTools { tools: string[] = ['MediaWiki', 'DokuWiki', 'Notion']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class WikiValidator { validate(entry: WikiEntry): { valid: boolean; issues: string[] } { const issues: string[] = []; if (entry.name.length < 3) issues.push('name too short'); if (entry.description.length < 10) issues.push('desc too short'); return { valid: issues.length === 0, issues }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class FandomWikiMasterIndex { list(): string[] { return ['WikiEntry', 'WikiLibrary', 'WikiLinker', 'WikiCategory', 'WikiHistory', 'WikiReference', 'WikiImageReference', 'WikiQuoteSelector', 'WikiTagAdder', 'WikiOutlineBuilder', 'WikiSectionDivider', 'WikiFormat', 'WikiSearchEngine', 'WikiTranslationGenerator', 'WikiVersioning', 'WikiCollaboration', 'WikiImport', 'WikiExport', 'WikiGenerator', 'WikiTemplate', 'WikiConsistencyChecker', 'WikiSearchEngine2', 'WikiADirector', 'WikiReport', 'WikiLibrary2', 'WikiTools', 'WikiValidator', 'FandomWikiMasterIndex']; } count(): number { return this.list().length; } }
export const BK_BATCH_3_ENGINES = { WikiGenerator, WikiTemplate, WikiConsistencyChecker, WikiSearchEngine2, WikiADirector, WikiReport, WikiLibrary2, WikiTools, WikiValidator, FandomWikiMasterIndex } as const;