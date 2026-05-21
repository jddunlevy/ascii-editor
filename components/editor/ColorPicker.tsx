'use client';

import { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { themeTokens, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/themes/themes';
import type { ThemeName } from '@/lib/themes/themes';

const GRAYSCALE = ['#ffffff', '#999999', '#444444', '#000000'];

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace' };

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [showWheel, setShowWheel] = useState(false);
  const [draft, setDraft] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Track the active theme to show relevant swatches
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME);
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    if (stored && stored in themeTokens) setThemeName(stored);
  }, []);

  // Keep draft in sync with external value changes
  useEffect(() => setDraft(value), [value]);

  // Close popover on outside click
  useEffect(() => {
    if (!showWheel) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowWheel(false);
      }
    }
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [showWheel]);

  const tokens = themeTokens[themeName];
  const themeSwatches = [
    tokens.bg,
    tokens.surface,
    tokens.text,
    tokens.muted,
    tokens.accent,
  ];

  const labelSt: React.CSSProperties = {
    ...MONO,
    fontSize: 10,
    color: 'var(--muted)',
    flexShrink: 0,
    width: 38,
  };

  function commitDraft() {
    const trimmed = draft.trim();
    // Accept bare hex like "ff0000" → "#ff0000"
    const normalized =
      /^[0-9a-fA-F]{3,8}$/.test(trimmed) ? `#${trimmed}` : trimmed;
    onChange(normalized);
    setDraft(normalized);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Row: label + preview swatch + hex input + wheel toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={labelSt}>{label}</span>
        {/* Current color swatch */}
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
        {/* Hex text input */}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
          placeholder="#000000"
          style={{
            ...MONO,
            fontSize: 11,
            color: 'var(--text)',
            background: 'var(--bg)',
            border: '1px solid var(--muted)',
            padding: '1px 4px',
            outline: 'none',
            flex: 1,
            minWidth: 0,
          }}
        />
        {/* Toggle wheel */}
        <button
          onClick={() => setShowWheel((v) => !v)}
          title="Open color picker"
          style={{
            ...MONO,
            fontSize: 10,
            color: showWheel ? 'var(--text)' : 'var(--muted)',
            background: 'none',
            border: '1px solid var(--muted)',
            padding: '1px 4px',
            cursor: 'pointer',
            flexShrink: 0,
            lineHeight: 1.4,
          }}
        >
          ···
        </button>
      </div>

      {/* Swatch row: theme colors + grayscale */}
      <div style={{ display: 'flex', gap: 3, paddingLeft: 42 }}>
        {[...themeSwatches, ...GRAYSCALE].map((hex, i) => (
          <button
            key={i}
            title={hex}
            onClick={() => { onChange(hex); setDraft(hex); }}
            style={{
              width: 14,
              height: 14,
              background: hex,
              border: value === hex ? '2px solid var(--text)' : '1px solid var(--muted)',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* react-colorful wheel popover */}
      {showWheel && (
        <div
          ref={popoverRef}
          style={{
            paddingLeft: 42,
            paddingTop: 4,
          }}
        >
          <HexColorPicker
            color={value.startsWith('#') ? value : '#000000'}
            onChange={(hex) => { onChange(hex); setDraft(hex); }}
            style={{ width: '100%', height: 120 }}
          />
        </div>
      )}
    </div>
  );
}
