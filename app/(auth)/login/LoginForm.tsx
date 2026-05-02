'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  async function handleGitHub() {
    setGithubLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Navigation handled by Supabase redirect; loading stays true
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }

    setEmailLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setEmailLoading(false);

    if (error) {
      setEmailError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  return (
    <main className="min-h-screen bg-theme flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/"
          className="text-muted text-xs hover:text-ink transition-colors mb-8 inline-block"
        >
          ← ASCII Editor
        </Link>

        {/* Card */}
        <div className="border border-muted bg-surface p-8">
          <h1 className="font-display text-4xl text-ink mb-1">Sign in</h1>
          <p className="text-muted text-xs mb-8">No password required.</p>

          {/* Error banner */}
          {errorParam && (
            <div className="border border-accent text-ink text-xs p-3 mb-6">
              Authentication failed. Please try again.
            </div>
          )}

          {/* GitHub */}
          <button
            onClick={handleGitHub}
            disabled={githubLoading}
            className="w-full border border-accent bg-accent text-[var(--bg)] text-sm py-2.5 px-4 hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {githubLoading ? (
              <span className="text-xs opacity-70">connecting...</span>
            ) : (
              <>
                <GitHubIcon />
                Sign in with GitHub
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 border-t border-muted" />
            <span className="text-muted text-xs">or</span>
            <span className="flex-1 border-t border-muted" />
          </div>

          {/* Magic link */}
          {magicLinkSent ? (
            <div className="text-center">
              <p className="text-ink text-sm mb-1">Check your inbox.</p>
              <p className="text-muted text-xs">
                A sign-in link was sent to{' '}
                <span className="text-ink">{email}</span>.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
                className="text-muted text-xs mt-4 hover:text-ink transition-colors underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} noValidate>
              <label className="block text-muted text-xs mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-muted bg-theme text-ink text-sm px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent"
                autoComplete="email"
              />
              {emailError && (
                <p
                  className="text-xs mt-1.5"
                  style={{ color: 'var(--accent)' }}
                >
                  {emailError}
                </p>
              )}
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full mt-3 border border-muted text-ink text-sm py-2.5 px-4 hover:border-accent transition-colors disabled:opacity-50"
              >
                {emailLoading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-muted text-xs mt-6 text-center select-none">
          ─────────────────────────────
        </p>
      </div>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
