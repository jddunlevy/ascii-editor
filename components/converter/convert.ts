import type { ConversionParams } from '@/lib/spec/types';

// ─── Charsets ─────────────────────────────────────────────────────────────────

export const CHARSETS = {
  standard: ' .:-=+*#%@',
  dense: ' ░▒▓█',
  minimal: ' .#',
} as const;

export type CharsetName = keyof typeof CHARSETS;

// ─── ImageData-like interface (avoids DOM dependency in module scope) ──────────

export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// ─── Pure conversion function ─────────────────────────────────────────────────

/**
 * Convert pre-resized pixel data to an ASCII art string.
 *
 * The caller is responsible for resizing the source image to the desired
 * character dimensions before passing ImageData here. The resulting string
 * will have `imageData.height` lines each `imageData.width` characters long.
 *
 * Mapping: dark pixels → dense chars, light pixels → sparse chars.
 * The `inverted` param flips this relationship.
 */
export function convertImageToAscii(imageData: ImageDataLike, params: ConversionParams): string {
  const { data, width, height } = imageData;
  const { charset, brightness, contrast, inverted } = params;
  const chars = charset || CHARSETS.standard;

  const lines: string[] = [];

  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const offset = (row * width + col) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      // Perceptual grayscale
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Brightness: ±100 maps to ±127 additive shift
      gray += (brightness / 100) * 127;

      // Contrast: ±100 maps to ×0–×2 scale around midpoint 128
      if (contrast !== 0) {
        const factor = (100 + contrast) / 100;
        gray = factor * (gray - 128) + 128;
      }

      // Clamp
      gray = Math.max(0, Math.min(255, gray));

      // Invert if requested
      if (inverted) gray = 255 - gray;

      // Map darkness (not brightness) to charset index so that
      // dark pixels → dense chars and light pixels → sparse chars.
      const darkness = 255 - gray;
      const idx = Math.round((darkness / 255) * (chars.length - 1));
      line += chars[idx];
    }
    lines.push(line);
  }

  return lines.join('\n');
}
