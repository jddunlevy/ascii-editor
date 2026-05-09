'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { exportToMarkdown, slugifyTitle } from '@/lib/spec/export';

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };

interface Props {
  onClose: () => void;
}

export function ExportModal({ onClose }: Props) {
  const page = useEditorStore((s) => s.page);
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    if (page) setMarkdown(exportToMarkdown(page.spec));
  }, [page]);

  const download = useCallback(() => {
    if (!page) return;
    const slug = slugifyTitle(page.title);
    const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [page, markdown]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--muted)',
          width: 660,
          maxWidth: '90vw',
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ ...MONO, fontSize: 11, color: 'var(--muted)' }}>Export .md</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              ...MONO,
              fontSize: 11,
            }}
          >
            ✕
          </button>
        </div>

        {/* Markdown preview */}
        <textarea
          readOnly
          value={markdown}
          style={{
            ...MONO,
            flex: 1,
            fontSize: 10,
            lineHeight: 1.5,
            padding: '12px 14px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: 'none',
            outline: 'none',
            resize: 'none',
            minHeight: 0,
          }}
        />

        {/* Footer */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--muted)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              ...MONO,
              fontSize: 11,
              padding: '4px 10px',
              background: 'none',
              border: '1px solid var(--muted)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={download}
            style={{
              ...MONO,
              fontSize: 11,
              padding: '4px 10px',
              background: 'var(--accent)',
              border: '1px solid var(--accent)',
              color: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            Download .md
          </button>
        </div>
      </div>
    </div>
  );
}
