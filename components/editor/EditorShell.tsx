'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useEditorStore } from '@/lib/store/editorStore';
import { Palette } from './Palette';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import type { PaletteItemDef } from '@/lib/library/assets';

const SIDEBAR_HEADER: React.CSSProperties = {
  padding: '4px 8px',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 9,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '1px solid var(--muted)',
  userSelect: 'none',
  flexShrink: 0,
};

export function EditorShell() {
  const page = useEditorStore((s) => s.page);
  const addElement = useEditorStore((s) => s.addElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const selectElement = useEditorStore((s) => s.selectElement);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      const activeId = String(active.id);

      if (activeId.startsWith('palette-')) {
        // ── Palette drop: create a new element at the drop position ──────────
        if (!over || over.id !== 'canvas' || !page) return;

        const data = active.data.current as
          | { source?: string; itemDef?: PaletteItemDef }
          | undefined;
        const itemDef = data?.itemDef;
        if (!itemDef) return;

        const translatedRect = active.rect.current.translated;
        if (!translatedRect) return;

        const { grid, width, height } = page.spec.page.canvas;

        // Both rects are in viewport coordinates → subtraction gives canvas-local position.
        const rawX = translatedRect.left - over.rect.left;
        const rawY = translatedRect.top - over.rect.top;

        const snappedX = Math.max(0, Math.min(Math.round(rawX / grid) * grid, width - 8));
        const snappedY = Math.max(0, Math.min(Math.round(rawY / grid) * grid, height - 8));

        const elements = page.spec.page.elements;
        const maxZ = elements.length > 0 ? Math.max(...elements.map((e) => e.z)) : 0;

        const newEl = itemDef.createElement({ x: snappedX, y: snappedY }, maxZ + 1);
        addElement(newEl);
        selectElement(newEl.id, false);
      } else {
        // ── Existing element move ─────────────────────────────────────────────
        const elements = page?.spec.page.elements ?? [];
        const el = elements.find((e) => e.id === activeId);
        if (!el || !page) return;

        const { grid, width, height } = page.spec.page.canvas;

        const rawX = el.position.x + delta.x;
        const rawY = el.position.y + delta.y;

        updateElement(activeId, {
          position: {
            x: Math.max(0, Math.min(Math.round(rawX / grid) * grid, width - el.size.w)),
            y: Math.max(0, Math.min(Math.round(rawY / grid) * grid, height - el.size.h)),
          },
        });
      }
    },
    [page, addElement, updateElement, selectElement],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 flex" style={{ minHeight: 0 }}>
        {/* Left: Palette */}
        <aside className="w-48 border-r border-muted bg-surface shrink-0 flex flex-col">
          <div style={SIDEBAR_HEADER}>Palette</div>
          <Palette />
        </aside>

        {/* Center: Canvas */}
        <Canvas />

        {/* Right: Inspector */}
        <aside className="w-52 border-l border-muted bg-surface shrink-0 flex flex-col">
          <div style={SIDEBAR_HEADER}>Inspector</div>
          <Inspector />
        </aside>
      </div>
    </DndContext>
  );
}
