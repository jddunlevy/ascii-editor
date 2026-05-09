'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useEditorStore, type SaveStatus } from '@/lib/store/editorStore';
import { ExportModal } from './ExportModal';

export function EditorToolbar() {
  const title = useEditorStore((s) => s.page?.title ?? 'Untitled');
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const updateTitle = useEditorStore((s) => s.updateTitle);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [exportOpen, setExportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync with store title when not editing
  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  function startEdit() {
    setDraft(title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const trimmed = draft.trim() || 'Untitled';
    setDraft(trimmed);
    setEditing(false);
    if (trimmed !== title) updateTitle(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setDraft(title);
      setEditing(false);
    }
  }

  return (
    <div className="border-b border-muted bg-surface px-4 h-11 flex items-center justify-between shrink-0">
      {/* Left: back + title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="text-muted text-xs hover:text-ink transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          ←
        </Link>

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-ink text-sm border-b border-accent focus:outline-none min-w-0 w-48"
            maxLength={120}
            autoFocus
          />
        ) : (
          <button
            onClick={startEdit}
            className="text-ink text-sm hover:text-accent transition-colors truncate max-w-xs text-left"
            title="Click to rename"
          >
            {title}
          </button>
        )}

        <SaveIndicator status={saveStatus} />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setExportOpen(true)}
          className="border border-muted text-muted text-xs px-3 py-1 hover:text-ink hover:border-ink transition-colors"
        >
          Export .md
        </button>
      </div>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label: Record<SaveStatus, string> = {
    saved: 'saved',
    saving: 'saving…',
    unsaved: 'unsaved',
  };

  return (
    <span
      className="text-xs transition-colors shrink-0"
      style={{ color: status === 'unsaved' ? 'var(--accent)' : 'var(--muted)' }}
    >
      {label[status]}
    </span>
  );
}
