export const SPEC_VERSION = 1 as const;

export type ThemeName =
  | 'notebook'
  | 'avocado'
  | 'sakura'
  | 'blood-orange'
  | 'blue-bird';

export type FontName =
  | 'jetbrains-mono'
  | 'ibm-plex-mono'
  | 'geist-mono'
  | 'fira-code'
  | 'vt323';

export type Align = 'left' | 'center' | 'right';

export type BorderStyle = 'single' | 'double' | 'dashed' | 'none';

export type StructuralSemantic =
  | 'nav'
  | 'card'
  | 'section'
  | 'button'
  | 'input'
  | 'modal';

export type TextSemantic =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'caption'
  | 'code'
  | 'label';

// ─── Base element ─────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  z: number;
  rotation?: number;
  locked?: boolean;
}

// ─── Element types ────────────────────────────────────────────────────────────

export interface TextElement extends BaseElement {
  type: 'text';
  semantic: TextSemantic;
  content: string;
  font: FontName;
  fontSize: number;
  color: string;
  align: Align;
}

export interface ConversionParams {
  width: number;
  charset: string;
  brightness: number;
  contrast: number;
  inverted: boolean;
}

export interface AsciiArtElement extends BaseElement {
  type: 'ascii_art';
  source: 'pasted' | 'converted' | 'builtin';
  builtinId?: string;
  content: string;
  font: FontName;
  fontSize: number;
  color: string;
  conversionParams?: ConversionParams;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  pattern: string;
  color: string;
}

export interface DecorativeElement extends BaseElement {
  type: 'decorative';
  builtinId: string;
  color: string;
}

export interface StructuralElement extends BaseElement {
  type: 'structural';
  semantic: StructuralSemantic;
  label?: string;
  borderStyle: BorderStyle;
  children?: string[]; // reserved for v2 — flat in v1
}

export type Element =
  | TextElement
  | AsciiArtElement
  | DividerElement
  | DecorativeElement
  | StructuralElement;

// ─── Page spec ────────────────────────────────────────────────────────────────

export interface CanvasConfig {
  width: number;
  height: number;
  grid: number;
  theme: ThemeName;
}

export interface PageConfig {
  title: string;
  canvas: CanvasConfig;
  elements: Element[];
}

export interface PageSpec {
  spec_version: typeof SPEC_VERSION;
  page: PageConfig;
}

// ─── DB row shape (select subset used by the editor) ─────────────────────────

export interface PageRow {
  id: string;
  title: string;
  spec: PageSpec;
  created_at: string;
  updated_at: string;
}

export interface PageListRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createDefaultSpec(title = 'Untitled'): PageSpec {
  return {
    spec_version: SPEC_VERSION,
    page: {
      title,
      canvas: {
        width: 1200,
        height: 800,
        grid: 8,
        theme: 'notebook',
      },
      elements: [],
    },
  };
}
