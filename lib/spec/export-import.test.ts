import { describe, it, expect } from 'vitest';
import { exportToMarkdown, slugifyTitle } from './export';
import { renderBody } from './bodyRenderer';
import { parseMarkdownToSpec } from './import';
import type { PageSpec } from './types';
import { SPEC_VERSION } from './types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeSpec(overrides?: Partial<PageSpec['page']>): PageSpec {
  return {
    spec_version: SPEC_VERSION,
    page: {
      title: 'Test Page',
      canvas: { width: 1200, height: 800, grid: 8, theme: 'notebook' },
      elements: [],
      ...overrides,
    },
  };
}

// ─── slugifyTitle ─────────────────────────────────────────────────────────────

describe('slugifyTitle', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyTitle('Hello World')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugifyTitle('  --test--  ')).toBe('test');
  });

  it('collapses multiple non-alphanumeric chars', () => {
    expect(slugifyTitle('foo / bar & baz')).toBe('foo-bar-baz');
  });

  it('falls back to "untitled" for empty string', () => {
    expect(slugifyTitle('')).toBe('untitled');
    expect(slugifyTitle('   ')).toBe('untitled');
  });
});

// ─── renderBody ──────────────────────────────────────────────────────────────

describe('renderBody', () => {
  it('starts with page title as h1', () => {
    const spec = makeSpec();
    expect(renderBody(spec)).toMatch(/^# Test Page\n/);
  });

  it('renders text elements with correct markdown semantics', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'a', type: 'text', semantic: 'h2', content: 'Section',
          position: { x: 0, y: 0 }, size: { w: 100, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 16, color: '#000', align: 'left',
        },
        {
          id: 'b', type: 'text', semantic: 'caption', content: 'Note',
          position: { x: 0, y: 50 }, size: { w: 100, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 12, color: '#000', align: 'left',
        },
        {
          id: 'c', type: 'text', semantic: 'label', content: 'Tag',
          position: { x: 0, y: 100 }, size: { w: 100, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 12, color: '#000', align: 'left',
        },
      ],
    });
    const body = renderBody(spec);
    expect(body).toContain('## Section');
    expect(body).toContain('_Note_');
    expect(body).toContain('**Tag**');
  });

  it('renders ascii_art as fenced code block', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'a', type: 'ascii_art', source: 'pasted', content: 'cat',
          position: { x: 0, y: 0 }, size: { w: 40, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 10, color: '#000',
        },
      ],
    });
    const body = renderBody(spec);
    expect(body).toContain('```\ncat\n```');
  });

  it('renders divider as repeated pattern (40 chars)', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'a', type: 'divider', pattern: '─',
          position: { x: 0, y: 0 }, size: { w: 200, h: 8 }, z: 1,
          color: '#000',
        },
      ],
    });
    const body = renderBody(spec);
    expect(body).toContain('─'.repeat(40));
  });

  it('omits decorative elements from body', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'a', type: 'decorative', builtinId: 'star',
          position: { x: 0, y: 0 }, size: { w: 20, h: 20 }, z: 1,
          color: '#000',
        },
      ],
    });
    const body = renderBody(spec);
    // Only the title heading should be in the output
    expect(body.trim()).toBe('# T');
  });

  it('renders structural with label as h3', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'a', type: 'structural', semantic: 'section', label: 'Hero',
          position: { x: 0, y: 0 }, size: { w: 200, h: 100 }, z: 1,
          borderStyle: 'single',
        },
      ],
    });
    const body = renderBody(spec);
    expect(body).toContain('### Hero');
  });

  it('sorts elements by y then x', () => {
    const spec = makeSpec({
      title: 'T',
      elements: [
        {
          id: 'second', type: 'text', semantic: 'body', content: 'Second',
          position: { x: 0, y: 100 }, size: { w: 100, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 14, color: '#000', align: 'left',
        },
        {
          id: 'first', type: 'text', semantic: 'body', content: 'First',
          position: { x: 0, y: 0 }, size: { w: 100, h: 20 }, z: 1,
          font: 'jetbrains-mono', fontSize: 14, color: '#000', align: 'left',
        },
      ],
    });
    const body = renderBody(spec);
    const firstIdx = body.indexOf('First');
    const secondIdx = body.indexOf('Second');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('ends with exactly one trailing newline', () => {
    const body = renderBody(makeSpec());
    expect(body.endsWith('\n')).toBe(true);
    expect(body.endsWith('\n\n')).toBe(false);
  });
});

// ─── exportToMarkdown ─────────────────────────────────────────────────────────

describe('exportToMarkdown', () => {
  it('produces a document that starts with ---', () => {
    const md = exportToMarkdown(makeSpec());
    expect(md.startsWith('---\n')).toBe(true);
  });

  it('embeds spec_version in frontmatter', () => {
    const md = exportToMarkdown(makeSpec());
    expect(md).toContain(`spec_version: ${SPEC_VERSION}`);
  });

  it('embeds generator field', () => {
    expect(exportToMarkdown(makeSpec())).toContain('generator: ascii-editor');
  });

  it('embeds exported_at ISO timestamp', () => {
    const md = exportToMarkdown(makeSpec());
    expect(md).toMatch(/exported_at: '?\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── parseMarkdownToSpec ──────────────────────────────────────────────────────

describe('parseMarkdownToSpec', () => {
  it('returns error for text with no frontmatter', () => {
    const result = parseMarkdownToSpec('# Just a heading\n\nNo frontmatter here.');
    expect(result.success).toBe(false);
  });

  it('returns error for frontmatter missing required fields', () => {
    const result = parseMarkdownToSpec('---\nfoo: bar\n---\n\n# Hello');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid spec');
    }
  });

  it('returns error for unknown spec_version', () => {
    const result = parseMarkdownToSpec('---\nspec_version: 99\npage:\n  title: t\n---\n');
    expect(result.success).toBe(false);
  });
});

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe('export → import round-trip', () => {
  it('preserves an empty-elements spec', () => {
    const original = makeSpec();
    const md = exportToMarkdown(original);
    const result = parseMarkdownToSpec(md);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.spec.spec_version).toBe(SPEC_VERSION);
      expect(result.spec.page.title).toBe('Test Page');
      expect(result.spec.page.canvas).toEqual(original.page.canvas);
      expect(result.spec.page.elements).toHaveLength(0);
    }
  });

  it('preserves a text element through round-trip', () => {
    const spec = makeSpec({
      elements: [
        {
          id: 'el-1',
          type: 'text',
          semantic: 'h1',
          content: 'Hello',
          position: { x: 10, y: 20 },
          size: { w: 200, h: 40 },
          z: 1,
          font: 'vt323',
          fontSize: 32,
          color: '#ff0000',
          align: 'center',
        },
      ],
    });
    const result = parseMarkdownToSpec(exportToMarkdown(spec));
    expect(result.success).toBe(true);
    if (result.success) {
      const el = result.spec.page.elements[0];
      expect(el.type).toBe('text');
      if (el.type === 'text') {
        expect(el.id).toBe('el-1');
        expect(el.semantic).toBe('h1');
        expect(el.content).toBe('Hello');
        expect(el.color).toBe('#ff0000');
        expect(el.align).toBe('center');
        expect(el.font).toBe('vt323');
      }
    }
  });

  it('preserves a divider element through round-trip', () => {
    const spec = makeSpec({
      elements: [
        {
          id: 'div-1',
          type: 'divider',
          pattern: '=',
          position: { x: 0, y: 0 },
          size: { w: 400, h: 8 },
          z: 2,
          color: '#aaaaaa',
        },
      ],
    });
    const result = parseMarkdownToSpec(exportToMarkdown(spec));
    expect(result.success).toBe(true);
    if (result.success) {
      const el = result.spec.page.elements[0];
      expect(el.type).toBe('divider');
      if (el.type === 'divider') {
        expect(el.pattern).toBe('=');
        expect(el.color).toBe('#aaaaaa');
      }
    }
  });

  it('preserves canvas settings (theme, grid) through round-trip', () => {
    const spec = makeSpec({
      canvas: { width: 1400, height: 900, grid: 16, theme: 'sakura' },
    });
    const result = parseMarkdownToSpec(exportToMarkdown(spec));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.spec.page.canvas.theme).toBe('sakura');
      expect(result.spec.page.canvas.grid).toBe(16);
    }
  });
});
