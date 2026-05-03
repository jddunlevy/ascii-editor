import { nanoid } from 'nanoid';
import type { Element, FontName } from '@/lib/spec/types';

const DEFAULT_FONT: FontName = 'jetbrains-mono';
const DEFAULT_COLOR = '#1a1a1a';

// ─── Sprite content lookup ─────────────────────────────────────────────────────
// Used by ElementRenderer to render decorative sprites.

export const SPRITE_CONTENT: Record<string, string> = {
  'sprite-arrow-right': '→',
  'sprite-arrow-left': '←',
  'sprite-caret-right': '>',
  'sprite-caret-up': '^',
  'sprite-asterisk': '*✱✦',
  'sprite-brackets': '[ ]',
  'sprite-star': '★',
  'sprite-pipe': '||||',
  'sprite-hash-band': '####',
  'sprite-dot-grid': '· · ·\n· · ·\n· · ·',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PaletteItemDef {
  id: string;
  label: string;
  preview: string;
  category: 'text' | 'structural' | 'ascii' | 'decorative';
  /** Draggable items land on canvas; non-draggable open modals. */
  draggable: boolean;
  createElement: (pos: { x: number; y: number }, z: number) => Element;
}

export interface LibraryAsset {
  id: string;
  label: string;
  category: 'border' | 'divider' | 'ui-frame' | 'sprite';
  preview: string;
  createElement: (pos: { x: number; y: number }, z: number) => Element;
}

// ─── Palette items (draggable) ─────────────────────────────────────────────────

export const PALETTE_ITEMS: PaletteItemDef[] = [
  // Text
  {
    id: 'text-heading', label: 'Heading', preview: '# Aa',
    category: 'text', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'text', semantic: 'h1', content: 'Heading',
      font: DEFAULT_FONT, fontSize: 32, color: DEFAULT_COLOR, align: 'left',
      position: pos, size: { w: 400, h: 56 }, z,
    }),
  },
  {
    id: 'text-body', label: 'Body', preview: 'Aa',
    category: 'text', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'text', semantic: 'body', content: 'Body text',
      font: DEFAULT_FONT, fontSize: 14, color: DEFAULT_COLOR, align: 'left',
      position: pos, size: { w: 400, h: 80 }, z,
    }),
  },
  {
    id: 'text-caption', label: 'Caption', preview: '— Aa',
    category: 'text', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'text', semantic: 'caption', content: 'Caption',
      font: DEFAULT_FONT, fontSize: 12, color: DEFAULT_COLOR, align: 'left',
      position: pos, size: { w: 300, h: 32 }, z,
    }),
  },
  {
    id: 'text-code', label: 'Code', preview: '`Aa`',
    category: 'text', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'text', semantic: 'code', content: 'code here',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR, align: 'left',
      position: pos, size: { w: 400, h: 80 }, z,
    }),
  },
  // Structural
  {
    id: 'struct-nav', label: 'Nav', preview: '[nav]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'nav',
      borderStyle: 'single', position: pos, size: { w: 800, h: 48 }, z,
    }),
  },
  {
    id: 'struct-card', label: 'Card', preview: '[card]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'card',
      borderStyle: 'single', position: pos, size: { w: 200, h: 160 }, z,
    }),
  },
  {
    id: 'struct-section', label: 'Section', preview: '[sect]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'section',
      borderStyle: 'dashed', position: pos, size: { w: 400, h: 200 }, z,
    }),
  },
  {
    id: 'struct-button', label: 'Button', preview: '[ btn ]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'button',
      borderStyle: 'single', label: 'Button', position: pos, size: { w: 120, h: 40 }, z,
    }),
  },
  {
    id: 'struct-input', label: 'Input', preview: '[____]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'input',
      borderStyle: 'single', label: 'input', position: pos, size: { w: 200, h: 32 }, z,
    }),
  },
  {
    id: 'struct-modal', label: 'Modal', preview: '[modal]',
    category: 'structural', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'modal',
      borderStyle: 'double', position: pos, size: { w: 400, h: 300 }, z,
    }),
  },
  // Decorative (draggable — drops default divider; library button is separate)
  {
    id: 'dec-divider', label: 'Divider', preview: '────',
    category: 'decorative', draggable: true,
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '─',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
];

// ─── Library — Dividers (6) ────────────────────────────────────────────────────

export const LIBRARY_DIVIDERS: LibraryAsset[] = [
  {
    id: 'div-single', label: 'Single', category: 'divider', preview: '────────',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '─',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
  {
    id: 'div-heavy', label: 'Heavy', category: 'divider', preview: '━━━━━━━━',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '━',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
  {
    id: 'div-double', label: 'Double', category: 'divider', preview: '════════',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '═',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
  {
    id: 'div-dashed', label: 'Dashed', category: 'divider', preview: '- - - - -',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '- ',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
  {
    id: 'div-dotted', label: 'Dotted', category: 'divider', preview: '· · · · ·',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '· ',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
  {
    id: 'div-wave', label: 'Wave', category: 'divider', preview: '~~~~~~~~',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'divider', pattern: '~',
      color: DEFAULT_COLOR, position: pos, size: { w: 400, h: 16 }, z,
    }),
  },
];

// ─── Library — Sprites (8) ────────────────────────────────────────────────────

export const LIBRARY_SPRITES: LibraryAsset[] = [
  {
    id: 'sprite-arrow-right', label: 'Arrow →', category: 'sprite', preview: '→',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-arrow-right',
      color: DEFAULT_COLOR, position: pos, size: { w: 48, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-arrow-left', label: 'Arrow ←', category: 'sprite', preview: '←',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-arrow-left',
      color: DEFAULT_COLOR, position: pos, size: { w: 48, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-caret-right', label: 'Caret >', category: 'sprite', preview: '>',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-caret-right',
      color: DEFAULT_COLOR, position: pos, size: { w: 48, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-caret-up', label: 'Caret ^', category: 'sprite', preview: '^',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-caret-up',
      color: DEFAULT_COLOR, position: pos, size: { w: 48, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-asterisk', label: 'Asterisk', category: 'sprite', preview: '*✱✦',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-asterisk',
      color: DEFAULT_COLOR, position: pos, size: { w: 80, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-brackets', label: 'Brackets', category: 'sprite', preview: '[ ]',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-brackets',
      color: DEFAULT_COLOR, position: pos, size: { w: 64, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-star', label: 'Star ★', category: 'sprite', preview: '★',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-star',
      color: DEFAULT_COLOR, position: pos, size: { w: 48, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-pipe', label: 'Pipe ||||', category: 'sprite', preview: '||||',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-pipe',
      color: DEFAULT_COLOR, position: pos, size: { w: 64, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-hash-band', label: 'Hash ####', category: 'sprite', preview: '####',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-hash-band',
      color: DEFAULT_COLOR, position: pos, size: { w: 80, h: 32 }, z,
    }),
  },
  {
    id: 'sprite-dot-grid', label: 'Dot Grid', category: 'sprite', preview: '· · ·\n· · ·',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'decorative', builtinId: 'sprite-dot-grid',
      color: DEFAULT_COLOR, position: pos, size: { w: 64, h: 48 }, z,
    }),
  },
];

// ─── Library — Borders (10) ────────────────────────────────────────────────────

export const LIBRARY_BORDERS: LibraryAsset[] = [
  {
    id: 'border-single', label: 'Single', category: 'border', preview: '┌─┐\n│ │\n└─┘',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'section',
      borderStyle: 'single', position: pos, size: { w: 200, h: 120 }, z,
    }),
  },
  {
    id: 'border-double', label: 'Double', category: 'border', preview: '╔═╗\n║ ║\n╚═╝',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'section',
      borderStyle: 'double', position: pos, size: { w: 200, h: 120 }, z,
    }),
  },
  {
    id: 'border-dashed', label: 'Dashed', category: 'border', preview: '┌-┐\n: :\n└-┘',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'section',
      borderStyle: 'dashed', position: pos, size: { w: 200, h: 120 }, z,
    }),
  },
  {
    id: 'border-rounded', label: 'Rounded', category: 'border', preview: '╭─╮\n│ │\n╰─╯',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-rounded',
      content: '╭──────────────╮\n│              │\n│              │\n╰──────────────╯',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-heavy', label: 'Heavy', category: 'border', preview: '┏━┓\n┃ ┃\n┗━┛',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-heavy',
      content: '┏━━━━━━━━━━━━━━┓\n┃              ┃\n┃              ┃\n┗━━━━━━━━━━━━━━┛',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-plus', label: 'Plus +', category: 'border', preview: '+-+\n| |\n+-+',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-plus',
      content: '+--------------+\n|              |\n|              |\n+--------------+',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-star', label: 'Star *', category: 'border', preview: '***\n* *\n***',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-star',
      content: '****************\n*              *\n*              *\n****************',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-hash', label: 'Hash #', category: 'border', preview: '###\n# #\n###',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-hash',
      content: '################\n#              #\n#              #\n################',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-block', label: 'Block ▓', category: 'border', preview: '▓▓▓\n▓ ▓\n▓▓▓',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-block',
      content: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n▓              ▓\n▓              ▓\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
  {
    id: 'border-dotted', label: 'Dotted ·', category: 'border', preview: '···\n· ·\n···',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'ascii_art', source: 'builtin', builtinId: 'border-dotted',
      content: '··············\n·            ·\n·            ·\n··············',
      font: DEFAULT_FONT, fontSize: 13, color: DEFAULT_COLOR,
      position: pos, size: { w: 200, h: 80 }, z,
    }),
  },
];

// ─── Library — UI Frame primitives (4) ────────────────────────────────────────

export const LIBRARY_UI_FRAMES: LibraryAsset[] = [
  {
    id: 'frame-button', label: 'Button', category: 'ui-frame', preview: '[ OK ]',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'button',
      borderStyle: 'single', label: 'Button', position: pos, size: { w: 120, h: 40 }, z,
    }),
  },
  {
    id: 'frame-input', label: 'Input', category: 'ui-frame', preview: '[______]',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'input',
      borderStyle: 'single', label: 'input', position: pos, size: { w: 200, h: 32 }, z,
    }),
  },
  {
    id: 'frame-modal', label: 'Modal', category: 'ui-frame', preview: '╔modal╗',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'modal',
      borderStyle: 'double', position: pos, size: { w: 400, h: 300 }, z,
    }),
  },
  {
    id: 'frame-card', label: 'Card', category: 'ui-frame', preview: '┌card─┐',
    createElement: (pos, z) => ({
      id: nanoid(), type: 'structural', semantic: 'card',
      borderStyle: 'single', position: pos, size: { w: 200, h: 160 }, z,
    }),
  },
];

// ─── All assets ────────────────────────────────────────────────────────────────

export const ALL_LIBRARY_ASSETS: LibraryAsset[] = [
  ...LIBRARY_BORDERS,
  ...LIBRARY_DIVIDERS,
  ...LIBRARY_UI_FRAMES,
  ...LIBRARY_SPRITES,
];
