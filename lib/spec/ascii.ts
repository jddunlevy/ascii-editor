import type { FontName } from './types';

/** Must match AsciiArtRenderer's lineHeight style property. */
export const ASCII_LINE_HEIGHT = 1.2;

/** Font family strings usable in a canvas 2D context (no CSS variables). */
const CANVAS_FONT_FAMILY: Record<FontName, string> = {
  'jetbrains-mono': "'JetBrains Mono', monospace",
  'ibm-plex-mono': "'IBM Plex Mono', monospace",
  'geist-mono': "'Geist Mono', monospace",
  'fira-code': "'Fira Code', monospace",
  vt323: "'VT323', monospace",
};

/** Cached charWidth / fontSize ratio, keyed by FontName. */
const charWidthRatioCache = new Map<FontName, number>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function measureAsciiContent(content: string): { rows: number; cols: number } {
  const lines = content.split('\n');
  return {
    rows: lines.length,
    cols: Math.max(1, ...lines.map((l) => l.length)),
  };
}

/**
 * Returns charWidth / fontSize for the given monospace font.
 * Measured once via a hidden canvas element; falls back to 0.6 in non-browser
 * environments (e.g. SSR) or when the font is not yet loaded.
 */
export function getCharWidthRatio(font: FontName): number {
  const cached = charWidthRatioCache.get(font);
  if (cached !== undefined) return cached;

  let ratio = 0.6;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `100px ${CANVAS_FONT_FAMILY[font]}`;
      ratio = ctx.measureText('M').width / 100;
    }
  }
  charWidthRatioCache.set(font, ratio);
  return ratio;
}

export function getCharMetrics(
  font: FontName,
  fontSize: number,
): { charW: number; charH: number } {
  return {
    charW: fontSize * getCharWidthRatio(font),
    charH: fontSize * ASCII_LINE_HEIGHT,
  };
}

/**
 * Pixel dimensions of the box that exactly contains the ASCII art content
 * when rendered at the given fontSize.
 */
export function computeAsciiBox(
  content: string,
  fontSize: number,
  font: FontName,
): { w: number; h: number } {
  const { rows, cols } = measureAsciiContent(content);
  const { charW, charH } = getCharMetrics(font, fontSize);
  return {
    w: Math.ceil(cols * charW),
    h: Math.ceil(rows * charH),
  };
}

/**
 * Computes an initial fontSize (starting from 14, floored at 4) and matching
 * box dimensions that fit within 80 % of the given viewport on both axes.
 */
export function fitAsciiToViewport(
  content: string,
  font: FontName,
  viewport: { w: number; h: number },
): { fontSize: number; w: number; h: number } {
  const { rows, cols } = measureAsciiContent(content);
  const ratio = getCharWidthRatio(font);

  const maxW = viewport.w * 0.8;
  const maxH = viewport.h * 0.8;

  const maxFontByW = cols > 0 ? maxW / (cols * ratio) : 14;
  const maxFontByH = rows > 0 ? maxH / (rows * ASCII_LINE_HEIGHT) : 14;

  const fontSize = Math.max(4, Math.min(14, maxFontByW, maxFontByH));

  return {
    fontSize,
    w: Math.ceil(cols * fontSize * ratio),
    h: Math.ceil(rows * fontSize * ASCII_LINE_HEIGHT),
  };
}
