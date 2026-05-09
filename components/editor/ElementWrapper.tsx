'use client';

import { useState, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useEditorStore, type ElementChanges } from '@/lib/store/editorStore';
import { ElementRenderer } from './ElementRenderer';
import { measureAsciiContent, getCharWidthRatio, ASCII_LINE_HEIGHT } from '@/lib/spec/ascii';
import type { Element } from '@/lib/spec/types';

// Handle positions as [xFraction, yFraction]
const HANDLE_POSITIONS: [number, number][] = [
  [0, 0],   // nw
  [0.5, 0], // n
  [1, 0],   // ne
  [1, 0.5], // e
  [1, 1],   // se
  [0.5, 1], // s
  [0, 1],   // sw
  [0, 0.5], // w
];

// [movesX, movesY, affectsWidth, affectsHeight]
// movesX: position changes on x-axis (left handles)
// movesY: position changes on y-axis (top handles)
// affectsWidth: width changes
// affectsHeight: height changes
const HANDLE_AXES: [boolean, boolean, boolean, boolean][] = [
  [true, true, true, true],    // nw
  [false, true, false, true],  // n
  [false, true, true, true],   // ne
  [false, false, true, false], // e
  [false, false, true, true],  // se
  [false, false, false, true], // s
  [true, false, true, true],   // sw
  [true, false, true, false],  // w
];

interface ElementWrapperProps {
  element: Element;
  grid: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function ElementWrapper({
  element,
  grid,
  canvasWidth,
  canvasHeight,
}: ElementWrapperProps) {
  const isSelected = useEditorStore((s) => s.selectedIds.includes(element.id));
  const selectElement = useEditorStore((s) => s.selectElement);
  const updateElement = useEditorStore((s) => s.updateElement);

  const [isEditing, setIsEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: element.id,
      disabled: isEditing || element.locked,
    });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        selectElement(element.id, e.shiftKey);
      }
    },
    [isEditing, selectElement, element.id],
  );

  const translateX = transform?.x ?? 0;
  const translateY = transform?.y ?? 0;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    width: element.size.w,
    height: element.size.h,
    zIndex: isDragging ? 9999 : element.z,
    transform: `translate(${translateX}px, ${translateY}px)`,
    outline: isSelected ? '1px dashed var(--accent)' : '1px solid transparent',
    cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
    boxSizing: 'border-box',
    userSelect: isEditing ? 'text' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...(isEditing ? {} : { ...listeners, ...attributes })}
    >
      <ElementRenderer
        element={element}
        isEditing={isEditing}
        onStartEdit={() => setIsEditing(true)}
        onEndEdit={() => setIsEditing(false)}
      />

      {isSelected && !isDragging && !isEditing && (
        <ResizeHandles
          element={element}
          grid={grid}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          updateElement={updateElement}
        />
      )}
    </div>
  );
}

// ─── Resize handles ───────────────────────────────────────────────────────────

interface ResizeHandlesProps {
  element: Element;
  grid: number;
  canvasWidth: number;
  canvasHeight: number;
  updateElement: (id: string, changes: ElementChanges) => void;
}

function ResizeHandles({
  element,
  grid,
  canvasWidth,
  canvasHeight,
  updateElement,
}: ResizeHandlesProps) {
  const minSize = grid * 2;

  const startRef = useRef<{
    mouseX: number;
    mouseY: number;
    posX: number;
    posY: number;
    w: number;
    h: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (handleIndex: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      startRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: element.position.x,
        posY: element.position.y,
        w: element.size.w,
        h: element.size.h,
      };

      const [movesX, movesY, affectsW, affectsH] = HANDLE_AXES[handleIndex];

      const onMouseMove = (me: MouseEvent) => {
        if (!startRef.current) return;
        const { mouseX, mouseY, posX, posY, w, h } = startRef.current;

        const dx = me.clientX - mouseX;
        const dy = me.clientY - mouseY;

        let newX = posX;
        let newY = posY;
        let newW = w;
        let newH = h;

        // ── ASCII art: aspect-locked resize driven by fontSize ──────────────
        if (element.type === 'ascii_art') {
          const { rows, cols } = measureAsciiContent(element.content);
          const ratio = getCharWidthRatio(element.font);

          // Drive from the axis that is being resized.
          // Corner handles affect W; N/S handles affect only H.
          let rawFontSize: number;
          if (affectsW) {
            const rawW = movesX ? w - dx : w + dx;
            rawFontSize = cols > 0 ? rawW / (cols * ratio) : 14;
          } else {
            const rawH = movesY ? h - dy : h + dy;
            rawFontSize = rows > 0 ? rawH / (rows * ASCII_LINE_HEIGHT) : 14;
          }

          const newFontSize = Math.max(4, Math.min(96, rawFontSize));
          newW = Math.max(1, Math.ceil(cols * newFontSize * ratio));
          newH = Math.max(1, Math.ceil(rows * newFontSize * ASCII_LINE_HEIGHT));

          // Keep the fixed edge stationary.
          if (movesX && affectsW) newX = posX + w - newW;
          if (movesY && affectsH) newY = posY + h - newH;

          // Clamp to canvas bounds.
          newX = Math.max(0, Math.min(newX, canvasWidth - newW));
          newY = Math.max(0, Math.min(newY, canvasHeight - newH));

          updateElement(element.id, {
            position: { x: newX, y: newY },
            size: { w: newW, h: newH },
            fontSize: newFontSize,
          });
          return;
        }

        // ── Standard resize (all other element types) ───────────────────────
        if (affectsW) {
          const rawW = movesX ? w - dx : w + dx;
          newW = Math.max(minSize, Math.round(rawW / grid) * grid);
        }
        if (affectsH) {
          const rawH = movesY ? h - dy : h + dy;
          newH = Math.max(minSize, Math.round(rawH / grid) * grid);
        }
        if (movesX && affectsW) {
          const rawX = posX + dx;
          newX = Math.round(rawX / grid) * grid;
          // Don't allow moving past right edge
          newX = Math.min(newX, posX + w - minSize);
          newX = Math.max(0, newX);
        }
        if (movesY && affectsH) {
          const rawY = posY + dy;
          newY = Math.round(rawY / grid) * grid;
          newY = Math.min(newY, posY + h - minSize);
          newY = Math.max(0, newY);
        }

        // Clamp to canvas bounds
        newW = Math.min(newW, canvasWidth - newX);
        newH = Math.min(newH, canvasHeight - newY);

        updateElement(element.id, {
          position: { x: newX, y: newY },
          size: { w: newW, h: newH },
        });
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        startRef.current = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [element, grid, canvasWidth, canvasHeight, minSize, updateElement],
  );

  return (
    <>
      {HANDLE_POSITIONS.map(([xFrac, yFrac], i) => (
        <div
          key={i}
          onMouseDown={handleMouseDown(i)}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            left: `calc(${xFrac * 100}% - 4px)`,
            top: `calc(${yFrac * 100}% - 4px)`,
            background: 'var(--bg)',
            border: '1px solid var(--accent)',
            cursor: getResizeCursor(i),
            zIndex: 10000,
            boxSizing: 'border-box',
          }}
        />
      ))}
    </>
  );
}

function getResizeCursor(handleIndex: number): string {
  const cursors = [
    'nw-resize',
    'n-resize',
    'ne-resize',
    'e-resize',
    'se-resize',
    's-resize',
    'sw-resize',
    'w-resize',
  ];
  return cursors[handleIndex];
}
