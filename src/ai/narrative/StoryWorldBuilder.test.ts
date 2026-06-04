/**
 * V691 StoryWorldBuilder Tests — Direction B Iter 4/9 (Round 2)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStoryWorldBuilderState,
  addLocation,
  addHistoryEvent,
  recordLocationVisit,
  getLocationsByEra,
  getPrimaryLocations,
  getWorldReport,
  resetStoryWorldBuilderState,
  type StoryWorldBuilderState,
} from './StoryWorldBuilder';

describe('StoryWorldBuilder', () => {
  let state: StoryWorldBuilderState;

  beforeEach(() => { state = createStoryWorldBuilderState(); });

  describe('createStoryWorldBuilderState', () => {
    it('should initialize with defaults', () => {
      expect(state.locations.size).toBe(0);
      expect(state.historyEvents.size).toBe(0);
      expect(state.totalLocations).toBe(0);
    });

    it('should have default world coherence', () => {
      expect(state.worldCoherence).toBe(0.5);
    });
  });

  describe('addLocation', () => {
    it('should add location', () => {
      const next = addLocation(state, 'l1', 'Mystic City', 'city', 'medieval', 'primary', 'Capital of the realm', 'mystical', ['floating markets'], 0.9);
      expect(next.locations.size).toBe(1);
      expect(next.totalLocations).toBe(1);
    });

    it('should track locations by era', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      next = addLocation(next, 'l2', 'Spaceship', 'building', 'futuristic', 'secondary', 'Ship');
      const medievalLocations = getLocationsByEra(next, 'medieval');
      expect(medievalLocations.length).toBe(1);
    });
  });

  describe('addHistoryEvent', () => {
    it('should add history event', () => {
      const next = addHistoryEvent(state, 'e1', 'Great War', 'Major conflict', 'medieval', 0.8, ['l1', 'l2']);
      expect(next.historyEvents.size).toBe(1);
      expect(next.totalHistoryEvents).toBe(1);
    });

    it('should clamp impact', () => {
      const next = addHistoryEvent(state, 'e1', 'Event', 'Desc', 'modern', 1.5);
      expect(next.historyEvents.get('e1')?.impact).toBe(1);
    });
  });

  describe('recordLocationVisit', () => {
    it('should increment visits', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      next = recordLocationVisit(next, 'l1');
      next = recordLocationVisit(next, 'l1');
      expect(next.locations.get('l1')?.visits).toBe(2);
    });

    it('should return state for unknown location', () => {
      const next = recordLocationVisit(state, 'unknown');
      expect(next.totalLocations).toBe(0);
    });
  });

  describe('getLocationsByEra', () => {
    it('should filter by era', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      next = addLocation(next, 'l2', 'Spaceship', 'building', 'futuristic', 'secondary', 'Ship');
      const medieval = getLocationsByEra(next, 'medieval');
      expect(medieval.length).toBe(1);
    });
  });

  describe('getPrimaryLocations', () => {
    it('should return primary locations', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      next = addLocation(next, 'l2', 'Tavern', 'building', 'medieval', 'secondary', 'Tavern');
      const primary = getPrimaryLocations(next);
      expect(primary.length).toBe(1);
    });
  });

  describe('getWorldReport', () => {
    it('should return comprehensive report', () => {
      const report = getWorldReport(state);
      expect(report.totalLocations).toBe(0);
      expect(typeof report.worldCoherence).toBe('number');
    });

    it('should include era distribution', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      const report = getWorldReport(next);
      expect(report.locationsByEra.medieval).toBe(1);
    });

    it('should include recommendations for empty state', () => {
      const report = getWorldReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetStoryWorldBuilderState', () => {
    it('should reset all state', () => {
      let next = addLocation(state, 'l1', 'Castle', 'building', 'medieval', 'primary', 'Castle');
      next = resetStoryWorldBuilderState();
      expect(next.locations.size).toBe(0);
      expect(next.totalLocations).toBe(0);
    });
  });
});