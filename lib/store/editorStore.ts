import { create } from 'zustand';
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

interface EditorState {
  page: EditorPage | null;
  saveStatus: SaveStatus;
  selectedIds: string[];
  gridVisible: boolean;

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

  // Spec mutations — used by canvas in Phase 3+
  addElement: (element: Element) => void;
  updateElement: (id: string, changes: ElementChanges) => void;
  removeElements: (ids: string[]) => void;
  setElements: (elements: Element[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  page: null,
  saveStatus: 'saved',
  selectedIds: [],
  gridVisible: true,

  setPage: (page) => set({ page, saveStatus: 'saved', selectedIds: [] }),

  clearPage: () => set({ page: null, saveStatus: 'saved', selectedIds: [] }),

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

  addElement: (element) =>
    set((state) => {
      if (!state.page) return state;
      return {
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: [...state.page.spec.page.elements, element],
            },
          },
        },
        saveStatus: 'unsaved',
      };
    }),

  updateElement: (id, changes) =>
    set((state) => {
      if (!state.page) return state;
      return {
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: state.page.spec.page.elements.map((el) =>
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
      return {
        page: {
          ...state.page,
          spec: {
            ...state.page.spec,
            page: {
              ...state.page.spec.page,
              elements: state.page.spec.page.elements.filter(
                (el) => !idSet.has(el.id),
              ),
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
      return {
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
}));
