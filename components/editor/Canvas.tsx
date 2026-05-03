'use client';

import { useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditorStore } from '@/lib/store/editorStore';
import { ElementWrapper } from './ElementWrapper';

export function Canvas() {
  const page = useEditorStore((s) => s.page);
  const gridVisible = useEditorStore((s) => s.gridVisible);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const deselectAll = useEditorStore((s) => s.deselectAll);
  const removeElements = useEditorStore((s) => s.removeElements);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);

  // Register the canvas div as a dnd-kit drop target.
  // EditorShell's handleDragEnd uses over.rect to compute drop coordinates.
  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'canvas' });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'g' || e.key === 'G') {
        if (!inInput) {
          e.preventDefault();
          toggleGrid();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!inInput && selectedIds.length > 0) {
          e.preventDefault();
          removeElements(selectedIds);
        }
      } else if (e.key === 'Escape') {
        deselectAll();
      }
    },
    [selectedIds, deselectAll, removeElements, toggleGrid],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!page) return null;

  const { canvas, elements } = page.spec.page;
  const { width, height, grid } = canvas;

  const sortedElements = [...elements].sort((a, b) => a.z - b.z);

  const gridBg = gridVisible
    ? {
        backgroundImage: [
          `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          `linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: `${grid}px ${grid}px`,
      }
    : {};

  return (
    <div
      className="flex-1 bg-theme overflow-auto"
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32 }}
    >
      <div
        ref={setCanvasRef}
        onClick={() => deselectAll()}
        style={{
          position: 'relative',
          width,
          height,
          flexShrink: 0,
          background: 'var(--surface)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          ...gridBg,
        }}
      >
        {sortedElements.map((el) => (
          <ElementWrapper
            key={el.id}
            element={el}
            grid={grid}
            canvasWidth={width}
            canvasHeight={height}
          />
        ))}
      </div>
    </div>
  );
}
