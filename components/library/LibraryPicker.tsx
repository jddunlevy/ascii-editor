'use client';

import { useState } from 'react';
import {
  ALL_LIBRARY_ASSETS,
  LIBRARY_BORDERS,
  LIBRARY_DIVIDERS,
  LIBRARY_UI_FRAMES,
  LIBRARY_SPRITES,
  type LibraryAsset,
} from '@/lib/library/assets';

type Category = 'all' | 'border' | 'divider' | 'ui-frame' | 'sprite';

const TABS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'border', label: 'Borders' },
  { id: 'divider', label: 'Dividers' },
  { id: 'ui-frame', label: 'UI Frames' },
  { id: 'sprite', label: 'Sprites' },
];

interface LibraryPickerProps {
  /** Restrict to specific categories. If omitted, all are shown. */
  filter?: LibraryAsset['category'][];
  onSelect: (asset: LibraryAsset) => void;
  onClose: () => void;
}

export function LibraryPicker({ filter, onSelect, onClose }: LibraryPickerProps) {
  const availableTabs = filter
    ? TABS.filter((t) => t.id === 'all' || filter.includes(t.id as LibraryAsset['category']))
    : TABS;

  const [activeTab, setActiveTab] = useState<Category>(availableTabs[0]?.id ?? 'all');

  const assets =
    activeTab === 'all'
      ? filter
        ? ALL_LIBRARY_ASSETS.filter((a) => filter.includes(a.category))
        : ALL_LIBRARY_ASSETS
      : ALL_LIBRARY_ASSETS.filter((a) => a.category === activeTab);

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--muted)',
          width: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid var(--muted)',
          }}
        >
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>
            Library
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--muted)', flexShrink: 0 }}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset grid */}
        <div
          style={{
            overflowY: 'auto',
            padding: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => {
                onSelect(asset);
                onClose();
              }}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--muted)',
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)';
              }}
            >
              <pre
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10,
                  color: 'var(--text)',
                  margin: 0,
                  lineHeight: 1.3,
                  whiteSpace: 'pre',
                }}
              >
                {asset.preview}
              </pre>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10,
                  color: 'var(--muted)',
                }}
              >
                {asset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
