import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createPage, deletePage } from '../actions';
import type { PageListRow } from '@/lib/spec/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from('pages')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .returns<PageListRow[]>();

  const hasPages = pages && pages.length > 0;

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12">
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
          <form action={createPage}>
            <button
              type="submit"
              className="border border-accent text-ink text-xs px-3 py-1.5 hover:bg-accent hover:text-[var(--bg)] transition-colors"
            >
              + New page
            </button>
          </form>
        </div>
      </div>

      {hasPages ? (
        <ul className="w-full max-w-2xl divide-y divide-muted border border-muted">
          {pages.map((page) => (
            <li key={page.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors group">
              <Link
                href={`/editor/${page.id}`}
                className="flex-1 min-w-0 mr-4"
              >
                <span className="text-ink text-sm block truncate">
                  {page.title || 'Untitled'}
                </span>
                <span className="text-muted text-xs">
                  {timeAgo(page.updated_at)}
                </span>
              </Link>
              <form action={deletePage.bind(null, page.id)}>
                <button
                  type="submit"
                  className="text-muted text-xs opacity-0 group-hover:opacity-100 hover:text-ink transition-opacity px-2 py-1"
                  title="Delete page"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        /* Empty state */
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
            <form action={createPage}>
              <button
                type="submit"
                className="border border-accent text-ink text-xs px-4 py-2 hover:bg-accent hover:text-[var(--bg)] transition-colors"
              >
                + New page
              </button>
            </form>
            <button
              disabled
              className="border border-muted text-muted text-xs px-4 py-2 cursor-not-allowed opacity-50"
            >
              Import .md
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
