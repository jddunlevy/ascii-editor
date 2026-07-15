import { describe, it, expect } from 'vitest';
import { CANVAS_PRESETS, matchPreset } from './canvasPresets';

describe('matchPreset', () => {
  it('returns the label for an exact preset match', () => {
    expect(matchPreset(390, 844)).toBe('Phone');
    expect(matchPreset(1200, 800)).toBe('Desktop');
  });

  it('returns null for non-preset sizes', () => {
    expect(matchPreset(390, 845)).toBeNull();
    expect(matchPreset(1000, 1000)).toBeNull();
  });

  it('does not match a swapped (landscape) orientation of a preset', () => {
    expect(matchPreset(844, 390)).toBeNull();
  });

  it('has unique labels and dimensions across presets', () => {
    const labels = new Set(CANVAS_PRESETS.map((p) => p.label));
    const dims = new Set(CANVAS_PRESETS.map((p) => `${p.width}x${p.height}`));
    expect(labels.size).toBe(CANVAS_PRESETS.length);
    expect(dims.size).toBe(CANVAS_PRESETS.length);
  });
});
