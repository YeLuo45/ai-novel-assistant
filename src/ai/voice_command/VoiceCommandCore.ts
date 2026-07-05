/**
 * VoiceCommandCore.ts — Direction BX, V4496-V4505 (Batch 1/3)
 * Voice Command Engine: 语音命令核心
 */

export class VoiceCommandRecognizer { recognize(command: string): string { return `[CMD] ${command.toLowerCase()}`; } isRecognized(s: string): boolean { return s.startsWith('[CMD]'); } }
export class CommandDispatcher { dispatch(command: string): string { return `[DISPATCHED] ${command}`; } isDispatched(s: string): boolean { return s.startsWith('[DISPATCHED]'); } }
export class IntentClassifier { classify(command: string): 'open' | 'save' | 'publish' | 'edit' | 'other' { if (/打开|open/.test(command)) return 'open'; if (/保存|save/.test(command)) return 'save'; if (/发布|publish/.test(command)) return 'publish'; if (/编辑|edit/.test(command)) return 'edit'; return 'other'; } isKnown(i: string): boolean { return i !== 'other'; } }
export class EntityExtractor { extract(command: string): { entities: string[] } { const matches = command.match(/[\u4e00-\u9fa5]{2,}/g) || []; return { entities: matches }; } hasEntities(e: { entities: string[] }): boolean { return e.entities.length > 0; } }
export class CommandRegistry { private _commands = new Map<string, () => void>(); register(name: string, action: () => void): void { this._commands.set(name, action); } has(name: string): boolean { return this._commands.has(name); } count(): number { return this._commands.size; } }
export class VoiceActionMapper { map(intent: string): string { return `[ACTION] ${intent}`; } isMapped(s: string): boolean { return s.startsWith('[ACTION]'); } }
export class ConfirmationGenerator { generate(action: string): string { return `好的，正在${action}`; } isConfirmation(s: string): boolean { return s.includes('好的'); } }
export class CommandSuggestion { suggest(partial: string): string { return `${partial}_suggestion`; } isValid(s: string): boolean { return s.length > 0; } }
export class CommandHistory { private _history: string[] = []; add(command: string): void { this._history.push(command); } recent(n: number = 5): string[] { return this._history.slice(-n); } count(): number { return this._history.length; } }
export class WakeWordDetector { detect(audio: string): boolean { return /嗨小墨|hey xiaomo|小墨/i.test(audio); } isWake(audio: string): boolean { return this.detect(audio); } }
export class VoiceCommandCoreIndex { list(): string[] { return ['VoiceCommandRecognizer', 'CommandDispatcher', 'IntentClassifier', 'EntityExtractor', 'CommandRegistry', 'VoiceActionMapper', 'ConfirmationGenerator', 'CommandSuggestion', 'CommandHistory', 'WakeWordDetector']; } count(): number { return this.list().length; } }
export const BX_BATCH_1_ENGINES = { VoiceCommandRecognizer, CommandDispatcher, IntentClassifier, EntityExtractor, CommandRegistry, VoiceActionMapper, ConfirmationGenerator, CommandSuggestion, CommandHistory, WakeWordDetector, VoiceCommandCoreIndex } as const;