/**
 * CharacterEconomy.test.ts — Direction AA, V3126-V3135 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
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
} from './CharacterEconomy';

describe('CharacterOutfitMemory', () => {
  const e = new CharacterOutfitMemory();

  it('add + getFor', () => {
    e.add('Alice', 'red dress', 1);
    e.add('Alice', 'blue coat', 5);
    expect(e.getFor('Alice')).toHaveLength(2);
  });

  it('getItemsAt filters by chapter', () => {
    e.add('Bob', 'hat', 10);
    const items = e.getItemsAt('Bob', 5);
    expect(items).toHaveLength(0);
  });
});

describe('CharacterAgeBirthday', () => {
  const e = new CharacterAgeBirthday();

  it('add + currentAge', () => {
    e.add('Alice', 20, 'Jan 1', 1);
    expect(e.currentAge('Alice', 1)).toBe(20);
  });

  it('currentAge accounts for elapsed chapters', () => {
    e.add('Bob', 30, 'Feb 1', 1);
    expect(e.currentAge('Bob', 13)).toBe(31);
  });

  it('isConsistent for non-decreasing ages', () => {
    e.add('Carol', 25, 'Mar 1', 1);
    e.add('Carol', 26, 'Apr 1', 5);
    expect(e.isConsistent('Carol')).toBe(true);
  });

  it('isConsistent false for decreasing', () => {
    e.add('Dave', 30, 'May 1', 1);
    e.add('Dave', 25, 'Jun 1', 5);
    expect(e.isConsistent('Dave')).toBe(false);
  });
});

describe('FamilyRelationshipGraph', () => {
  const e = new FamilyRelationshipGraph();

  it('add + getRelationsFor', () => {
    e.add('Alice', 'Bob', 'parent');
    expect(e.getRelationsFor('Alice')).toHaveLength(1);
  });

  it('getParents', () => {
    e.add('Alice', 'Charlie', 'parent');
    expect(e.getParents('Charlie')).toContain('Alice');
  });

  it('getChildren', () => {
    e.add('Alice', 'Dan', 'child');
    expect(e.getChildren('Alice')).toContain('Dan');
  });

  it('hasInconsistency false for normal', () => {
    e.add('Eve', 'Frank', 'sibling');
    expect(e.hasInconsistency('Eve')).toBe(false);
  });
});

describe('OccupationSkill', () => {
  const e = new OccupationSkill();

  it('add + getFor', () => {
    e.add('Alice', 'swordsmanship', 'master', 1);
    expect(e.getFor('Alice')).toHaveLength(1);
  });

  it('hasMastery true for master', () => {
    e.add('Alice', 'magic', 'master', 1);
    expect(e.hasMastery('Alice', 'magic')).toBe(true);
  });

  it('hasMastery false for novice', () => {
    e.add('Bob', 'magic', 'novice', 1);
    expect(e.hasMastery('Bob', 'magic')).toBe(false);
  });
});

describe('MentionedButUndefined', () => {
  const e = new MentionedButUndefined();

  it('mention + getUndefined', () => {
    e.mention('artifact');
    e.mention('artifact');
    expect(e.getUndefined(2)).toContain('artifact');
  });

  it('getUndefined empty for single mention', () => {
    e.mention('unique');
    expect(e.getUndefined(2)).not.toContain('unique');
  });
});

describe('SettingBibleGenerator', () => {
  const e = new SettingBibleGenerator();

  it('generate returns string with sections', () => {
    const md = e.generate('TestWorld', { Magic: 'has rules', History: 'ancient' });
    expect(md).toContain('TestWorld');
    expect(md).toContain('Magic');
    expect(md).toContain('ancient');
  });

  it('toMarkdown with items', () => {
    const md = e.toMarkdown('World', [{ title: 'A', content: 'a' }]);
    expect(md).toContain('## A');
  });
});

describe('FandomWikiExporter', () => {
  const e = new FandomWikiExporter();

  it('exportPage includes title and body', () => {
    const w = e.exportPage('Alice', 'A character', ['Characters']);
    expect(w).toContain('Alice');
    expect(w).toContain('A character');
  });

  it('exportCharacterPage includes template', () => {
    const w = e.exportCharacterPage('Bob', { age: 25, occupation: 'wizard' });
    expect(w).toContain('age = 25');
  });
});

describe('EntityRelationshipGraph', () => {
  const e = new EntityRelationshipGraph();

  it('addEntity + addRelation', () => {
    e.addEntity('Alice', 'character');
    e.addEntity('Bob', 'character');
    expect(e.addRelation('Alice', 'Bob', 'sibling')).toBe(true);
  });

  it('relatedTo finds connected', () => {
    e.addEntity('Carol', 'character');
    e.addEntity('Dan', 'character');
    e.addRelation('Carol', 'Dan', 'spouse');
    const rel = e.relatedTo('Carol');
    expect(rel.some((x) => x.name === 'Dan')).toBe(true);
  });

  it('getEntities returns all', () => {
    e.addEntity('E', 'place');
    expect(e.getEntities().length).toBeGreaterThanOrEqual(1);
  });
});

describe('SettingInspirationGenerator', () => {
  const e = new SettingInspirationGenerator();

  it('generate returns string', () => {
    const s = e.generate();
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
  });

  it('generateBatch returns N', () => {
    const batch = e.generateBatch(3);
    expect(batch).toHaveLength(3);
  });
});

describe('WorldbuildIndex', () => {
  const idx = new WorldbuildIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });
});
