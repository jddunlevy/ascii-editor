'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { exportToMarkdown, slugifyTitle } from '@/lib/spec/export';
import { exportToHtml } from '@/lib/spec/exportHtml';

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };

type Tab = 'md' | 'html';

interface Props {
  onClose: () => void;
}

export function ExportModal({ onClose }: Props) {
  const page = useEditorStore((s) => s.page);
  const [tab, setTab] = useState<Tab>('md');
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!page) return;
    setMarkdown(exportToMarkdown(page.spec));
    setHtml(exportToHtml(page.spec));
  }, [page]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = tab === 'md' ? markdown : html;

  const download = useCallback(() => {
    if (!page || !content) return;
    const slug = slugifyTitle(page.title);
    const ext = tab === 'md' ? 'md' : 'html';
    const mime = tab === 'md' ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [page, content, tab]);

  const tabBtn = (t: Tab, label: string): React.CSSProperties => ({
    ...MONO,
    fontSize: 11,
    padding: '3px 10px',
    cursor: 'pointer',
    border: '1px solid var(--muted)',
    borderRight: t === 'md' ? 'none' : '1px solid var(--muted)',
    background: tab === t ? 'var(--accent)' : 'none',
    color: tab === t ? 'var(--surface)' : 'var(--muted)',
  });

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
          <div style={{ display: 'flex' }}>
            <button style={tabBtn('md', '.md')} onClick={() => setTab('md')}>.md</button>
            <button style={tabBtn('html', '.html')} onClick={() => setTab('html')}>.html</button>
          </div>
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

        {/* Preview */}
        <textarea
          readOnly
          value={content}
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
            Download .{tab === 'md' ? 'md' : 'html'}
          </button>
        </div>
      </div>
    </div>
  );
}
