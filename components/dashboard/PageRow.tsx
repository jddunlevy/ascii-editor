'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { renamePage, duplicatePage, deletePage } from '@/app/(app)/actions';
import type { PageListRow } from '@/lib/spec/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function PageRow({ page }: { page: PageListRow }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(page.title || 'Untitled');
  const inputRef = useRef<HTMLInputElement>(null);

  function startRename(e: React.MouseEvent) {
    e.preventDefault();
    setDraft(page.title || 'Untitled');
    setRenaming(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitRename() {
    const trimmed = draft.trim() || 'Untitled';
    setRenaming(false);
    if (trimmed !== (page.title || 'Untitled')) {
      await renamePage(page.id, trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenaming(false);
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors group">
      <div className="flex-1 min-w-0 mr-4">
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-ink text-sm border-b border-accent focus:outline-none w-full max-w-xs"
            maxLength={120}
            autoFocus
          />
        ) : (
          <Link href={`/editor/${page.id}`} className="block">
            <span className="text-ink text-sm block truncate">
              {page.title || 'Untitled'}
            </span>
          </Link>
        )}
        <span className="text-muted text-xs">{timeAgo(page.updated_at)}</span>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Rename */}
        <button
          onClick={startRename}
          className="text-muted text-xs hover:text-ink transition-colors px-2 py-1"
          title="Rename page"
        >
          ✎
        </button>
        {/* Duplicate */}
        <form action={duplicatePage.bind(null, page.id)}>
          <button
            type="submit"
            className="text-muted text-xs hover:text-ink transition-colors px-2 py-1"
            title="Duplicate page"
          >
            ⧉
          </button>
        </form>
        {/* Delete */}
        <form action={deletePage.bind(null, page.id)}>
          <button
            type="submit"
            className="text-muted text-xs hover:text-ink transition-colors px-2 py-1"
            title="Delete page"
          >
            ✕
          </button>
        </form>
      </div>
    </li>
  );
}
