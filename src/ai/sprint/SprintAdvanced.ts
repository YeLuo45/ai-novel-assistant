/**
 * SprintAdvanced.ts — Direction BD, V3986-V3995 (Batch 2/3)
 * Writing Sprint Timer: 高级工具
 */

export class SprintLeaderboard { private _scores: { name: string; words: number }[] = []; addScore(name: string, words: number): void { this._scores.push({ name, words }); } top(n: number = 3): { name: string; words: number }[] { return [...this._scores].sort((a, b) => b.words - a.words).slice(0, n); } }
export class SprintGroupSession { participants: { name: string; words: number }[] = []; addParticipant(name: string): void { this.participants.push({ name, words: 0 }); } updateWords(name: string, words: number): void { const p = this.participants.find((x) => x.name === name); if (p) p.words = words; } totalWords(): number { return this.participants.reduce((s, p) => s + p.words, 0); } }
export class SprintReward { points = 0; add(amount: number): void { this.points += amount; } hasEnough(cost: number): boolean { return this.points >= cost; } }
export class SprintStreak { private _streak = 0; increment(): void { this._streak += 1; } reset(): void { this._streak = 0; } get(): number { return this._streak; } }
export class SprintNotification { send(message: string): void {} hasNotified(m: string): boolean { return m.length > 0; } }
export class SprintRecoveryTime { breakTime: number = 5; recoveryRatio(sprintDurationMinutes: number): number { return this.breakTime / sprintDurationMinutes; } isEnough(sprintDuration: number): boolean { return this.breakTime >= sprintDuration * 0.1; } }
export class SprintEnergyEstimate { estimate(hour: number, energy: number): number { return energy * (hour >= 9 && hour <= 11 ? 1.2 : 1); } isHighEnergy(hour: number): boolean { return hour >= 9 && hour <= 11; } }
export class SprintProductivityCalculator { calculate(words: number, minutes: number, distractions: number): number { const baseWpm = words / Math.max(1, minutes); return baseWpm * Math.max(0.1, 1 - distractions * 0.1); } isProductive(wpm: number, threshold = 30): boolean { return wpm >= threshold; } }
export class SprintHabit { frequency: 'daily' | 'weekly' = 'daily'; isDaily(): boolean { return this.frequency === 'daily'; } isWeekly(): boolean { return this.frequency === 'weekly'; } }
export class SprintAdvancedIndex { list(): string[] { return ['SprintLeaderboard', 'SprintGroupSession', 'SprintReward', 'SprintStreak', 'SprintNotification', 'SprintRecoveryTime', 'SprintEnergyEstimate', 'SprintProductivityCalculator', 'SprintHabit']; } count(): number { return this.list().length; } }
export const BD_BATCH_2_ENGINES = { SprintLeaderboard, SprintGroupSession, SprintReward, SprintStreak, SprintNotification, SprintRecoveryTime, SprintEnergyEstimate, SprintProductivityCalculator, SprintHabit, SprintAdvancedIndex } as const;