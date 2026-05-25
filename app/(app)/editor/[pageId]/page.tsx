import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditorProvider } from '@/components/editor/EditorProvider';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorShell } from '@/components/editor/EditorShell';
import type { EditorPage } from '@/lib/store/editorStore';
import type { PageSpec } from '@/lib/spec/types';

interface EditorPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { pageId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: row } = await supabase
    .from('pages')
    .select('id, title, spec, in_library')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .single();

  if (!row) notFound();

  const initialPage: EditorPage = {
    id: row.id,
    title: row.title,
    spec: row.spec as PageSpec,
  };

  return (
    <EditorProvider initialPage={initialPage}>
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <EditorToolbar pageId={row.id} initialInLibrary={row.in_library ?? false} />
        <EditorShell />
      </div>
    </EditorProvider>
  );
}
