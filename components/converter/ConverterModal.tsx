'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useEditorStore } from '@/lib/store/editorStore';
import { convertImageToAscii, CHARSETS, type CharsetName } from './convert';
import type { AsciiArtElement, ConversionParams } from '@/lib/spec/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialElement?: AsciiArtElement; // present in re-edit mode
  onClose: () => void;
}

const DEFAULT_PARAMS: ConversionParams = {
  width: 80,
  charset: CHARSETS.standard,
  brightness: 0,
  contrast: 0,
  inverted: false,
};

const CHARSET_OPTIONS: { value: CharsetName; label: string }[] = [
  { value: 'standard', label: "Standard  ' .:-=+*#%@'" },
  { value: 'dense', label: 'Dense  ░▒▓█' },
  { value: 'minimal', label: "Minimal  ' .#'" },
];

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };

// ─── ConverterModal ───────────────────────────────────────────────────────────

export function ConverterModal({ initialElement, onClose }: Props) {
  const page = useEditorStore((s) => s.page);
  const addElement = useEditorStore((s) => s.addElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const selectElement = useEditorStore((s) => s.selectElement);

  const isReEdit = !!initialElement;

  // ── Conversion params ──────────────────────────────────────────────────────
  const [params, setParams] = useState<ConversionParams>(
    initialElement?.conversionParams ?? DEFAULT_PARAMS,
  );
  const [charsetKey, setCharsetKey] = useState<CharsetName | 'custom'>(() => {
    const stored = initialElement?.conversionParams?.charset;
    if (!stored) return 'standard';
    const match = (Object.entries(CHARSETS) as [CharsetName, string][]).find(
      ([, v]) => v === stored,
    );
    return match ? match[0] : 'custom';
  });
  const [customCharset, setCustomCharset] = useState(
    charsetKey === 'custom' ? (initialElement?.conversionParams?.charset ?? '') : '',
  );

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [asciiOutput, setAsciiOutput] = useState<string>(initialElement?.content ?? '');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image → ASCII conversion ───────────────────────────────────────────────
  const runConversion = useCallback(
    (src: string, p: ConversionParams) => {
      const img = new Image();
      img.onload = () => {
        const charWidth = Math.max(10, Math.min(200, p.width));
        const computedHeight = Math.round((img.naturalHeight / img.naturalWidth) * charWidth * 0.5);
        const canvas = document.createElement('canvas');
        canvas.width = charWidth;
        canvas.height = Math.max(1, computedHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, charWidth, computedHeight);
        const imageData = ctx.getImageData(0, 0, charWidth, computedHeight);
        setAsciiOutput(convertImageToAscii(imageData, p));
      };
      img.src = src;
    },
    [],
  );

  // Re-run conversion (debounced) when params or image change.
  useEffect(() => {
    if (!imageSrc) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runConversion(imageSrc, params), 150);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [imageSrc, params, runConversion]);

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
    };
    reader.readAsDataURL(file);
  }

  // ── Charset helper ─────────────────────────────────────────────────────────
  function applyCharsetKey(key: CharsetName | 'custom') {
    setCharsetKey(key);
    if (key !== 'custom') {
      setParams((p) => ({ ...p, charset: CHARSETS[key] }));
    } else {
      setParams((p) => ({ ...p, charset: customCharset }));
    }
  }

  // ── Place / update on canvas ───────────────────────────────────────────────
  function handlePlace() {
    if (!asciiOutput.trim()) return;

    const lines = asciiOutput.split('\n');
    const charW = Math.max(...lines.map((l) => l.length));
    const fontSize = 13;
    const charWidthPx = fontSize * 0.6;
    const lineHeightPx = fontSize * 1.4;
    const estimatedW = Math.round(charW * charWidthPx + 16);
    const estimatedH = Math.round(lines.length * lineHeightPx + 16);

    if (isReEdit && initialElement) {
      updateElement(initialElement.id, {
        content: asciiOutput,
        conversionParams: params,
        size: { w: estimatedW, h: estimatedH },
      });
      onClose();
      return;
    }

    const elements = page?.spec.page.elements ?? [];
    const maxZ = elements.length > 0 ? Math.max(...elements.map((e) => e.z)) : 0;

    const el: AsciiArtElement = {
      id: nanoid(),
      type: 'ascii_art',
      source: 'converted',
      content: asciiOutput,
      conversionParams: params,
      font: 'jetbrains-mono',
      fontSize,
      color: '#1a1a1a',
      position: { x: 64, y: 64 },
      size: { w: estimatedW, h: estimatedH },
      z: maxZ + 1,
    };

    addElement(el);
    selectElement(el.id, false);
    onClose();
  }

  // ── Drag-and-drop on drop zone ─────────────────────────────────────────────
  function handleDropzoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const canPlace = asciiOutput.trim().length > 0;
  const hasImage = imageSrc !== null;

  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--muted)',
          width: 680,
          maxHeight: '90vh',
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
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ ...MONO, fontSize: 11, color: 'var(--muted)' }}>
            {isReEdit ? 'Re-edit conversion' : 'Image to ASCII'}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', ...MONO, fontSize: 11 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: image upload + preview + controls */}
          <div
            style={{
              width: 240,
              borderRight: '1px solid var(--muted)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropzoneDrop}
              style={{
                margin: 12,
                height: 100,
                border: `1px dashed ${isDraggingOver ? 'var(--accent)' : 'var(--muted)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: isDraggingOver ? 'var(--bg)' : 'transparent',
                flexShrink: 0,
              }}
            >
              <span style={{ ...MONO, fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.8 }}>
                {hasImage ? '↑ Replace image' : 'Drop image\nor click to upload'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Source image preview */}
            {imageSrc && (
              <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Source"
                  style={{ width: '100%', maxHeight: 100, objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}

            {/* Controls */}
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Width */}
              <ControlRow label="Width">
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={params.width}
                  onChange={(e) => {
                    const v = Math.max(10, Math.min(200, Number(e.target.value)));
                    setParams((p) => ({ ...p, width: v }));
                  }}
                  style={{ ...MONO, fontSize: 11, width: 56, padding: '1px 4px', background: 'var(--bg)', border: '1px solid var(--muted)', color: 'var(--text)', outline: 'none' }}
                />
              </ControlRow>

              {/* Charset */}
              <ControlRow label="Charset">
                <select
                  value={charsetKey}
                  onChange={(e) => applyCharsetKey(e.target.value as CharsetName | 'custom')}
                  style={{ ...MONO, fontSize: 10, flex: 1, padding: '1px 4px', background: 'var(--bg)', border: '1px solid var(--muted)', color: 'var(--text)', outline: 'none' }}
                >
                  {CHARSET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </ControlRow>

              {charsetKey === 'custom' && (
                <ControlRow label="Chars">
                  <input
                    type="text"
                    value={customCharset}
                    onChange={(e) => {
                      setCustomCharset(e.target.value);
                      setParams((p) => ({ ...p, charset: e.target.value }));
                    }}
                    placeholder=" .#@"
                    style={{ ...MONO, fontSize: 11, flex: 1, padding: '1px 4px', background: 'var(--bg)', border: '1px solid var(--muted)', color: 'var(--text)', outline: 'none' }}
                  />
                </ControlRow>
              )}

              {/* Brightness */}
              <ControlRow label="Bright">
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={params.brightness}
                  onChange={(e) => setParams((p) => ({ ...p, brightness: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ ...MONO, fontSize: 10, color: 'var(--muted)', width: 28, textAlign: 'right' }}>
                  {params.brightness > 0 ? '+' : ''}{params.brightness}
                </span>
              </ControlRow>

              {/* Contrast */}
              <ControlRow label="Contrast">
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={params.contrast}
                  onChange={(e) => setParams((p) => ({ ...p, contrast: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ ...MONO, fontSize: 10, color: 'var(--muted)', width: 28, textAlign: 'right' }}>
                  {params.contrast > 0 ? '+' : ''}{params.contrast}
                </span>
              </ControlRow>

              {/* Invert */}
              <ControlRow label="Invert">
                <input
                  type="checkbox"
                  checked={params.inverted}
                  onChange={(e) => setParams((p) => ({ ...p, inverted: e.target.checked }))}
                />
              </ControlRow>
            </div>
          </div>

          {/* Right: ASCII preview */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12, background: 'var(--bg)' }}>
            {asciiOutput ? (
              <pre
                style={{
                  ...MONO,
                  fontSize: 7,
                  lineHeight: 1.2,
                  color: 'var(--text)',
                  margin: 0,
                  whiteSpace: 'pre',
                  userSelect: 'none',
                }}
              >
                {asciiOutput}
              </pre>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ ...MONO, fontSize: 11, color: 'var(--muted)' }}>
                  Upload an image to preview
                </span>
              </div>
            )}
          </div>
        </div>

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
            style={{ ...MONO, fontSize: 11, padding: '4px 10px', background: 'none', border: '1px solid var(--muted)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handlePlace}
            disabled={!canPlace}
            style={{
              ...MONO,
              fontSize: 11,
              padding: '4px 10px',
              background: 'var(--accent)',
              border: '1px solid var(--accent)',
              color: 'var(--surface)',
              cursor: canPlace ? 'pointer' : 'not-allowed',
              opacity: canPlace ? 1 : 0.5,
            }}
          >
            {isReEdit ? 'Update on canvas' : 'Place on canvas'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ControlRow ───────────────────────────────────────────────────────────────

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: 'var(--muted)',
          width: 46,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
