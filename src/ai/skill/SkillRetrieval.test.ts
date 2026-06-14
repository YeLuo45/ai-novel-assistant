import { describe, it, expect } from 'vitest';
import { createSkillRetrievalState, indexSkillVector, indexSkillKeyword, indexSkillTag, retrieveSkill, skillRetrievalHealth } from './SkillRetrieval';

describe('V2298 SkillRetrieval', () => {
  it('should create empty state', () => {
    const s = createSkillRetrievalState();
    expect(s.vectorIndex.size).toBe(0);
  });

  it('should index vector', () => {
    let s = createSkillRetrievalState();
    s = indexSkillVector(s, 'k1', [1, 0, 0]);
    expect(s.vectorIndex.size).toBe(1);
  });

  it('should index keyword', () => {
    let s = createSkillRetrievalState();
    s = indexSkillKeyword(s, 'k1', 'hello world');
    expect(s.keywordIndex.get('hello')?.has('k1')).toBe(true);
  });

  it('should index tag', () => {
    let s = createSkillRetrievalState();
    s = indexSkillTag(s, 'k1', 'important');
    expect(s.tagIndex.get('important')?.has('k1')).toBe(true);
  });

  it('should retrieve by vector', () => {
    let s = createSkillRetrievalState();
    s = indexSkillVector(s, 'k1', [1, 0, 0]);
    s = indexSkillVector(s, 'k2', [0, 1, 0]);
    const hits = retrieveSkill(s, { vector: [1, 0, 0] });
    expect(hits.length).toBeGreaterThan(0);
  });

  it('should retrieve by tag', () => {
    let s = createSkillRetrievalState();
    s = indexSkillTag(s, 'k1', 'urgent');
    const hits = retrieveSkill(s, { tags: ['urgent'] });
    expect(hits).toHaveLength(1);
  });

  it('should combine signals', () => {
    let s = createSkillRetrievalState();
    s = indexSkillVector(s, 'k1', [1, 0, 0]);
    s = indexSkillTag(s, 'k1', 'core');
    const hits = retrieveSkill(s, { vector: [1, 0, 0], tags: ['core'] });
    expect(hits[0].matchedOn.length).toBe(2);
  });

  it('should compute health', () => {
    let s = createSkillRetrievalState();
    s = indexSkillVector(s, 'k1', [1, 0, 0]);
    const h = skillRetrievalHealth(s);
    expect(h.health).toBe(1);
  });
});
