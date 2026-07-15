import type { PageSpec, Element } from './types';
import { SPRITE_CONTENT } from '@/lib/library/assets';

// ─── Font maps ────────────────────────────────────────────────────────────────

const FONT_FAMILY_CSS: Record<string, string> = {
  'jetbrains-mono': "'JetBrains Mono', ui-monospace, monospace",
  'ibm-plex-mono':  "'IBM Plex Mono', ui-monospace, monospace",
  'geist-mono':     "'Geist Mono', ui-monospace, monospace",
  'fira-code':      "'Fira Code', ui-monospace, monospace",
  'vt323':          "'VT323', ui-monospace, monospace",
};

const GOOGLE_FONT_PARAM: Record<string, string> = {
  'jetbrains-mono': 'JetBrains+Mono',
  'ibm-plex-mono':  'IBM+Plex+Mono',
  'geist-mono':     'Geist+Mono',
  'fira-code':      'Fira+Code',
  'vt323':          'VT323',
};

const BORDER_CSS: Record<string, string> = {
  single: '1px solid',
  double: '3px double',
  dashed: '1px dashed',
  none:   'none',
};

// ─── HTML escaping ────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Per-element HTML renderer ────────────────────────────────────────────────
// Mirrors the logic in components/editor/ElementRenderer.tsx.

function elementToHtml(el: Element): string {
  const base =
    `position:absolute;` +
    `left:${el.position.x}px;top:${el.position.y}px;` +
    `width:${el.size.w}px;height:${el.size.h}px;` +
    `z-index:${el.z};box-sizing:border-box;`;

  switch (el.type) {
    case 'text': {
      const ff = FONT_FAMILY_CSS[el.font] ?? 'ui-monospace,monospace';
      return (
        `<div style="${base}font-family:${ff};font-size:${el.fontSize}px;` +
        `color:${el.color};text-align:${el.align};` +
        `white-space:pre-wrap;line-height:1.4;overflow:hidden;">` +
        `${esc(el.content)}</div>`
      );
    }

    case 'ascii_art': {
      const ff = FONT_FAMILY_CSS[el.font] ?? 'ui-monospace,monospace';
      return (
        `<pre style="${base}font-family:${ff};font-size:${el.fontSize}px;` +
        `color:${el.color};white-space:pre;line-height:1.2;overflow:hidden;margin:0;">` +
        `${esc(el.content)}</pre>`
      );
    }

    case 'divider': {
      const count = Math.ceil(el.size.w / 8);
      return (
        `<div style="${base}display:flex;align-items:center;` +
        `overflow:hidden;white-space:nowrap;` +
        `font-family:ui-monospace,monospace;color:${el.color};">` +
        `${esc(el.pattern.repeat(count))}</div>`
      );
    }

    case 'decorative': {
      const content = SPRITE_CONTENT[el.builtinId] ?? el.builtinId;
      return (
        `<pre style="${base}display:flex;align-items:center;justify-content:center;` +
        `font-family:ui-monospace,monospace;color:${el.color};` +
        `font-size:13px;margin:0;white-space:pre;line-height:1.3;">` +
        `${esc(content)}</pre>`
      );
    }

    case 'structural': {
      const borderVal = BORDER_CSS[el.borderStyle] ?? 'none';
      const borderCss = borderVal === 'none' ? '' : `border:${borderVal} #cccccc;`;
      const label = esc(el.label ?? el.semantic);
      return (
        `<div style="${base}${borderCss}">` +
        `<span style="position:absolute;top:2px;left:4px;font-size:10px;` +
        `font-family:ui-monospace,monospace;color:#cccccc;opacity:0.6;">` +
        `${label}</span></div>`
      );
    }
  }
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportToHtml(spec: PageSpec): string {
  const { canvas, elements, title } = spec.page;

  // Collect only the fonts actually used so the Google Fonts request is minimal.
  const usedFonts = new Set<string>();
  for (const el of elements) {
    if ('font' in el) usedFonts.add((el as { font: string }).font);
  }

  const fontParams = [...usedFonts]
    .map((k) => GOOGLE_FONT_PARAM[k])
    .filter(Boolean)
    .map((f) => `family=${f}`)
    .join('&');

  const fontsHtml = fontParams
    ? [
        `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
        `  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
        `  <link href="https://fonts.googleapis.com/css2?${fontParams}&display=swap" rel="stylesheet">`,
      ].join('\n')
    : '';

  const bg = canvas.background ?? '#ffffff';

  // Render elements in z-order so the HTML stacking matches the design.
  const sorted = [...elements].sort((a, b) => a.z - b.z);
  const elementsHtml = sorted.map((el) => '    ' + elementToHtml(el)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
${fontsHtml}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111; display: flex; justify-content: center; padding: 32px; }
  </style>
</head>
<body>
  <div style="position:relative;width:${canvas.width}px;height:${canvas.height}px;background:${bg};box-shadow:0 2px 16px rgba(0,0,0,0.4);flex-shrink:0;">
${elementsHtml}
  </div>
</body>
</html>`;
}
