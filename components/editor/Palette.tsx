'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { nanoid } from 'nanoid';
import { useEditorStore } from '@/lib/store/editorStore';
import { LibraryPicker } from '@/components/library/LibraryPicker';
import {
  PALETTE_ITEMS,
  type PaletteItemDef,
  type LibraryAsset,
} from '@/lib/library/assets';
import { fitAsciiToViewport } from '@/lib/spec/ascii';

type Modal = 'paste' | 'library-ascii' | 'library-sprite' | null;

export function Palette() {
  const page = useEditorStore((s) => s.page);
  const addElement = useEditorStore((s) => s.addElement);
  const selectElement = useEditorStore((s) => s.selectElement);

  const openConverter = useEditorStore((s) => s.openConverter);

  const [modal, setModal] = useState<Modal>(null);
  const [pasteContent, setPasteContent] = useState('');

  const elements = page?.spec.page.elements ?? [];
  const maxZ = elements.length > 0 ? Math.max(...elements.map((e) => e.z)) : 0;
  const defaultPos = { x: 64, y: 64 };

  function insertAsset(asset: LibraryAsset) {
    const el = asset.createElement(defaultPos, maxZ + 1);
    if (el.type === 'ascii_art') {
      const canvas = page?.spec.page.canvas;
      const viewport = canvas ? { w: canvas.width, h: canvas.height } : { w: 1200, h: 800 };
      const { fontSize, w, h } = fitAsciiToViewport(el.content, el.font, viewport);
      addElement({ ...el, fontSize, size: { w, h } });
    } else {
      addElement(el);
    }
    selectElement(el.id, false);
  }

  function commitPaste() {
    if (!pasteContent.trim()) return;
    const canvas = page?.spec.page.canvas;
    const viewport = canvas ? { w: canvas.width, h: canvas.height } : { w: 1200, h: 800 };
    const font = 'jetbrains-mono' as const;
    const { fontSize, w, h } = fitAsciiToViewport(pasteContent, font, viewport);
    const el = {
      id: nanoid(),
      type: 'ascii_art' as const,
      source: 'pasted' as const,
      content: pasteContent,
      font,
      fontSize,
      color: '#1a1a1a',
      position: defaultPos,
      size: { w, h },
      z: maxZ + 1,
    };
    addElement(el);
    selectElement(el.id, false);
    setPasteContent('');
    setModal(null);
  }

  const textItems = PALETTE_ITEMS.filter((i) => i.category === 'text');
  const structItems = PALETTE_ITEMS.filter((i) => i.category === 'structural');
  const decorItems = PALETTE_ITEMS.filter((i) => i.category === 'decorative');

  return (
    <>
      <div style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
        <Section label="Text">
          {textItems.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </Section>

        <Section label="Structural">
          {structItems.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </Section>

        <Section label="ASCII">
          <ActionButton label="Paste ASCII" preview="```" onClick={() => setModal('paste')} />
          <ActionButton
            label="Convert image"
            preview="⊙"
            onClick={() => openConverter(null)}
          />
          <ActionButton
            label="From library"
            preview="▣"
            onClick={() => setModal('library-ascii')}
          />
        </Section>

        <Section label="Decorative">
          {decorItems.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
          <ActionButton
            label="Sprite library"
            preview="★"
            onClick={() => setModal('library-sprite')}
          />
        </Section>
      </div>

      {/* Paste ASCII modal */}
      {modal === 'paste' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--muted)',
              width: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>
                Paste ASCII art
              </span>
              <button
                onClick={() => setModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
              >
                ✕
              </button>
            </div>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your ASCII art here…"
              autoFocus
              style={{
                width: '100%',
                height: 240,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                padding: 12,
                background: 'var(--bg)',
                color: 'var(--text)',
                border: 'none',
                borderBottom: '1px solid var(--muted)',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  padding: '4px 10px',
                  background: 'none',
                  border: '1px solid var(--muted)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={commitPaste}
                disabled={!pasteContent.trim()}
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  padding: '4px 10px',
                  background: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  color: 'var(--surface)',
                  cursor: pasteContent.trim() ? 'pointer' : 'not-allowed',
                  opacity: pasteContent.trim() ? 1 : 0.5,
                }}
              >
                Place on canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'library-ascii' && (
        <LibraryPicker
          filter={['border', 'divider', 'ui-frame']}
          onSelect={insertAsset}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'library-sprite' && (
        <LibraryPicker
          filter={['sprite']}
          onSelect={insertAsset}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          padding: '4px 8px',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          userSelect: 'none',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Draggable palette item ────────────────────────────────────────────────────

function DraggableItem({ item }: { item: PaletteItemDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { source: 'palette', itemDef: item },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: 'var(--muted)',
          width: 28,
          flexShrink: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {item.preview}
      </span>
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11,
          color: 'var(--text)',
        }}
      >
        {item.label}
      </span>
    </div>
  );
}

// ─── Action button (opens modal) ──────────────────────────────────────────────

function ActionButton({
  label,
  preview,
  onClick,
  disabled,
  title,
}: {
  label: string;
  preview: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: 'var(--muted)',
          width: 28,
          flexShrink: 0,
        }}
      >
        {preview}
      </span>
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11,
          color: 'var(--text)',
        }}
      >
        {label}
      </span>
    </button>
  );
}
