'use client';

import { useEffect, useRef, useState } from 'react';
import {
  THEMES,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  themeTokens,
  type ThemeName,
} from '@/lib/themes/themes';

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeName>('notebook');
  const ref = useRef<HTMLDivElement>(null);

  // Read theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      if (stored && THEMES.includes(stored as ThemeName)) {
        setCurrent(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function applyTheme(name: ThemeName) {
    document.documentElement.setAttribute('data-theme', name);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
      // ignore
    }
    setCurrent(name);
    setOpen(false);
  }

  const tokens = themeTokens[current];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors px-2 py-1.5 border border-transparent hover:border-muted"
        aria-label="Change theme"
        aria-expanded={open}
      >
        {/* Current theme swatch */}
        <span
          className="inline-block w-3 h-3 border border-muted"
          style={{ backgroundColor: tokens.bg }}
        />
        <span>{THEME_LABELS[current]}</span>
        <span className="text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-muted z-50 min-w-[160px]">
          {THEMES.map((name) => {
            const t = themeTokens[name];
            return (
              <button
                key={name}
                onClick={() => applyTheme(name)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-[var(--bg)] transition-colors text-left"
              >
                {/* Palette preview: 3 color dots */}
                <span className="flex gap-0.5">
                  <span
                    className="inline-block w-2.5 h-2.5 border border-[rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: t.bg }}
                  />
                  <span
                    className="inline-block w-2.5 h-2.5 border border-[rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: t.text }}
                  />
                  <span
                    className="inline-block w-2.5 h-2.5 border border-[rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: t.accent }}
                  />
                </span>
                <span>{THEME_LABELS[name]}</span>
                {name === current && (
                  <span className="ml-auto text-muted">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
