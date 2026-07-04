/**
 * BackmatterCore.ts — Direction AT, V3676-V3685 (Batch 1/3)
 * Backmatter Generator: 后记/番外核心
 */

export class SideStoryGenerator { generate(character: string, event: string): string { return `${character}的故事 - ${event}`; } isValid(side: string): boolean { return side.length > 5; } }
export class BackstoryGenerator { generate(character: string, age: number): string { return `${character}在${age}岁的过去`; } isValidBackstory(bs: string): boolean { return bs.length > 5; } }
export class EpilogueGenerator { generate(story: string): string { return `多年以后，${story}。`; } isHappy(story: string): boolean { return !/悲剧|死亡/.test(story); } }
export class PrologueGenerator { generate(before: string): string { return `一切开始之前，${before}。`; } isHook(p: string): boolean { return p.length > 5; } }
export class CharacterBioGenerator { generate(name: string, traits: string[]): string { return `${name}：${traits.join('、')}`; } isComplete(bio: string): boolean { return bio.length > 5 && bio.includes('：'); } }
export class WorldRuleGuide { generate(rules: string[]): string { return rules.map((r, i) => `${i + 1}. ${r}`).join('\n'); } isComprehensive(guide: string): boolean { return guide.length > 20; } }
export class GlossaryGenerator { generate(terms: Record<string, string>): string { return Object.entries(terms).map(([k, v]) => `${k}: ${v}`).join('\n'); } hasGlossary(g: string): boolean { return g.includes(': '); } }
export class TimelineAppendix { generate(events: { date: string; event: string }[]): string { return events.map((e) => `${e.date}: ${e.event}`).join('\n'); } isComplete(timeline: string): boolean { return timeline.length > 0; } }
export class AuthorNoteGenerator { generate(topic: string): string { return `作者按：关于${topic}的一些说明`; } isHelpful(note: string): boolean { return note.length > 5; } }
export class BackmatterCoreIndex { list(): string[] { return ['SideStoryGenerator', 'BackstoryGenerator', 'EpilogueGenerator', 'PrologueGenerator', 'CharacterBioGenerator', 'WorldRuleGuide', 'GlossaryGenerator', 'TimelineAppendix', 'AuthorNoteGenerator']; } count(): number { return this.list().length; } }
export const AT_BATCH_1_ENGINES = { SideStoryGenerator, BackstoryGenerator, EpilogueGenerator, PrologueGenerator, CharacterBioGenerator, WorldRuleGuide, GlossaryGenerator, TimelineAppendix, AuthorNoteGenerator, BackmatterCoreIndex } as const;