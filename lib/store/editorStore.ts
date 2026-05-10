import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  PageSpec,
  Element,
  TextElement,
  AsciiArtElement,
  DividerElement,
  DecorativeElement,
  StructuralElement,
} from '@/lib/spec/types';

export type ElementChanges =
  | Partial<TextElement>
  | Partial<AsciiArtElement>
  | Partial<DividerElement>
  | Partial<DecorativeElement>
  | Partial<StructuralElement>;

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface EditorPage {
  id: string;
  title: string;
  spec: PageSpec;
}

const HISTORY_LIMIT = 100;

interface EditorState {
  page: EditorPage | null;
  saveStatus: SaveStatus;
  selectedIds: string[];
  gridVisible: boolean;
  converterOpen: boolean;
  converterTargetId: string | null; // null = new element, string = re-edit element id

  // Undo / redo history (session-only, lost on reload)
  past: Element[][];
  future: Element[][];

  // Page-level actions
  setPage: (page: EditorPage) => void;
  clearPage: () => void;
  updateTitle: (title: string) => void;
  setSaveStatus: (status: SaveStatus) => void;

  // Selection actions
  selectElement: (id: string, additive: boolean) => void;
  deselectAll: () => void;
  setSelectedIds: (ids: string[]) => void;
  toggleGrid: () => void;

  // Converter modal
  openConverter: (targetId: string | null) => void;
  closeConverter: () => void;

  // Undo / redo
  undo: () => void;
  redo: () => void;

  // Spec mutations — used by canvas in Phase 3+
  addElement: (element: Element) => void;
  updateElement: (id: string, changes: ElementChanges) => void;
  removeElements: (ids: string[]) => void;
  setElements: (elements: Element[]) => void;

  // Compound element actions
  duplicateElements: (ids: string[], gridUnit: number) => void;
  nudgeElements: (ids: string[], dx: number, dy: number, canvasW: number, canvasH: number) => void;
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
}

function pushHistory(past: Element[][], current: Element[]): Element[][] {
  const next = [...past, current];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  page: null,
  saveStatus: 'saved',
  selectedIds: [],
  gridVisible: true,
  converterOpen: false,
  converterTargetId: null,
  past: [],
  future: [],

  setPage: (page) => set({ page, saveStatus: 'saved', selectedIds: [], past: [], future: [] }),

  clearPage: () => set({ page: null, saveStatus: 'saved', selectedIds: [], past: [], future: [] }),

  updateTitle: (title) =>
    set((state) => {
      if (!state.page) return state;
      return {
        page: {
          ...state.page,
          title,
          spec: {
            ...state.page.spec,
            page: { ...state.page.spec.page, title },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  selectElement: (id, additive) =>
    set((state) => {
      if (additive) {
        const already = state.selectedIds.includes(id);
        return {
          selectedIds: already
            ? state.selectedIds.filter((x) => x !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    }),

  deselectAll: () => set({ selectedIds: [] }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),

  openConverter: (targetId) => set({ converterOpen: true, converterTargetId: targetId }),
  closeConverter: () => set({ converterOpen: false, converterTargetId: null }),

  undo: () =>
    set((state) => {
      if (!state.page || state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const current = state.page.spec.page.elements;
      return {
        past: newPast,
        future: [current, ...state.future],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: { ...state.page.spec.page, elements: previous },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.page || state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: newFuture,
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: { ...state.page.spec.page, elements: next },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  addElement: (element) =>
    set((state) => {
      if (!state.page) return state;
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: [...current, element],
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  updateElement: (id, changes) =>
    set((state) => {
      if (!state.page) return state;
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: current.map((el) =>
                el.id === id ? ({ ...el, ...changes } as Element) : el,
              ),
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  removeElements: (ids) =>
    set((state) => {
      if (!state.page) return state;
      const idSet = new Set(ids);
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: current.filter((el) => !idSet.has(el.id)),
            },
          },
        },
        selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
        saveStatus: 'unsaved',
      };
    }),

  setElements: (elements) =>
    set((state) => {
      if (!state.page) return state;
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: { ...state.page.spec.page, elements },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  duplicateElements: (ids, gridUnit) =>
    set((state) => {
      if (!state.page || ids.length === 0) return state;
      const current = state.page.spec.page.elements;
      const idSet = new Set(ids);
      const maxZ = current.length > 0 ? Math.max(...current.map((e) => e.z)) : 0;
      let zOffset = 1;
      const copies: Element[] = [];
      current.forEach((el) => {
        if (idSet.has(el.id)) {
          copies.push({
            ...el,
            id: nanoid(),
            position: { x: el.position.x + gridUnit, y: el.position.y + gridUnit },
            z: maxZ + zOffset++,
          } as Element);
        }
      });
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: { ...state.page.spec.page, elements: [...current, ...copies] },
          },
        },
        selectedIds: copies.map((c) => c.id),
        saveStatus: 'unsaved',
      };
    }),

  nudgeElements: (ids, dx, dy, canvasW, canvasH) =>
    set((state) => {
      if (!state.page || ids.length === 0) return state;
      const idSet = new Set(ids);
      const current = state.page.spec.page.elements;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: current.map((el) => {
                if (!idSet.has(el.id)) return el;
                return {
                  ...el,
                  position: {
                    x: Math.max(0, Math.min(el.position.x + dx, canvasW - el.size.w)),
                    y: Math.max(0, Math.min(el.position.y + dy, canvasH - el.size.h)),
                  },
                };
              }),
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  bringToFront: (ids) =>
    set((state) => {
      if (!state.page || ids.length === 0) return state;
      const idSet = new Set(ids);
      const current = state.page.spec.page.elements;
      const maxZ = current.length > 0 ? Math.max(...current.map((e) => e.z)) : 0;
      let zOffset = 1;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: current.map((el) =>
                idSet.has(el.id) ? { ...el, z: maxZ + zOffset++ } : el,
              ),
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  sendToBack: (ids) =>
    set((state) => {
      if (!state.page || ids.length === 0) return state;
      const idSet = new Set(ids);
      const current = state.page.spec.page.elements;
      const minZ = current.length > 0 ? Math.min(...current.map((e) => e.z)) : 0;
      let zOffset = 1;
      return {
        past: pushHistory(state.past, current),
        future: [],
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: current.map((el) =>
                idSet.has(el.id) ? { ...el, z: minZ - zOffset++ } : el,
              ),
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),
}));
