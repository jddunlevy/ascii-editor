'use client';

import { useState, useEffect } from 'react';
import { useEditorStore, type ElementChanges } from '@/lib/store/editorStore';
import { computeAsciiBox } from '@/lib/spec/ascii';
import type {
  Element,
  TextElement,
  AsciiArtElement,
  DividerElement,
  DecorativeElement,
  StructuralElement,
  FontName,
  Align,
} from '@/lib/spec/types';

// ─── Style constants ──────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };

const labelSt: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  color: 'var(--muted)',
  flexShrink: 0,
  width: 38,
};

const inputSt: React.CSSProperties = {
  ...MONO,
  fontSize: 11,
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--muted)',
  padding: '1px 4px',
  outline: 'none',
  minWidth: 0,
};

// ─── Font options ─────────────────────────────────────────────────────────────

const FONT_OPTIONS: { value: FontName; label: string }[] = [
  { value: 'jetbrains-mono', label: 'JetBrains Mono' },
  { value: 'ibm-plex-mono', label: 'IBM Plex Mono' },
  { value: 'geist-mono', label: 'Geist Mono' },
  { value: 'fira-code', label: 'Fira Code' },
  { value: 'vt323', label: 'VT323' },
];

// ─── Shared field components ──────────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>;
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const n = Number(draft);
    if (Number.isFinite(n)) {
      const clamped = min !== undefined ? Math.max(min, Math.round(n)) : Math.round(n);
      onChange(max !== undefined ? Math.min(max, clamped) : clamped);
    } else {
      setDraft(String(value));
    }
  }

  return (
    <Row>
      <span style={labelSt}>{label}</span>
      <input
        type="number"
        value={draft}
        min={min}
        max={max}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        style={{ ...inputSt, width: 54 }}
      />
    </Row>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  mono?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <Row>
      <span style={labelSt}>{label}</span>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft)}
        onKeyDown={(e) => e.key === 'Enter' && onChange(draft)}
        disabled={disabled}
        style={{
          ...inputSt,
          flex: 1,
          fontFamily: mono ? 'ui-monospace, monospace' : 'ui-monospace, monospace',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </Row>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <Row>
      <span style={labelSt}>{label}</span>
      <span
        style={{
          width: 14,
          height: 14,
          background: value,
          border: '1px solid var(--muted)',
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft)}
        onKeyDown={(e) => e.key === 'Enter' && onChange(draft)}
        placeholder="#000000"
        style={{ ...inputSt, flex: 1 }}
      />
    </Row>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div>
      <div style={{ ...labelSt, marginBottom: 3, width: 'auto' }}>{label}</div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft)}
        disabled={disabled}
        rows={4}
        style={{
          ...inputSt,
          width: '100%',
          resize: 'vertical',
          boxSizing: 'border-box',
          display: 'block',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Row>
      <span style={labelSt}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{ ...inputSt, flex: 1 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
}

function AlignInput({ value, onChange }: { value: Align; onChange: (v: Align) => void }) {
  const opts: { v: Align; ch: string; title: string }[] = [
    { v: 'left', ch: '←', title: 'Left' },
    { v: 'center', ch: '↔', title: 'Center' },
    { v: 'right', ch: '→', title: 'Right' },
  ];
  return (
    <Row>
      <span style={labelSt}>Align</span>
      <div style={{ display: 'flex' }}>
        {opts.map(({ v, ch, title }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            title={title}
            style={{
              ...MONO,
              fontSize: 11,
              padding: '1px 8px',
              background: value === v ? 'var(--accent)' : 'var(--bg)',
              color: value === v ? 'var(--surface)' : 'var(--muted)',
              border: '1px solid var(--muted)',
              borderRight: v !== 'right' ? 'none' : '1px solid var(--muted)',
              cursor: 'pointer',
            }}
          >
            {ch}
          </button>
        ))}
      </div>
    </Row>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...MONO,
        fontSize: 9,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '10px 8px 4px',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export function Inspector() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const page = useEditorStore((s) => s.page);
  const updateElement = useEditorStore((s) => s.updateElement);
  const openConverter = useEditorStore((s) => s.openConverter);

  const elements = page?.spec.page.elements ?? [];
  const selected = elements.filter((e) => selectedIds.includes(e.id));

  if (selected.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <p
          style={{
            ...MONO,
            fontSize: 11,
            color: 'var(--muted)',
            textAlign: 'center',
            lineHeight: 1.7,
          }}
        >
          Select an element{'\n'}to inspect
        </p>
      </div>
    );
  }

  if (selected.length > 1) {
    return (
      <MultiPane
        key={selectedIds.join(',')}
        elements={selected}
        updateElement={updateElement}
      />
    );
  }

  return (
    <SinglePane
      key={selected[0].id}
      element={selected[0]}
      updateElement={updateElement}
      openConverter={openConverter}
    />
  );
}

// ─── Single element ───────────────────────────────────────────────────────────

function SinglePane({
  element,
  updateElement,
  openConverter,
}: {
  element: Element;
  updateElement: (id: string, changes: ElementChanges) => void;
  openConverter: (targetId: string | null) => void;
}) {
  const upd = (changes: ElementChanges) => updateElement(element.id, changes);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
      {/* Type badge */}
      <div style={{ padding: '6px 8px 4px' }}>
        <span
          style={{
            ...MONO,
            fontSize: 9,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'var(--bg)',
            padding: '2px 6px',
            border: '1px solid var(--muted)',
          }}
        >
          {element.type.replace('_', ' ')}
        </span>
      </div>

      {/* Position & Size */}
      <SectionHead>Position & Size</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <NumberInput
            label="X"
            value={element.position.x}
            min={0}
            onChange={(v) => upd({ position: { ...element.position, x: v } })}
          />
          <NumberInput
            label="Y"
            value={element.position.y}
            min={0}
            onChange={(v) => upd({ position: { ...element.position, y: v } })}
          />
          <NumberInput
            label="W"
            value={element.size.w}
            min={8}
            onChange={(v) => upd({ size: { ...element.size, w: v } })}
          />
          <NumberInput
            label="H"
            value={element.size.h}
            min={8}
            onChange={(v) => upd({ size: { ...element.size, h: v } })}
          />
        </div>
        <NumberInput label="Z" value={element.z} onChange={(v) => upd({ z: v })} />
      </div>

      {/* Type-specific properties */}
      {element.type === 'text' && <TextPane el={element} upd={upd} />}
      {element.type === 'ascii_art' && <AsciiPane el={element} upd={upd} openConverter={openConverter} />}
      {element.type === 'divider' && <DividerPane el={element} upd={upd} />}
      {element.type === 'decorative' && <DecorativePane el={element} upd={upd} />}
      {element.type === 'structural' && <StructuralPane el={element} upd={upd} />}
    </div>
  );
}

// ─── Multi-select ─────────────────────────────────────────────────────────────

function MultiPane({
  elements,
  updateElement,
}: {
  elements: Element[];
  updateElement: (id: string, changes: ElementChanges) => void;
}) {
  const minZ = Math.min(...elements.map((e) => e.z));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
      <div style={{ padding: '6px 8px 4px' }}>
        <span style={{ ...MONO, fontSize: 11, color: 'var(--text)' }}>
          {elements.length} elements selected
        </span>
      </div>
      <SectionHead>Layer</SectionHead>
      <div style={{ padding: '0 8px' }}>
        <NumberInput
          label="Z"
          value={minZ}
          onChange={(v) => elements.forEach((el) => updateElement(el.id, { z: v }))}
        />
      </div>
    </div>
  );
}

// ─── Type-specific panes ──────────────────────────────────────────────────────

type Upd = (changes: ElementChanges) => void;

function TextPane({ el, upd }: { el: TextElement; upd: Upd }) {
  return (
    <>
      <SectionHead>Text</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SelectInput
          label="Type"
          value={el.semantic}
          options={[
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' },
            { value: 'body', label: 'Body' },
            { value: 'caption', label: 'Caption' },
            { value: 'code', label: 'Code' },
            { value: 'label', label: 'Label' },
          ]}
          onChange={(v) => upd({ semantic: v })}
        />
        <SelectInput
          label="Font"
          value={el.font}
          options={FONT_OPTIONS}
          onChange={(v) => upd({ font: v })}
        />
        <NumberInput
          label="Size"
          value={el.fontSize}
          min={8}
          onChange={(v) => upd({ fontSize: v })}
        />
        <ColorInput label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
        <AlignInput value={el.align} onChange={(v) => upd({ align: v })} />
        <TextareaInput
          label="Content"
          value={el.content}
          onChange={(v) => upd({ content: v })}
        />
      </div>
    </>
  );
}

function AsciiPane({
  el,
  upd,
  openConverter,
}: {
  el: AsciiArtElement;
  upd: Upd;
  openConverter: (targetId: string | null) => void;
}) {
  const editable = el.source === 'pasted';

  return (
    <>
      <SectionHead>ASCII Art</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SelectInput
          label="Font"
          value={el.font}
          options={FONT_OPTIONS}
          onChange={(v) => upd({ font: v })}
        />
        <NumberInput
          label="Scale"
          value={Math.round(el.fontSize)}
          min={4}
          max={96}
          onChange={(v) => {
            const { w, h } = computeAsciiBox(el.content, v, el.font);
            upd({ fontSize: v, size: { w, h } });
          }}
        />
        <ColorInput label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
        <TextareaInput
          label="Content"
          value={el.content}
          onChange={(v) => upd({ content: v })}
          disabled={!editable}
        />
        {el.source === 'converted' && (
          <button
            onClick={() => openConverter(el.id)}
            style={{
              ...MONO,
              fontSize: 10,
              padding: '3px 8px',
              background: 'none',
              border: '1px solid var(--muted)',
              color: 'var(--muted)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            ⊙ Re-edit conversion
          </button>
        )}
        {el.source === 'builtin' && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--muted)' }}>Built-in asset</p>
        )}
      </div>
    </>
  );
}

function DividerPane({ el, upd }: { el: DividerElement; upd: Upd }) {
  return (
    <>
      <SectionHead>Divider</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TextInput
          label="Pattern"
          value={el.pattern}
          onChange={(v) => upd({ pattern: v })}
          mono
        />
        <ColorInput label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
      </div>
    </>
  );
}

function DecorativePane({ el, upd }: { el: DecorativeElement; upd: Upd }) {
  return (
    <>
      <SectionHead>Decorative</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TextInput label="ID" value={el.builtinId} onChange={() => {}} disabled />
        <ColorInput label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
      </div>
    </>
  );
}

function StructuralPane({ el, upd }: { el: StructuralElement; upd: Upd }) {
  return (
    <>
      <SectionHead>Structural</SectionHead>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SelectInput
          label="Type"
          value={el.semantic}
          options={[
            { value: 'nav', label: 'Nav' },
            { value: 'card', label: 'Card' },
            { value: 'section', label: 'Section' },
            { value: 'button', label: 'Button' },
            { value: 'input', label: 'Input' },
            { value: 'modal', label: 'Modal' },
          ]}
          onChange={(v) => upd({ semantic: v })}
        />
        <SelectInput
          label="Border"
          value={el.borderStyle}
          options={[
            { value: 'single', label: 'Single' },
            { value: 'double', label: 'Double' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'none', label: 'None' },
          ]}
          onChange={(v) => upd({ borderStyle: v })}
        />
        <TextInput
          label="Label"
          value={el.label ?? ''}
          onChange={(v) => upd({ label: v || undefined })}
        />
      </div>
    </>
  );
}
