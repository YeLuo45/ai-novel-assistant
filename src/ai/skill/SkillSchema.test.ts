import { describe, it, expect } from 'vitest';
import { createSkillSchemaState, addSkillSchema, validateSkillEntry, skillSchemaHealth } from './SkillSchema';

describe('V2300 SkillSchema', () => {
  it('should create empty state', () => {
    const s = createSkillSchemaState();
    expect(s.schemas.size).toBe(0);
  });

  it('should add schema', () => {
    let s = createSkillSchemaState();
    s = addSkillSchema(s, { name: 'skill', fields: [{ name: 'name', kind: 'string', required: true }], version: 1 });
    expect(s.schemas.size).toBe(1);
  });

  it('should validate valid entry', () => {
    let s = createSkillSchemaState();
    s = addSkillSchema(s, { name: 'skill', fields: [{ name: 'name', kind: 'string', required: true }], version: 1 });
    expect(validateSkillEntry(s, 'skill', { name: 'X' }).valid).toBe(true);
  });

  it('should detect missing field', () => {
    let s = createSkillSchemaState();
    s = addSkillSchema(s, { name: 'skill', fields: [{ name: 'name', kind: 'string', required: true }], version: 1 });
    expect(validateSkillEntry(s, 'skill', {}).valid).toBe(false);
  });

  it('should reject unknown schema', () => {
    const s = createSkillSchemaState();
    expect(validateSkillEntry(s, 'unknown', {}).valid).toBe(false);
  });

  it('should detect markdown', () => {
    let s = createSkillSchemaState();
    s = addSkillSchema(s, { name: 'skill', fields: [{ name: 'content', kind: 'markdown', required: true }], version: 1 });
    expect(validateSkillEntry(s, 'skill', { content: '# Title' }).valid).toBe(true);
  });

  it('should compute health', () => {
    let s = createSkillSchemaState();
    s = addSkillSchema(s, { name: 'skill', fields: [], version: 1 });
    const h = skillSchemaHealth(s);
    expect(h.health).toBe(1);
  });
});
