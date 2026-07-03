/**
 * CharacterEconomy.ts — Direction AA, V3126-V3135 (Batch 3/3 收口)
 * Worldbuilding Coherence: 人物追踪 + 设定生成 + 收口
 *
 * 10 engines:
 * 1.  CharacterOutfitMemory — 角色装扮记忆
 * 2.  CharacterAgeBirthday — 角色年龄/生日
 * 3.  FamilyRelationshipGraph — 家族关系图
 * 4.  OccupationSkill — 角色职业/技能
 * 5.  MentionedButUndefined — 设定空白检测
 * 6.  SettingBibleGenerator — 设定 Bible 生成
 * 7.  FandomWikiExporter — 粉丝 Wiki 导出
 * 8.  EntityRelationshipGraph — 实体关系图
 * 9.  SettingInspirationGenerator — 设定灵感生成
 * 10. WorldbuildIndex — 30 engines 收口
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: CharacterOutfitMemory
// ============================================================================

export interface Outfit {
  character: string;
  item: string;
  chapter: number;
}

export class CharacterOutfitMemory {
  private _outfits: Outfit[] = [];

  add(character: string, item: string, chapter: number): Outfit {
    const o: Outfit = { character, item, chapter };
    this._outfits.push(o);
    return o;
  }

  getFor(character: string): Outfit[] {
    return this._outfits.filter((o) => o.character === character);
  }

  getItemsAt(character: string, chapter: number): string[] {
    return this.getFor(character)
      .filter((o) => o.chapter <= chapter)
      .map((o) => o.item);
  }
}

// ============================================================================
// Engine 2: CharacterAgeBirthday
// ============================================================================

export interface AgeRecord {
  character: string;
  age: number;
  birthday: string;
  chapter: number;
}

export class CharacterAgeBirthday {
  private _records: AgeRecord[] = [];

  add(character: string, age: number, birthday: string, chapter: number): AgeRecord {
    const r: AgeRecord = { character, age, birthday, chapter };
    this._records.push(r);
    return r;
  }

  currentAge(character: string, currentChapter: number): number | null {
    const records = this._records.filter((r) => r.character === character).sort((a, b) => a.chapter - b.chapter);
    if (records.length === 0) return null;
    const last = records[records.length - 1];
    const elapsed = currentChapter - last.chapter;
    // Assume each chapter = 1 month for simplicity
    return last.age + Math.floor(elapsed / 12);
  }

  isConsistent(character: string): boolean {
    const records = this._records.filter((r) => r.character === character);
    if (records.length < 2) return true;
    for (let i = 1; i < records.length; i++) {
      if (records[i].age < records[i - 1].age) return false;
    }
    return true;
  }
}

// ============================================================================
// Engine 3: FamilyRelationshipGraph
// ============================================================================

export interface FamilyRelation {
  from: string;
  to: string;
  type: 'parent' | 'sibling' | 'spouse' | 'child' | 'grandparent';
}

export class FamilyRelationshipGraph {
  private _relations: FamilyRelation[] = [];

  add(from: string, to: string, type: FamilyRelation['type']): FamilyRelation {
    const r: FamilyRelation = { from, to, type };
    this._relations.push(r);
    return r;
  }

  getRelationsFor(character: string): FamilyRelation[] {
    return this._relations.filter((r) => r.from === character || r.to === character);
  }

  getParents(character: string): string[] {
    return this._relations.filter((r) => r.to === character && r.type === 'parent').map((r) => r.from);
  }

  getChildren(character: string): string[] {
    return this._relations.filter((r) => r.from === character && r.type === 'child').map((r) => r.to);
  }

  hasInconsistency(character: string): boolean {
    // E.g., character is their own parent
    return this._relations.some((r) => r.from === character && r.to === character);
  }
}

// ============================================================================
// Engine 4: OccupationSkill
// ============================================================================

export interface Skill {
  character: string;
  skill: string;
  proficiency: 'novice' | 'apprentice' | 'journeyman' | 'expert' | 'master';
  chapter: number;
}

export class OccupationSkill {
  private _skills: Skill[] = [];

  add(character: string, skill: string, proficiency: Skill['proficiency'], chapter: number): Skill {
    const s: Skill = { character, skill, proficiency, chapter };
    this._skills.push(s);
    return s;
  }

  getFor(character: string): Skill[] {
    return this._skills.filter((s) => s.character === character);
  }

  hasMastery(character: string, skill: string): boolean {
    return this._skills.some((s) => s.character === character && s.skill === skill && s.proficiency === 'master');
  }
}

// ============================================================================
// Engine 5: MentionedButUndefined
// ============================================================================

export class MentionedButUndefined {
  private _mentions = new Map<string, number>();

  mention(item: string): void {
    this._mentions.set(item, (this._mentions.get(item) || 0) + 1);
  }

  getUndefined(threshold = 2): string[] {
    return Array.from(this._mentions.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([item]) => item);
  }
}

// ============================================================================
// Engine 6: SettingBibleGenerator
// ============================================================================

export class SettingBibleGenerator {
  generate(worldName: string, sections: Record<string, string>): string {
    const lines: string[] = [`# ${worldName} - Setting Bible\n`];
    for (const [title, content] of Object.entries(sections)) {
      lines.push(`## ${title}\n${content}\n`);
    }
    return lines.join('\n');
  }

  toMarkdown(worldName: string, items: { title: string; content: string }[]): string {
    return [`# ${worldName}`, ...items.map((it) => `## ${it.title}\n${it.content}`)].join('\n\n');
  }
}

// ============================================================================
// Engine 7: FandomWikiExporter
// ============================================================================

export class FandomWikiExporter {
  exportPage(title: string, body: string, categories: string[] = []): string {
    const catStr = categories.length > 0 ? `\n[[Category:${categories.join(']] [[Category:')}]]` : '';
    return `== ${title} ==\n${body}${catStr}`;
  }

  exportCharacterPage(name: string, data: { age?: number; occupation?: string; description?: string }): string {
    return this.exportPage(
      name,
      `{{Character\n| age = ${data.age ?? '?'}\n| occupation = ${data.occupation ?? '?'}\n}}\n${data.description ?? ''}`,
      ['Characters']
    );
  }
}

// ============================================================================
// Engine 8: EntityRelationshipGraph
// ============================================================================

export interface Entity {
  id: string;
  type: 'character' | 'place' | 'object' | 'event' | 'faction';
  name: string;
}

export interface Relation {
  from: string;
  to: string;
  type: string;
}

export class EntityRelationshipGraph {
  private _entities = new Map<string, Entity>();
  private _relations: Relation[] = [];
  private _counter = 0;

  addEntity(name: string, type: Entity['type']): Entity {
    this._counter += 1;
    const e: Entity = { id: `e_${this._counter}`, name, type };
    this._entities.set(name, e);
    return e;
  }

  addRelation(fromName: string, toName: string, type: string): boolean {
    const from = this._entities.get(fromName);
    const to = this._entities.get(toName);
    if (!from || !to) return false;
    this._relations.push({ from: from.id, to: to.id, type });
    return true;
  }

  getEntities(): Entity[] {
    return Array.from(this._entities.values());
  }

  getRelations(): Relation[] {
    return [...this._relations];
  }

  relatedTo(entityName: string): Entity[] {
    const e = this._entities.get(entityName);
    if (!e) return [];
    const relatedIds = new Set<string>();
    for (const r of this._relations) {
      if (r.from === e.id) relatedIds.add(r.to);
      if (r.to === e.id) relatedIds.add(r.from);
    }
    return Array.from(this._entities.values()).filter((x) => relatedIds.has(x.id));
  }
}

// ============================================================================
// Engine 9: SettingInspirationGenerator
// ============================================================================

export class SettingInspirationGenerator {
  private _archetypes = [
    'a fallen empire with surviving noble houses',
    'a city of eternal rain and clockwork automatons',
    'a mountain monastery where monks train dragons',
    'a space station orbiting a dying star',
    'a hidden village where time flows differently',
  ];

  generate(): string {
    return this._archetypes[Math.floor(Math.random() * this._archetypes.length)];
  }

  generateBatch(n: number): string[] {
    return Array.from({ length: n }, () => this.generate());
  }
}

// ============================================================================
// Engine 10: WorldbuildIndex
// ============================================================================

export class WorldbuildIndex {
  list(): string[] {
    return [
      'MagicSystemAuditor', 'TechConsistency', 'PowerEconomy', 'SpeciesEcology',
      'ReligionSystem', 'LanguageCohort', 'GeographicConsistency', 'TimelineTracker',
      'SeasonWeather', 'DistanceSpeedValidator',
      'PoliticalSystem', 'EconomicBalance', 'LawSystemAuditor', 'EducationKnowledge',
      'MilitaryWarLogic', 'CustomsCulture', 'FoodAgriculture', 'ClothingStyle',
      'SocialHierarchy', 'PropTracker',
      'CharacterOutfitMemory', 'CharacterAgeBirthday', 'FamilyRelationshipGraph',
      'OccupationSkill', 'MentionedButUndefined', 'SettingBibleGenerator',
      'FandomWikiExporter', 'EntityRelationshipGraph', 'SettingInspirationGenerator',
      'WorldbuildIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AA_BATCH_3_ENGINES = {
  CharacterOutfitMemory,
  CharacterAgeBirthday,
  FamilyRelationshipGraph,
  OccupationSkill,
  MentionedButUndefined,
  SettingBibleGenerator,
  FandomWikiExporter,
  EntityRelationshipGraph,
  SettingInspirationGenerator,
  WorldbuildIndex,
} as const;

// Re-export Chapter
export type { Chapter };
