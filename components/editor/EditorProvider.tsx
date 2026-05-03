'use client';

import { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useEditorStore, type EditorPage } from '@/lib/store/editorStore';
import { createClient } from '@/lib/supabase/client';

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

  // Create the debounced save function once, capturing via refs
  const debouncedSave = useRef(
    debounce(async (pageToSave: EditorPage) => {
      setSaveStatusRef.current('saving');
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('pages')
          .update({
            title: pageToSave.title,
            spec: pageToSave.spec,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pageToSave.id);

        setSaveStatusRef.current(error ? 'unsaved' : 'saved');
      } catch {
        setSaveStatusRef.current('unsaved');
      }
    }, 1500),
  );

  // Cancel debounce on unmount
  useEffect(() => {
    const fn = debouncedSave.current;
    return () => fn.cancel();
  }, []);

  // Trigger save whenever the page becomes 'unsaved'
  useEffect(() => {
    if (saveStatus === 'unsaved' && page) {
      debouncedSave.current(page);
    }
  }, [saveStatus, page]);

  // Manual save on Cmd/Ctrl+S
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (saveStatus === 'unsaved' && page) {
          debouncedSave.current.cancel();
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
