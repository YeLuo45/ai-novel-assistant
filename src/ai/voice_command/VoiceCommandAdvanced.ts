/**
 * VoiceCommandAdvanced.ts — Direction BX, V4506-V4515 (Batch 2/3)
 * Voice Command Engine: 高级工具
 */

export class CustomCommandCreator { create(name: string, action: string): { name: string; action: string } { return { name, action }; } isValid(c: { name: string; action: string }): boolean { return c.name.length > 0 && c.action.length > 0; } }
export class CommandChaining { chain(commands: string[]): string { return commands.join(' -> '); } isChained(s: string): boolean { return s.includes('->'); } }
export class VoiceShortcut { shortcuts = new Map<string, string>(); add(name: string, command: string): void { this.shortcuts.set(name, command); } get(name: string): string | undefined { return this.shortcuts.get(name); } has(name: string): boolean { return this.shortcuts.has(name); } }
export class CommandConflictResolver { resolve(a: string, b: string): string { return a.length > b.length ? a : b; } isResolved(r: string): boolean { return r.length > 0; } }
export class FuzzyCommandMatcher { match(input: string, commands: string[]): string | null { for (const c of commands) if (c.includes(input) || input.includes(c)) return c; return null; } hasMatch(m: string | null): boolean { return m !== null; } }
export class MultiLanguageCommands { languages: string[] = ['zh', 'en']; isValid(l: string): boolean { return this.languages.includes(l); } }
export class VoiceMacro { private _steps: string[] = []; add(step: string): void { this._steps.push(step); } execute(): string { return this._steps.join('; '); } count(): number { return this._steps.length; } }
export class VoiceGuard { sensitive: string[] = ['delete', 'drop', 'overwrite']; isSensitive(command: string): boolean { return this.sensitive.some((s) => command.toLowerCase().includes(s)); } }
export class CommandSuggestionEngine { suggest(partial: string): string[] { return [`${partial}_1`, `${partial}_2`]; } hasSuggestions(s: string[]): boolean { return s.length > 0; } }
export class VoiceFeedbackPlayer { feedback: string = ''; play(text: string): void { this.feedback = text; } isPlayed(): boolean { return this.feedback.length > 0; } }
export class VoiceCommandAdvancedIndex { list(): string[] { return ['CustomCommandCreator', 'CommandChaining', 'VoiceShortcut', 'CommandConflictResolver', 'FuzzyCommandMatcher', 'MultiLanguageCommands', 'VoiceMacro', 'VoiceGuard', 'CommandSuggestionEngine', 'VoiceFeedbackPlayer']; } count(): number { return this.list().length; } }
export const BX_BATCH_2_ENGINES = { CustomCommandCreator, CommandChaining, VoiceShortcut, CommandConflictResolver, FuzzyCommandMatcher, MultiLanguageCommands, VoiceMacro, VoiceGuard, CommandSuggestionEngine, VoiceFeedbackPlayer, VoiceCommandAdvancedIndex } as const;