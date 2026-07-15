export interface CanvasPreset {
  label: string;
  width: number;
  height: number;
}

export const CANVAS_MIN_SIZE = 100;
export const CANVAS_MAX_SIZE = 10000;

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Phone', width: 390, height: 844 },
  { label: 'Phone long', width: 390, height: 2400 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Desktop', width: 1200, height: 800 },
  { label: 'Wide', width: 1440, height: 900 },
  { label: 'Long page', width: 1200, height: 3200 },
];

/** Returns the preset label matching the given size exactly, or null if custom. */
export function matchPreset(width: number, height: number): string | null {
  const hit = CANVAS_PRESETS.find((p) => p.width === width && p.height === height);
  return hit ? hit.label : null;
}
