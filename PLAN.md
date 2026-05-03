# ASCII Editor — Requirements & Build Guide

A planning document for the v1 build, structured for direct use by Claude Code.

---

## Process Rules

1. **Check off only after verification.** An item is `[x]` only after all three pass: `npm run build` (zero errors), `tsc --noEmit` (zero errors), and the manual test described for that phase.
2. **Phase is complete only when every item is checked.** No partial "complete".
3. **At each phase boundary:** `git add -A && git commit -m "phase N complete"`
4. **If abandoned mid-phase:** `git add -A && git commit -m "phase N wip: <one-line summary>"`

---

## 1. Vision & Positioning

**ASCII Editor** is a web-based design tool for developers who want to commit visual planning artifacts directly to a git repo as living design documents. It produces markdown files with embedded ASCII art and structured frontmatter — files that render naturally in GitHub and other markdown viewers, and that an LLM (specifically Claude Code) can read to reconstruct the original design as real frontend code.

**The niche:** Developers who are tired of Figma but want their planning docs to look better than a whiteboard photo. README-driven design.

**What this is not:**
- A Figma replacement
- An artbook or zine maker (despite the aesthetic)
- A general-purpose design tool
- A code editor or IDE
- A collaboration tool (in v1)

**Aesthetic North Star:** Minimalist, terminal-inspired, paper-tone palette, ASCII as decoration. Reference: `catnap-rx` aesthetic — monospace, low chrome, subtle. The interface should feel like a thoughtful CLI tool, not a creative suite.

---

## 2. Primary User

A solo developer or small-team developer who:
- Sketches frontend layouts before building
- Maintains a git repo for their projects
- Prefers writing/committing markdown over screenshotting design tools
- Cares about how their planning docs look in their repo
- Will use Claude Code (or similar) to translate the spec into real code later
- Works on desktop (this is a desktop-only tool in v1)

Non-goals: graphic designers, non-technical users, mobile users.

---

## 3. Core Concept

A user opens a fresh page (a free canvas) and drags semantic blocks onto it — headings, body text, navs, cards, buttons, sections, ASCII art, dividers, borders. Elements snap to a baseline grid (toggleable visible). Each element has a default semantic type that the user can change with one click. The user can layer elements freely.

When the user exports, the page becomes a single `.md` file:
- **Frontmatter:** A complete YAML spec describing every element, its position, type, content, and styling — enough that Claude Code can recreate the design as a real component.
- **Body:** A human-readable markdown rendering of the page — headings as `#`, body text as paragraphs, ASCII art in code fences, decorative elements omitted or rendered inline.

The data model in Supabase mirrors the export spec exactly. The page IS its serializable spec.

---

## 4. Scope

### v1 (this build)

- GitHub OAuth + magic link auth via Supabase
- User dashboard listing all their pages
- Single-canvas editor per page (no multi-page documents)
- Free-canvas drag-and-drop with snap-to-grid
- Toggleable visible alignment grid
- Component palette with text, structural, ASCII, and decorative blocks
- Element semantic-type override (one click)
- Layering with z-index
- Image-to-ASCII converter (custom built, ~200 lines)
- Paste-your-own ASCII import
- Theme-constrained color picker with full-picker escape hatch
- 5 monospace/display fonts
- 28-item starter graphics library
- Autosave with debounce + saved indicator
- Session-history undo/redo
- Markdown export (frontmatter spec + rendered body)
- Page management: create, rename, duplicate, delete
- Keyboard shortcuts for common actions

### Explicitly out of scope for v1 (deferred to v2+)

- Multi-page documents / projects with multiple canvases
- Public sharing, public gallery, share links
- Collaboration / real-time editing
- Mobile / responsive editor
- HTML/CSS export (markdown export only in v1)
- Raster image elements on canvas (ASCII-only canvas)
- Version history / snapshots
- Comments, annotations
- Templates / starter pages
- Custom user-uploaded graphics to library
- Plugin / extension system
- Persistent undo across sessions

---

## 5. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) | Best Supabase auth integration, Claude Code writes it well, deploys to Vercel cleanly |
| Language | TypeScript (strict) | Catches state-shape bugs that compound in editor apps |
| UI | React 18+ | Standard |
| Styling | Tailwind CSS | Speed, consistency, Claude Code fluency |
| State | Zustand | Lightweight, ideal for editor state, simpler than Redux |
| Drag-and-drop | dnd-kit | Modern, accessible, native HTML5 DnD is unusable for this |
| Auth + DB + Storage | Supabase | Specified by user; Postgres + GitHub OAuth + Storage |
| Deployment | Vercel | One-command deploy, free tier sufficient |
| Image conversion | Custom (Canvas API) | Simple algorithm, full control, no dep risk |

**Recommended additional libs:**
- `react-colorful` — small color picker for the escape-hatch wheel
- `js-yaml` — for parsing/serializing frontmatter
- `gray-matter` — markdown frontmatter handling
- `nanoid` — for element IDs
- `lodash.debounce` — for autosave debouncing

---

## 6. Architecture Overview

```
[Browser]
  ├── Next.js App Router (RSC for auth gates, client components for editor)
  ├── Editor State (Zustand store, in-memory)
  │     ├── current page spec (the source of truth)
  │     ├── selection state
  │     ├── undo/redo stack
  │     └── UI state (grid visible, palette, etc.)
  ├── Canvas (DOM-based, absolute positioning)
  ├── Component Palette (sidebar)
  ├── Property Inspector (right sidebar, contextual to selection)
  └── Conversion Module (Canvas API, runs client-side)

[Supabase]
  ├── Auth (GitHub OAuth + magic link)
  ├── Postgres
  │     ├── users (managed by Supabase)
  │     ├── pages (one row per page, JSONB column for spec)
  │     └── (no other tables in v1)
  └── Storage (NOT used in v1 — ASCII-only canvas means no asset storage needed)
```

**Key architectural principle:** The page spec is the source of truth. Everything else (rendered canvas, exported markdown, undo stack) is derived from the spec. There is no separate "render state" — the canvas is a direct visualization of the spec object.

---

## 7. Data Model

### Supabase schema

```sql
create table pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  spec jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pages_user_id_updated_at_idx on pages (user_id, updated_at desc);

-- RLS
alter table pages enable row level security;

create policy "users can read own pages" on pages
  for select using (auth.uid() = user_id);
create policy "users can insert own pages" on pages
  for insert with check (auth.uid() = user_id);
create policy "users can update own pages" on pages
  for update using (auth.uid() = user_id);
create policy "users can delete own pages" on pages
  for delete using (auth.uid() = user_id);
```

### Spec JSON shape (stored in `pages.spec`)

```typescript
type PageSpec = {
  spec_version: 1;
  page: {
    title: string;
    canvas: {
      width: number;        // px, default 1200
      height: number;       // px, default 800
      grid: number;         // baseline grid unit in px, default 8
      theme: ThemeName;     // see Design System
    };
    elements: Element[];
  };
};

type Element =
  | TextElement
  | AsciiArtElement
  | DividerElement
  | DecorativeElement
  | StructuralElement;

type BaseElement = {
  id: string;               // nanoid
  position: { x: number; y: number };
  size: { w: number; h: number };
  z: number;                // z-index for layering
  rotation?: number;        // degrees, optional, default 0
  locked?: boolean;         // optional, default false
};

type TextElement = BaseElement & {
  type: 'text';
  semantic: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'code' | 'label';
  content: string;
  font: FontName;
  fontSize: number;
  color: string;            // hex, validated against theme palette OR free
  align: 'left' | 'center' | 'right';
};

type AsciiArtElement = BaseElement & {
  type: 'ascii_art';
  source: 'pasted' | 'converted' | 'builtin';
  builtinId?: string;       // if source === 'builtin'
  content: string;          // the actual ASCII text
  font: FontName;           // must be monospace
  fontSize: number;
  color: string;
  conversionParams?: {      // if source === 'converted', preserve for re-edit
    width: number;
    charset: string;
    brightness: number;
    contrast: number;
    inverted: boolean;
  };
};

type DividerElement = BaseElement & {
  type: 'divider';
  pattern: string;          // e.g., "─", "━", "═", "- - -"
  color: string;
};

type DecorativeElement = BaseElement & {
  type: 'decorative';
  builtinId: string;        // reference to library asset
  color: string;
};

type StructuralElement = BaseElement & {
  type: 'structural';
  semantic: 'nav' | 'card' | 'section' | 'button' | 'input' | 'modal';
  label?: string;           // optional human label, e.g., "Primary CTA"
  borderStyle: 'single' | 'double' | 'dashed' | 'none';
  children?: string[];      // ids of nested elements (v2 — flat in v1)
};

type ThemeName = 'notebook' | 'avocado' | 'sakura' | 'blood-orange' | 'blue-bird';
type FontName = 'jetbrains-mono' | 'ibm-plex-mono' | 'geist-mono' | 'fira-code' | 'vt323';
```

**Notes:**
- All elements are flat in the array in v1. No nesting / parent-child relationships. `StructuralElement.children` is reserved for v2.
- Position is in absolute pixels relative to the canvas top-left. Snap-to-grid is enforced at edit time, not in the data model.
- `z` is an integer; bringing-to-front is `max(all z) + 1`, sending-to-back is `min(all z) - 1`.

---

## 8. Export Spec (Markdown Format)

A page exports as a single `.md` file. Filename: `{slugified-title}.md`.

### Format

```markdown
---
spec_version: 1
generator: ascii-editor
exported_at: 2026-05-02T14:30:00Z
page:
  title: "Landing Page Sketch"
  canvas:
    width: 1200
    height: 800
    grid: 8
    theme: notebook
  elements:
    - id: hero-title
      type: text
      semantic: h1
      content: "ASCII Editor"
      position: { x: 64, y: 48 }
      size: { w: 600, h: 80 }
      z: 1
      font: vt323
      fontSize: 64
      color: "#1a1a1a"
      align: left
    - id: hero-tagline
      type: text
      semantic: body
      content: "Plan frontends in your terminal aesthetic."
      position: { x: 64, y: 144 }
      size: { w: 600, h: 32 }
      z: 1
      font: jetbrains-mono
      fontSize: 16
      color: "#444444"
      align: left
    - id: hero-divider
      type: divider
      pattern: "─"
      position: { x: 64, y: 200 }
      size: { w: 600, h: 8 }
      z: 1
      color: "#999999"
---

# Landing Page Sketch

```
ASCII Editor
```

Plan frontends in your terminal aesthetic.

────────────────────────────────────────

[rest of rendered body]
```

### Body rendering rules

- `text` with `semantic: h1` → `# {content}`
- `text` with `semantic: h2` → `## {content}`
- `text` with `semantic: h3` → `### {content}`
- `text` with `semantic: body` → paragraph
- `text` with `semantic: caption` → italicized paragraph
- `text` with `semantic: code` → `` ` ` ``  inline code
- `text` with `semantic: label` → bold paragraph
- `ascii_art` → fenced code block with no language tag
- `divider` → horizontal rule rendered as the actual pattern repeated
- `decorative` → omitted from body (frontmatter only)
- `structural` → rendered as labeled section heading + bordered content if `label` is set, else omitted

Body order is determined by element position: top-to-bottom by `y`, then left-to-right by `x`. Layering (`z`) is ignored in body rendering — it only matters for visual canvas reconstruction.

### Why this format

- **Frontmatter is the LLM-readable spec.** Claude Code reading this file gets a complete description of every element with semantic intent, position, and styling. Sufficient to generate real components.
- **Body is the human-readable rendering.** When committed to a repo and viewed on GitHub, the file looks like a thoughtful design doc, not a wall of YAML.
- **Single file.** Easy to commit, easy to share, no asset management.
- **Self-contained.** No external image references that could break.

### Import

The editor must also be able to **import** an exported `.md` file. This is critical: the spec round-trips. A user can export, edit the markdown file directly (or have Claude modify it), re-import, and continue editing.

---

## 9. Canvas Model

- **Approach:** DOM-based. Each element is an absolutely-positioned div inside the canvas container.
- **Coordinate system:** Pixel-based, origin top-left of canvas.
- **Grid:** Default 8px baseline. Toggleable visible. Snap is on by default; hold `Alt` while dragging to disable snap temporarily.
- **Selection:** Click to select. Shift-click to multi-select. Click-drag on empty canvas to box-select. Selected elements get a 1px dashed outline in the theme's accent color.
- **Drag:** Click and hold inside an element, then drag. Dragging snaps to grid by default.
- **Resize:** 8 handles on selected element (corners + edges). Snap to grid.
- **Layer order:** `z` field. Right-click → Bring Forward / Send Backward / Bring to Front / Send to Back. Or keyboard shortcuts.
- **Performance budget:** Target up to ~200 elements per page. If canvas perf degrades below 60fps with that count, virtualize off-viewport elements.
- **Canvas size:** Fixed-size canvas (default 1200×800), not infinite. User can resize the canvas in page settings. Scrolls if content exceeds viewport.

---

## 10. Component Palette

Left sidebar, organized into categories:

### Text (4 items)
- Heading (defaults to `h1`, semantic-toggle to h2/h3)
- Body
- Caption
- Code

### Structural (6 items)
- Nav
- Card
- Section
- Button
- Input
- Modal frame

Each rendered as an ASCII-bordered box with editable label inside.

### ASCII (3 items)
- Pasted ASCII (opens textarea modal, pastes content)
- Converted from image (opens converter modal — see §11)
- From library (opens library picker — see §12)

### Decorative (2 items)
- Divider (horizontal line, picks pattern)
- Sprite (opens library picker filtered to sprites)

Drag from palette onto canvas. Drop position determines initial position.

---

## 11. Image-to-ASCII Converter

Modal opens when user picks "Converted from image" in the palette.

### UI

- File drop zone / click-to-upload
- Preview of source image (small)
- Live ASCII preview (monospace, theme-colored)
- Sliders / controls (deliberately fewer than the reference — limited options foster creativity):
  - **Width** (10–200 chars, default 80)
  - **Charset** (dropdown: Standard `' .:-=+*#%@'`, Dense `' ░▒▓█'`, Minimal `' .#'`, Custom)
  - **Brightness** (-100 to +100, default 0)
  - **Contrast** (-100 to +100, default 0)
  - **Invert** (toggle)
- "Place on canvas" button → inserts as `AsciiArtElement` with `source: 'converted'` and `conversionParams` preserved
- "Re-edit" available later by selecting the element and reopening the converter (uses preserved params)

### Algorithm (custom implementation)

```
1. Load image into hidden <canvas>
2. Resize to (width × computed_height) where computed_height = (image.h / image.w) * width * 0.5
   (the 0.5 accounts for monospace char being ~2x taller than wide)
3. Get pixel data
4. For each pixel:
   a. Compute grayscale brightness: 0.299*R + 0.587*G + 0.114*B
   b. Apply brightness/contrast adjustments
   c. If invert, brightness = 255 - brightness
   d. Map brightness (0-255) to charset index
5. Join chars with newlines
6. Return string
```

Implementation should be a single pure function: `convertImageToAscii(imageData: ImageData, params: ConversionParams): string`. Easy to test, easy to call from the editor.

### Source images

Processed entirely client-side. Never uploaded to Supabase. Discarded after conversion. If the user wants to re-convert with different params, they re-upload.

---

## 12. Built-in Graphics Library

28 starter assets, hard-coded as static data in the app.

### Borders (10)
Single, double, rounded, dashed, dotted, heavy, ASCII-`+`-style, ASCII-`*`-style, ANSI block, brutalist `#`. Each renders at any size by repeating the corner/edge characters.

### Dividers (6)
- `────────`
- `━━━━━━━━`
- `════════`
- `- - - - -`
- `· · · · ·`
- `~~~~~~~~`

### UI Frame Primitives (4)
Pre-styled bordered boxes for: Button, Input, Modal, Card. Each is a `StructuralElement` template with default size and label placeholder.

### Decorative Sprites (8)
- Arrow right `→` / left `←`
- Caret `>` `^`
- Asterisk cluster `*✱✦`
- Brackets `[ ]`
- Star `★`
- Pipe-art column `||||`
- Hash band `####`
- Dot grid `· · ·`

These are picked from a small library modal and inserted as `DecorativeElement`s with the chosen `builtinId`.

---

## 13. Design System

### Themes (5, mirrored from `catnap-rx`)

Each theme defines a 5-color palette: `bg`, `surface`, `text`, `text-muted`, `accent`.

| Theme | bg | surface | text | text-muted | accent |
|---|---|---|---|---|---|
| notebook | `#f5f1e8` | `#ffffff` | `#1a1a1a` | `#666666` | `#000000` |
| avocado | `#d4e3c0` | `#e8efd9` | `#2d3a1f` | `#5a6b46` | `#3d5a2a` |
| sakura | `#fce4ec` | `#fdeef3` | `#3a1f2e` | `#7a4a60` | `#d9869f` |
| blood-orange | `#ffb380` | `#ffd9b3` | `#2a0f00` | `#8a3a1a` | `#c91540` |
| blue-bird | `#bcd4e6` | `#d4e2ee` | `#3a2820` | `#7a5a48` | `#6e4030` |

(Fine-tune in implementation; these are starting values.)

### Color picker behavior

When editing an element's color:
1. Default view: 5 swatches from the active theme palette + 4 grayscale steps
2. "Custom" toggle reveals full HSL color picker (`react-colorful`)
3. Selected color is stored as hex regardless of source

### Fonts (5, all free, all web-loadable)

- **JetBrains Mono** — primary mono, modern dev aesthetic
- **IBM Plex Mono** — cleaner alt mono
- **Geist Mono** — modern minimalist
- **Fira Code** — has ligatures, good for code-heavy elements
- **VT323** — display font, retro CRT, ideal for big headings with vintage flavor

Load via `next/font/google` for performance.

### Default styling

- Default font: JetBrains Mono
- Default text color: theme `text`
- Default background: theme `bg`
- Default border style: `single`
- All UI chrome (toolbars, sidebars, modals) uses theme colors. Editor matches the user's chosen theme — the tool itself feels like the artifact it makes.

---

## 14. User Flows

### First-time user

1. Lands on marketing/login page (single page, simple)
2. Clicks "Sign in with GitHub" → OAuth → Supabase creates user
3. Redirected to dashboard (empty state with "Create your first page" CTA)
4. Clicks CTA → new page created, editor opens with empty canvas

### Returning user

1. Lands on app, auto-redirected to dashboard
2. Sees list of pages, clicks one to edit
3. Edits, autosaves
4. Closes tab — state preserved server-side

### Export

1. User clicks "Export" in editor toolbar
2. Modal: shows preview of exported markdown
3. "Download .md" button triggers browser download
4. Filename: `{slugified-title}.md`

### Import

1. User clicks "Import" on dashboard
2. Picks a `.md` file (must have valid `spec_version` frontmatter)
3. New page created from spec, editor opens

---

## 15. Authentication

- **Primary:** GitHub OAuth via Supabase Auth
- **Backup:** Magic link (passwordless email) via Supabase Auth
- **No password-based auth** in v1
- All routes except `/`, `/login`, `/auth/callback` require auth (Next.js middleware)
- Server components fetch user via Supabase server client; redirect unauthenticated users to `/login`

---

## 16. Saving

- **Autosave:** Debounced 1500ms after last edit. POST/PATCH to Supabase.
- **Indicator:** Top bar shows "saved", "saving…", or "unsaved changes" (with retry button) based on state.
- **Manual save:** `Cmd/Ctrl+S` triggers immediate save (skips debounce).
- **Conflict handling:** Optimistic. Last write wins. Versioning is v2.

---

## 17. Undo / Redo

- **Scope:** Session-history. Stack lives in Zustand store, lost on reload.
- **Depth:** Last 100 actions.
- **Granularity:** One action = one user-meaningful change. Dragging an element is one action (committed on drop, not on every mouse move). Typing in a text element batches characters at ~500ms idle before committing.
- **Shortcuts:** `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` redo.

---

## 18. Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Save | `Cmd/Ctrl+S` |
| Undo | `Cmd/Ctrl+Z` |
| Redo | `Cmd/Ctrl+Shift+Z` |
| Delete selected | `Delete` / `Backspace` |
| Duplicate selected | `Cmd/Ctrl+D` |
| Select all | `Cmd/Ctrl+A` |
| Deselect | `Esc` |
| Nudge selected | Arrow keys (1px) |
| Nudge selected (large) | `Shift` + Arrow keys (grid unit) |
| Bring to front | `Cmd/Ctrl+]` |
| Send to back | `Cmd/Ctrl+[` |
| Toggle grid | `G` |
| Disable snap (hold) | `Alt` while dragging |
| Open palette search | `/` |

---

## 19. Page Management

Dashboard route: `/dashboard`

UI:
- Header with logo, theme toggle, user menu (logout)
- "New page" button (primary CTA)
- "Import .md" button (secondary)
- List of pages, sorted by `updated_at` desc
- Each row: title, last-edited timestamp, first-line preview, hover actions (open, rename, duplicate, delete)
- Delete confirms with modal

Empty state: "No pages yet. Create your first one or import a markdown file."

---

## 20. Suggested File Structure

```
/app
  /(marketing)
    page.tsx                    # landing
  /(auth)
    /login
      page.tsx
    /auth/callback
      route.ts                  # OAuth + magic link callback
  /(app)
    /dashboard
      page.tsx                  # page list
    /editor
      /[pageId]
        page.tsx                # editor host
  layout.tsx
  globals.css

/components
  /editor
    Canvas.tsx
    Element.tsx                 # renders one element by type
    Palette.tsx                 # left sidebar
    Inspector.tsx               # right sidebar
    Toolbar.tsx                 # top bar
    Grid.tsx                    # the visible grid overlay
    SelectionBox.tsx
    /elements                   # one component per element type
      TextElement.tsx
      AsciiArtElement.tsx
      DividerElement.tsx
      DecorativeElement.tsx
      StructuralElement.tsx
  /converter
    ConverterModal.tsx
    convert.ts                  # the pure conversion fn
  /library
    LibraryPicker.tsx
    assets.ts                   # the 28 hardcoded assets
  /color
    ColorPicker.tsx
  /shared
    Button.tsx, Modal.tsx, etc.

/lib
  /supabase
    client.ts                   # browser client
    server.ts                   # server client
    middleware.ts
  /spec
    types.ts                    # PageSpec + Element types
    validate.ts                 # zod schemas
    export.ts                   # spec → markdown
    import.ts                   # markdown → spec
    bodyRenderer.ts             # spec → markdown body
  /store
    editorStore.ts              # Zustand store for current page
    historyStore.ts             # undo/redo stack
  /themes
    themes.ts                   # 5 theme definitions

/middleware.ts                  # auth gate

/public
  /fonts                        # if self-hosting any
```

---

## 21. Build Phases (suggested order for Claude Code)

Build incrementally. Each phase should be runnable / testable before moving to the next.

### Phase 1: Foundation
- [x] Next.js app scaffolding, Tailwind, TypeScript strict
- [x] Supabase project setup, schema migration, RLS policies
- [x] Auth: GitHub OAuth + magic link, login page, middleware, callback route
- [x] Basic dashboard route (empty state only)
- [x] Empty editor route
- [x] Theme system (5 themes, CSS variables, theme picker in user menu)

### Phase 2: Spec & Persistence
- [x] Define `PageSpec` types and zod schemas
- [x] Editor Zustand store
- [x] Create / read / update / delete pages in Supabase
- [x] Page list on dashboard
- [x] Autosave with debounce + indicator

### Phase 3: Canvas & Elements
- [x] Canvas component with absolute-positioning render
- [x] One element type at a time, starting with TextElement
- [x] Selection (single, multi, box)
- [x] Drag with snap-to-grid
- [x] Resize handles
- [x] Add remaining element types
- [x] Z-index layering

### Phase 4: Palette & Library
- [x] Component palette sidebar
- [ ] Drag from palette to canvas
- [x] 28 built-in graphics, library picker
- [ ] Property inspector (right sidebar) — edit selected element's properties

### Phase 5: Converter
- [ ] Image-to-ASCII algorithm (pure fn, with tests)
- [ ] Converter modal UI with sliders
- [ ] Insert converted ASCII as element, preserve params for re-edit

### Phase 6: Export / Import
- [ ] Spec → markdown serializer (frontmatter + body)
- [ ] Markdown → spec parser
- [ ] Export button + download
- [ ] Import button + upload

### Phase 7: Polish
- [ ] Undo / redo stack
- [ ] Keyboard shortcuts
- [ ] Color picker (theme + custom escape hatch)
- [ ] Empty states, loading states, error states
- [ ] Visual grid overlay (toggleable)
- [ ] Page rename / duplicate / delete

### Phase 8: Pre-launch
- [ ] Accessibility pass (focus states, keyboard nav)
- [ ] Performance pass (test 200-element page)
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge — modern only)
- [ ] Deploy to Vercel
- [ ] Hook up production Supabase

---

## 22. Open Questions for Future Refinement

These don't block v1 but should be revisited:

- Should `StructuralElement` allow nested children in v2? (Currently flat.)
- Should there be a built-in code-block element type with syntax-highlighted ASCII rendering?
- Should the editor expose a "Copy spec to clipboard" action for fast LLM handoff without exporting a file?
- How should very-large pasted ASCII (>10k chars) be handled in the editor for performance?
- Should there be a `private/public` flag on pages with public meaning "anyone with the link can view"? (v2.)
- Should imported markdown files that lack `spec_version` frontmatter be importable as a single body-text element, as a graceful fallback?

---

## 23. Definition of Done for v1

- A user can sign in with GitHub
- A user can create a page, drag a heading + body text + ASCII art onto the canvas, save, close the tab, return, and find their page intact
- A user can convert an uploaded image to ASCII and place it on the canvas
- A user can export their page as a `.md` file
- A user can import a previously-exported `.md` file and continue editing
- All theme + font combinations render correctly
- The page list works for at least 100 pages without UI degradation
- A 200-element page edits at >30fps on a mid-range laptop
- Accessibility: all interactive elements are keyboard-reachable and have appropriate ARIA labels