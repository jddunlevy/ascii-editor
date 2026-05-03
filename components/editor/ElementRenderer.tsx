'use client';

import { useRef, useState } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { SPRITE_CONTENT } from '@/lib/library/assets';
import type {
  Element,
  TextElement,
  AsciiArtElement,
  DividerElement,
  DecorativeElement,
  StructuralElement,
  FontName,
  BorderStyle,
} from '@/lib/spec/types';

const FONT_FAMILY: Record<FontName, string> = {
  'jetbrains-mono': 'var(--font-jetbrains-mono), ui-monospace, monospace',
  'ibm-plex-mono': 'var(--font-ibm-plex-mono), ui-monospace, monospace',
  'geist-mono': 'var(--font-geist-mono), ui-monospace, monospace',
  'fira-code': 'var(--font-fira-code), ui-monospace, monospace',
  vt323: 'var(--font-vt323), ui-monospace, monospace',
};

const BORDER_CSS: Record<BorderStyle, string> = {
  single: '1px solid',
  double: '3px double',
  dashed: '1px dashed',
  none: 'none',
};

interface ElementRendererProps {
  element: Element;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

export function ElementRenderer({
  element,
  isEditing,
  onStartEdit,
  onEndEdit,
}: ElementRendererProps) {
  switch (element.type) {
    case 'text':
      return (
        <TextRenderer
          element={element}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
        />
      );
    case 'ascii_art':
      return <AsciiArtRenderer element={element} />;
    case 'divider':
      return <DividerRenderer element={element} />;
    case 'decorative':
      return <DecorativeRenderer element={element} />;
    case 'structural':
      return <StructuralRenderer element={element} />;
  }
}

// ─── Text ─────────────────────────────────────────────────────────────────────

function TextRenderer({
  element,
  isEditing,
  onStartEdit,
  onEndEdit,
}: {
  element: TextElement;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const [draft, setDraft] = useState(element.content);
  const originalRef = useRef(element.content);

  const sharedStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILY[element.font],
    fontSize: element.fontSize,
    color: element.color,
    textAlign: element.align,
    width: '100%',
    height: '100%',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.4,
  };

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          updateElement(element.id, { content: draft });
          onEndEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(originalRef.current);
            onEndEdit();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            updateElement(element.id, { content: draft });
            onEndEdit();
          }
        }}
        style={{
          ...sharedStyle,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: 0,
          margin: 0,
          display: 'block',
        }}
      />
    );
  }

  return (
    <div
      style={sharedStyle}
      onDoubleClick={(e) => {
        e.stopPropagation();
        originalRef.current = element.content;
        setDraft(element.content);
        onStartEdit();
      }}
    >
      {element.content || <span style={{ opacity: 0.3 }}>Double-click to edit</span>}
    </div>
  );
}

// ─── ASCII Art ────────────────────────────────────────────────────────────────

function AsciiArtRenderer({ element }: { element: AsciiArtElement }) {
  return (
    <pre
      style={{
        fontFamily: FONT_FAMILY[element.font],
        fontSize: element.fontSize,
        color: element.color,
        whiteSpace: 'pre',
        lineHeight: 1.2,
        overflow: 'hidden',
        margin: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {element.content}
    </pre>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function DividerRenderer({ element }: { element: DividerElement }) {
  const repeatCount = Math.ceil(element.size.w / 8);
  const text = element.pattern.repeat(repeatCount);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        color: element.color,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
}

// ─── Decorative ───────────────────────────────────────────────────────────────

function DecorativeRenderer({ element }: { element: DecorativeElement }) {
  const content = SPRITE_CONTENT[element.builtinId] ?? element.builtinId;
  return (
    <pre
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace',
        color: element.color,
        fontSize: 13,
        margin: 0,
        whiteSpace: 'pre',
        lineHeight: 1.3,
      }}
    >
      {content}
    </pre>
  );
}

// ─── Structural ───────────────────────────────────────────────────────────────

function StructuralRenderer({ element }: { element: StructuralElement }) {
  const borderValue = BORDER_CSS[element.borderStyle];
  const color = 'var(--text)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: borderValue === 'none' ? 'none' : `${borderValue} ${color}`,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 4,
          fontSize: 10,
          fontFamily: 'ui-monospace, monospace',
          color,
          opacity: 0.6,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {element.label ?? element.semantic}
      </span>
    </div>
  );
}
