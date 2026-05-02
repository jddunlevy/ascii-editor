import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Header row */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <h2 className="text-ink text-sm font-medium">Pages</h2>
        <div className="flex gap-2">
          {/* Import button — wired up in Phase 6 */}
          <button
            disabled
            className="border border-muted text-muted text-xs px-3 py-1.5 cursor-not-allowed opacity-60"
            title="Coming in a later phase"
          >
            Import .md
          </button>
          {/* New page button — wired up in Phase 2 */}
          <button
            disabled
            className="border border-accent text-ink text-xs px-3 py-1.5 cursor-not-allowed opacity-60"
            title="Coming in a later phase"
          >
            + New page
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="w-full max-w-2xl flex flex-col items-center py-20 border border-muted">
        <pre className="text-muted text-xs leading-tight mb-6 select-none text-center">
          {`┌───────────────────┐
│                   │
│   no pages yet    │
│                   │
└───────────────────┘`}
        </pre>
        <p className="text-ink text-sm mb-2">No pages yet.</p>
        <p className="text-muted text-xs mb-8">
          Create your first page or import a{' '}
          <code className="text-ink">.md</code> file.
        </p>
        <div className="flex gap-3">
          <Link
            href="#"
            className="border border-accent text-ink text-xs px-4 py-2 hover:bg-accent hover:text-[var(--bg)] transition-colors opacity-50 pointer-events-none"
          >
            + New page
          </Link>
          <Link
            href="#"
            className="border border-muted text-muted text-xs px-4 py-2 hover:border-accent hover:text-ink transition-colors opacity-50 pointer-events-none"
          >
            Import .md
          </Link>
        </div>
        <p className="text-muted text-xs mt-8 text-center">
          (Page management coming in Phase 2)
        </p>
      </div>
    </div>
  );
}
