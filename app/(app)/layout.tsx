import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ThemePicker } from '@/components/ThemePicker';
import { UserMenu } from '@/components/UserMenu';
import { logout } from './actions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-theme flex flex-col">
      <header className="border-b border-muted bg-surface px-4 h-11 flex items-center justify-between shrink-0">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="font-display text-2xl text-ink leading-none hover:text-accent transition-colors"
        >
          ASCII Editor
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <ThemePicker />
          <span className="text-muted text-xs select-none px-1">│</span>
          <UserMenu email={user.email!} onLogout={logout} />
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
