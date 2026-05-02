import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-theme flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* ASCII decoration */}
        <pre className="text-muted text-xs leading-tight mb-8 select-none">
          {`┌─────────────────────────────────┐
│  ▓▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓  │
│  ▓▓  ▓▓     ▓▓     ▓▓  ▓▓ ▓▓  │
│  ▓▓  ▓▓▓▓▓  ▓▓     ▓▓▓▓▓  ▓▓  │
└─────────────────────────────────┘`}
        </pre>

        {/* Heading */}
        <h1 className="font-display text-7xl text-ink leading-none mb-3">
          ASCII Editor
        </h1>
        <p className="text-muted text-sm mb-2">
          Plan frontends in your terminal aesthetic.
        </p>
        <p className="text-muted text-sm mb-10">
          Commit markdown. Build later.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className="inline-block border border-accent text-ink text-sm px-6 py-2.5 hover:bg-accent hover:text-[var(--bg)] transition-colors"
        >
          [ Get started ]
        </Link>

        {/* Feature list */}
        <ul className="mt-12 space-y-2 text-muted text-xs">
          <li>▸ Drag-and-drop semantic blocks onto a free canvas</li>
          <li>▸ Convert images to ASCII with a built-in converter</li>
          <li>
            ▸ Export as a single <code className="text-ink">.md</code> file
          </li>
          <li>▸ Frontmatter spec Claude Code can read and build from</li>
        </ul>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-muted text-xs">
        <span className="select-none">─────────</span>
        {'  '}v1{'  '}
        <span className="select-none">─────────</span>
      </footer>
    </main>
  );
}
