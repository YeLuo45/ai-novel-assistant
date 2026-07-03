/**
 * PropCharacterTracking.test.ts — Direction AC, V3146-V3155 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  PropLifecycle,
  ChekhovGun,
  GiftExchange,
  LostItemAuditor,
  CharacterLocation,
  CharacterMoodContinuity,
  RelationshipStateMachine,
  CharacterVoice,
  CharacterHealth,
  CharacterWealth,
} from './PropCharacterTracking';

describe('PropLifecycle', () => {
  const e = new PropLifecycle();

  it('introduce + use', () => {
    e.introduce('sword', 1);
    e.use('sword', 5);
    expect(e.getActive()).toHaveLength(0);
  });

  it('destroy changes status', () => {
    e.introduce('ring', 1);
    e.destroy('ring', 10);
    expect(e.getActive()).toHaveLength(0);
  });

  it('getUnused finds not-yet-used', () => {
    e.introduce('amulet', 1);
    expect(e.getUnused().length).toBe(1);
  });
});

describe('ChekhovGun', () => {
  const e = new ChekhovGun();

  it('register + fire', () => {
    e.register('gun');
    e.fire('gun');
    expect(e.getUnfired()).toHaveLength(0);
  });

  it('getUnfired returns unfired', () => {
    e.register('rifle');
    expect(e.getUnfired()).toContain('rifle');
  });

  it('fulfillmentRate', () => {
    e.register('a');
    e.register('b');
    e.fire('a');
    expect(e.fulfillmentRate()).toBe(0.5);
  });
});

describe('GiftExchange', () => {
  const e = new GiftExchange();

  it('give + receivedBy', () => {
    e.give('Alice', 'Bob', 'ring', 1);
    expect(e.receivedBy('Bob')).toContain('ring');
  });

  it('givenBy', () => {
    e.give('Alice', 'Bob', 'book', 1);
    expect(e.givenBy('Alice')).toContain('book');
  });

  it('count', () => {
    e.give('A', 'B', 'x', 1);
    expect(e.count()).toBeGreaterThanOrEqual(1);
  });
});

describe('LostItemAuditor', () => {
  const e = new LostItemAuditor();

  it('introduce + getLost after threshold', () => {
    e.introduce('artifact', 1);
    expect(e.getLost(60, 50)).toContain('artifact');
  });

  it('reference resets last seen', () => {
    const e2 = new LostItemAuditor();
    e2.introduce('a', 1);
    e2.reference('a', 50);
    expect(e2.getLost(60, 50)).toHaveLength(0);
  });
});

describe('CharacterLocation', () => {
  const e = new CharacterLocation();

  it('moveTo + currentLocation', () => {
    e.moveTo('Alice', 'Paris', 1);
    expect(e.currentLocation('Alice')).toBe('Paris');
  });

  it('wasAt checks chapter', () => {
    e.moveTo('Alice', 'London', 5);
    expect(e.wasAt('Alice', 'London', 10)).toBe(true);
    expect(e.wasAt('Alice', 'London', 3)).toBe(false);
  });
});

describe('CharacterMoodContinuity', () => {
  const e = new CharacterMoodContinuity();

  it('setMood + currentMood', () => {
    e.setMood('Alice', 'happy', 1);
    expect(e.currentMood('Alice')).toBe('happy');
  });

  it('hasMoodShift true for different', () => {
    e.setMood('Alice', 'happy', 1);
    expect(e.hasMoodShift('Alice', 'sad')).toBe(true);
  });

  it('hasMoodShift false for same', () => {
    e.setMood('Alice', 'happy', 1);
    expect(e.hasMoodShift('Alice', 'happy')).toBe(false);
  });
});

describe('RelationshipStateMachine', () => {
  const e = new RelationshipStateMachine();

  it('set + get stranger default', () => {
    expect(e.get('A', 'B')).toBe('stranger');
  });

  it('transition + isHostile', () => {
    e.transition('A', 'B', 'enemy');
    expect(e.isHostile('A', 'B')).toBe(true);
  });

  it('isClose for friend', () => {
    e.transition('A', 'B', 'friend');
    expect(e.isClose('A', 'B')).toBe(true);
  });
});

describe('CharacterVoice', () => {
  const e = new CharacterVoice();

  it('addCatchphrase + usesPhrase', () => {
    e.addCatchphrase('Alice', 'oh my');
    expect(e.usesPhrase('Alice', 'oh my')).toBe(true);
  });

  it('getCatchphrases returns list', () => {
    e.addCatchphrase('Bob', 'wow');
    expect(e.getCatchphrases('Bob')).toContain('wow');
  });

  it('distinctVoices counts', () => {
    expect(e.distinctVoices()).toBeGreaterThanOrEqual(2);
  });
});

describe('CharacterHealth', () => {
  const e = new CharacterHealth();

  it('set + currentState', () => {
    e.set('Alice', 'injured', 1);
    expect(e.currentState('Alice')).toBe('injured');
  });

  it('hasDied true after death', () => {
    e.set('Bob', 'dead', 5);
    expect(e.hasDied('Bob')).toBe(true);
  });

  it('getHistory returns records', () => {
    e.set('Carol', 'healthy', 1);
    e.set('Carol', 'sick', 5);
    expect(e.getHistory('Carol')).toHaveLength(2);
  });
});

describe('CharacterWealth', () => {
  const e = new CharacterWealth();

  it('set + current', () => {
    e.set('Alice', 100, 1);
    expect(e.current('Alice')).toBe(100);
  });

  it('earn adds', () => {
    e.set('Alice', 100, 1);
    e.earn('Alice', 50, 5);
    expect(e.current('Alice')).toBe(150);
  });

  it('spend subtracts', () => {
    e.set('Alice', 100, 1);
    e.spend('Alice', 30, 5);
    expect(e.current('Alice')).toBe(70);
  });

  it('spend false for insufficient', () => {
    e.set('Alice', 10, 1);
    expect(e.spend('Alice', 100, 5)).toBe(false);
  });
});
