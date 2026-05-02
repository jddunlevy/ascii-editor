interface EditorPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { pageId } = await params;

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor toolbar stub */}
      <div className="border-b border-muted bg-surface px-4 h-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs select-none">←</span>
          <span className="text-ink text-xs">Untitled</span>
          <span className="text-muted text-xs">─</span>
          <span className="text-muted text-xs">saved</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="border border-muted text-muted text-xs px-3 py-1 cursor-not-allowed opacity-60"
          >
            Export .md
          </button>
        </div>
      </div>

      {/* Editor area stub */}
      <div className="flex-1 flex">
        {/* Left palette stub */}
        <aside className="w-48 border-r border-muted bg-surface shrink-0 flex flex-col">
          <div className="px-3 py-2 border-b border-muted">
            <p className="text-muted text-xs">Palette</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted text-xs text-center px-3">
              Components coming in Phase 4
            </p>
          </div>
        </aside>

        {/* Canvas area */}
        <div className="flex-1 bg-theme relative overflow-auto flex items-center justify-center">
          <div className="text-center">
            <pre className="text-muted text-xs leading-tight mb-4 select-none">
              {`┌─────────────────────────────────────────┐
│                                         │
│              empty canvas               │
│          page id: ${pageId.slice(0, 12).padEnd(12)}          │
│                                         │
└─────────────────────────────────────────┘`}
            </pre>
            <p className="text-muted text-xs">
              Canvas + drag-and-drop coming in Phase 3
            </p>
          </div>
        </div>

        {/* Right inspector stub */}
        <aside className="w-52 border-l border-muted bg-surface shrink-0 flex flex-col">
          <div className="px-3 py-2 border-b border-muted">
            <p className="text-muted text-xs">Inspector</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted text-xs text-center px-3">
              Select an element to inspect
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
