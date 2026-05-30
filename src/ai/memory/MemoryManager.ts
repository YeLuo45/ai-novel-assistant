/**
 * 五层记忆系统类型定义
 * L0: 瞬时记忆（GPT-style，轮次间清空）
 * L1: 工作记忆（当前会话）
 * L2: 会话记忆（历史会话摘要）
 * L3: 项目记忆（当前项目素材/大纲）
 * L4: 长期记忆（所有历史项目 + Skill Tree）
 */

// ============ Core Types ============

export interface MemoryContext {
  sessionId: string;
  projectId?: string;
  type: 'session' | 'conversation' | 'project' | 'longterm';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  lastAccessed?: number;
}

export interface Lesson {
  id: string;
  task: string;
  approach: string;
  outcome: 'success' | 'partial' | 'failed';
  context: Record<string, unknown>;
  createdAt: number;
}

export interface Skill {
  id: string;
  name: string;
  task: string;
  steps: string[];
  triggers: string[];
  useCount: number;
  successRate: number;
  createdAt: number;
  lastUsed: number;
}

export interface DreamSession {
  id?: number;
  sessionId: string;
  events: MemoryEvent[];
  compressed: boolean;
  summary?: string;
  skills?: Skill[];
  createdAt: number;
}

export interface MemoryEvent {
  event: string;
  data: unknown;
  timestamp: number;
}

// ============ MemoryManager ============

export class MemoryManager {
  async remember(context: MemoryContext): Promise<void> {
    const db = await this.getDb();
    const table = this.getTable(context.type);
    await table.add({
      ...context,
      lastAccessed: Date.now(),
    });
  }

  async crystallize(lesson: Lesson): Promise<Skill | null> {
    if (lesson.outcome === 'failed') return null;

    const db = await this.getDb();
    const skill: Skill = {
      id: `skill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: this.extractSkillName(lesson.task),
      task: lesson.task,
      steps: this.extractSteps(lesson.approach),
      triggers: this.extractTriggers(lesson.task),
      useCount: 1,
      successRate: lesson.outcome === 'success' ? 1.0 : 0.5,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    await db.skills.add(skill);
    return skill;
  }

  async recall(query: string, scope: 'local' | 'project' | 'global' = 'global'): Promise<MemoryContext[]> {
    const db = await this.getDb();
    const results: MemoryContext[] = [];
    const queryLower = query.toLowerCase();

    if (scope === 'local' || scope === 'global') {
      const sessionMemories = await db.session_memory.where('content').startssIgnoreCase(queryLower).toArray();
      results.push(...sessionMemories.map(m => ({ ...m, type: 'session' as const })));
    }

    if (scope === 'global') {
      const longTermMemories = await db.long_term_memory.where('content').startsIgnoreCase(queryLower).toArray();
      results.push(...longTermMemories.map(m => ({ ...m, type: 'longterm' as const })));
    }

    return results;
  }

  async findSkill(task: string): Promise<Skill | null> {
    const db = await this.getDb();
    const taskLower = task.toLowerCase();
    const skills = await db.skills.toArray();

    const matched = skills
      .filter(s => s.triggers.some(t => taskLower.includes(t.toLowerCase())))
      .sort((a, b) => {
        const aScore = a.useCount * a.successRate;
        const bScore = b.useCount * b.successRate;
        return bScore - aScore;
      });

    if (matched.length > 0) {
      const skill = matched[0];
      await db.skills.update(skill.id!, { useCount: skill.useCount + 1, lastUsed: Date.now() });
      return skill;
    }

    return null;
  }

  async compact(sessionId: string): Promise<string> {
    const db = await this.getDb();
    const memories = await db.session_memory.where('sessionId').equals(sessionId).toArray();

    if (memories.length === 0) return '';

    const summary = memories.slice(0, 5).map(m => m.content).join(' | ');
    const keywords = [...new Set(memories.flatMap(m => m.content.split(/\s+/)))].slice(0, 10);

    await db.conversation_summaries.add({
      sessionId,
      summary,
      keywords,
      createdAt: Date.now(),
    });

    await db.session_memory.where('sessionId').equals(sessionId).delete();

    return summary;
  }

  async evolve(): Promise<void> {
    const db = await this.getDb();
    const skills = await db.skills.toArray();

    for (const skill of skills) {
      const lessons = await db.long_term_memory
        .where('skillId')
        .equals(skill.id!)
        .toArray();

      if (lessons.length >= 5) {
        const totalSuccess = lessons.filter(l => (l as any).outcome === 'success').length;
        const newRate = totalSuccess / lessons.length;
        await db.skills.update(skill.id!, { successRate: newRate });
      }
    }
  }

  // Dream Consolidation 两阶段压缩
  async dreamConsolidate(sessionId: string): Promise<DreamSession> {
    const db = await this.getDb();
    const events = await db.dream_sessions.where('sessionId').equals(sessionId).first();

    if (!events || events.compressed) {
      return events || { sessionId, events: [], compressed: true, createdAt: Date.now() };
    }

    const summary = await this.compressToSummary(events.events);
    const skills = await this.extractSkillsFromEvents(events.events);

    await db.dream_sessions.update(events.id!, {
      compressed: true,
      summary,
      skills,
    });

    return { ...events, compressed: true, summary, skills };
  }

  private async compressToSummary(events: MemoryEvent[]): Promise<string> {
    const texts = events.filter(e => typeof e.data === 'string').map(e => e.data as string);
    if (texts.length === 0) return '';
    return texts.slice(0, 10).join(' ').slice(0, 500);
  }

  private async extractSkillsFromEvents(events: MemoryEvent[]): Promise<Skill[]> {
    const successEvents = events.filter(e => (e.data as any)?.outcome === 'success');
    return successEvents.slice(0, 3).map(e => ({
      id: `skill_${Date.now()}`,
      name: (e.data as any)?.task || 'Untitled',
      task: (e.data as any)?.task || '',
      steps: [(e.data as any)?.approach || ''],
      triggers: [(e.data as any)?.task || ''].filter(Boolean),
      useCount: 1,
      successRate: 1.0,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    }));
  }

  private getTable(type: MemoryContext['type']) {
    switch (type) {
      case 'session': return 'session_memory';
      case 'conversation': return 'conversation_summaries';
      case 'project': return 'session_memory'; // reuse for now
      case 'longterm': return 'long_term_memory';
      default: return 'session_memory';
    }
  }

  private async getDb() {
    const { Dexie } = await import('dexie');
    class NovelAssistantDB extends Dexie {
      session_memory!: any;
      conversation_summaries!: any;
      project_memory!: any;
      long_term_memory!: any;
      skills!: any;
      dream_sessions!: any;

      constructor() {
        super('NovelAssistantDB');
        this.version(38).stores({
          session_memory: '++id, sessionId, projectId, content, createdAt',
          conversation_summaries: '++id, sessionId, summary, keywords, createdAt',
          project_memory: '++id, projectId, content, type, createdAt',
          long_term_memory: '++id, type, content, tags, skillId, createdAt, lastAccessed',
          skills: '++id, name, task, useCount, successRate, lastUsed',
          dream_sessions: '++id, sessionId, summary, compressed, createdAt',
        });
      }
    }
    return new NovelAssistantDB();
  }

  private extractSkillName(task: string): string {
    const words = task.split(/\s+/).slice(0, 3);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }

  private extractSteps(approach: string): string[] {
    return approach.split(/[.;]/).filter(s => s.trim().length > 10);
  }

  private extractTriggers(task: string): string[] {
    const keywords = task.match(/\b\w{4,}\b/g) || [];
    return [...new Set(keywords)].slice(0, 5);
  }
}

export const memoryManager = new MemoryManager();