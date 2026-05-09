'use client';

import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useEditorStore, type EditorPage } from '@/lib/store/editorStore';
import { savePage } from '@/app/(app)/actions';

interface EditorProviderProps {
  initialPage: EditorPage;
  children: React.ReactNode;
}

export function EditorProvider({ initialPage, children }: EditorProviderProps) {
  const setPage = useEditorStore((s) => s.setPage);
  const clearPage = useEditorStore((s) => s.clearPage);

  useEffect(() => {
    setPage(initialPage);
    return () => clearPage();
    // Re-initialize only when the page ID changes (navigating to a different page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage.id]);

  return (
    <>
      <AutosaveManager />
      {children}
    </>
  );
}

// ─── Autosave ─────────────────────────────────────────────────────────────────

function AutosaveManager() {
  const page = useEditorStore((s) => s.page);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);

  const setSaveStatusRef = useRef(setSaveStatus);
  setSaveStatusRef.current = setSaveStatus;

  // Track the last page object we attempted to save. After a failed save, the
  // effect would otherwise re-fire immediately (saveStatus flips back to
  // 'unsaved'), creating an infinite retry loop. By comparing references we
  // skip the retry unless the user has made a new change (which produces a new
  // page object via Zustand's immutable updates).
  const lastAttemptedRef = useRef<EditorPage | null>(null);

  const debouncedSave = useRef(
    debounce(async (pageToSave: EditorPage) => {
      lastAttemptedRef.current = pageToSave;
      setSaveStatusRef.current('saving');
      try {
        const result = await savePage(pageToSave.id, pageToSave.title, pageToSave.spec);
        if (result !== null) {
          console.error('[autosave] failed:', result.error);
          setSaveStatusRef.current('unsaved');
        } else {
          setSaveStatusRef.current('saved');
        }
      } catch (err) {
        console.error('[autosave] threw:', err);
        setSaveStatusRef.current('unsaved');
      }
    }, 1500),
  );

  // Cancel debounce on unmount
  useEffect(() => {
    const fn = debouncedSave.current;
    return () => fn.cancel();
  }, []);

  // Trigger save whenever the page state changes to 'unsaved', but only if
  // the page object is different from the last one we attempted (to prevent
  // retrying a save that just failed for the same content).
  useEffect(() => {
    if (saveStatus === 'unsaved' && page && lastAttemptedRef.current !== page) {
      debouncedSave.current(page);
    }
  }, [saveStatus, page]);

  // Manual save on Cmd/Ctrl+S
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (saveStatus === 'unsaved' && page) {
          debouncedSave.current.flush();
        }
      }
    },
    [saveStatus, page],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
