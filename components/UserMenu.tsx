'use client';

import { useEffect, useRef, useState } from 'react';

interface UserMenuProps {
  email: string;
  onLogout: () => Promise<void>;
}

export function UserMenu({ email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  // Display: first part of email
  const handle = email.split('@')[0] ?? email;
  const initials = handle.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors px-2 py-1.5 border border-transparent hover:border-muted"
        aria-label="User menu"
        aria-expanded={open}
      >
        <span className="w-5 h-5 flex items-center justify-center bg-accent text-[var(--bg)] text-[10px] font-bold leading-none">
          {initials}
        </span>
        <span className="max-w-[120px] truncate">{handle}</span>
        <span className="text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-muted z-50 min-w-[160px]">
          <div className="px-3 py-2 border-b border-muted">
            <p className="text-xs text-muted truncate">{email}</p>
          </div>
          <form action={onLogout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-[var(--bg)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
