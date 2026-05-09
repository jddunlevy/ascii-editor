'use client';

import { useRef, useState, useTransition } from 'react';
import { importPage } from '@/app/(app)/actions';

interface Props {
  className?: string;
}

export function ImportButton({ className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    startTransition(async () => {
      const result = await importPage(text);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileRef}
        type="file"
        accept=".md,text/markdown"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => { setError(null); fileRef.current?.click(); }}
        disabled={isPending}
        className={className}
        style={isPending ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
      >
        {isPending ? 'Importing…' : 'Import .md'}
      </button>
      {error && (
        <p
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 3,
            whiteSpace: 'nowrap',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            color: 'var(--accent)',
            zIndex: 10,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
