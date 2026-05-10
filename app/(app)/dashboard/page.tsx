import { createClient } from '@/lib/supabase/server';
import { createPage } from '../actions';
import { ImportButton } from '@/components/dashboard/ImportButton';
import { PageRow } from '@/components/dashboard/PageRow';
import type { PageListRow } from '@/lib/spec/types';

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
          <ImportButton className="border border-muted text-muted text-xs px-3 py-1.5 hover:text-ink hover:border-ink transition-colors" />
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
            <PageRow key={page.id} page={page} />
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
            <ImportButton className="border border-muted text-muted text-xs px-4 py-2 hover:text-ink hover:border-ink transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}
