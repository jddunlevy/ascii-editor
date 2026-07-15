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
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const removeElements = useEditorStore((s) => s.removeElements);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const nudgeElements = useEditorStore((s) => s.nudgeElements);
  const bringToFront = useEditorStore((s) => s.bringToFront);
  const sendToBack = useEditorStore((s) => s.sendToBack);
  const copyElements = useEditorStore((s) => s.copyElements);
  const pasteElements = useEditorStore((s) => s.pasteElements);

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

      const ctrl = e.metaKey || e.ctrlKey;

      // ── Ctrl / Cmd shortcuts ──────────────────────────────────────────────
      if (ctrl) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
          return;
        }
        if (e.key === 'a' && !inInput) {
          e.preventDefault();
          const all = page?.spec.page.elements.map((el) => el.id) ?? [];
          setSelectedIds(all);
          return;
        }
        if (e.key === 'd' && !inInput) {
          e.preventDefault();
          if (selectedIds.length > 0 && page) {
            duplicateElements(selectedIds, page.spec.page.canvas.grid);
          }
          return;
        }
        if (e.key === 'c' && !inInput && selectedIds.length > 0) {
          copyElements(selectedIds);
          return;
        }
        if (e.key === 'v' && !inInput) {
          e.preventDefault();
          pasteElements(page?.spec.page.canvas.grid ?? 8);
          return;
        }
        if (e.key === ']' && !inInput) {
          e.preventDefault();
          if (selectedIds.length > 0) bringToFront(selectedIds);
          return;
        }
        if (e.key === '[' && !inInput) {
          e.preventDefault();
          if (selectedIds.length > 0) sendToBack(selectedIds);
          return;
        }
        return; // let other Ctrl shortcuts (Ctrl+S) pass through
      }

      // ── Single-key shortcuts (not in inputs) ──────────────────────────────
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

      // ── Arrow key nudge ───────────────────────────────────────────────────
      if (
        !inInput &&
        selectedIds.length > 0 &&
        page &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        e.preventDefault();
        const { grid, width, height } = page.spec.page.canvas;
        const step = e.shiftKey ? grid : 1;
        const dx =
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy =
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        nudgeElements(selectedIds, dx, dy, width, height);
      }
    },
    [
      selectedIds,
      page,
      deselectAll,
      setSelectedIds,
      removeElements,
      toggleGrid,
      undo,
      redo,
      duplicateElements,
      nudgeElements,
      bringToFront,
      sendToBack,
      copyElements,
      pasteElements,
    ],
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
          background: canvas.background ?? 'var(--surface)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          ...gridBg,
        }}
      >
        {sortedElements.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 12,
                color: 'var(--muted)',
                opacity: 0.5,
              }}
            >
              ← drag elements from the palette to get started
            </span>
          </div>
        )}
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
