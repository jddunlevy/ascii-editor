'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createDefaultSpec } from '@/lib/spec/types';
import { parseMarkdownToSpec } from '@/lib/spec/import';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function createPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const spec = createDefaultSpec('Untitled');
  const { data, error } = await supabase
    .from('pages')
    .insert({ user_id: user.id, title: 'Untitled', spec })
    .select('id')
    .single();

  if (error || !data) throw new Error('Failed to create page');
  redirect(`/editor/${data.id}`);
}

export async function deletePage(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase.from('pages').delete().eq('id', id);
  revalidatePath('/dashboard');
}

export async function importPage(
  text: string,
): Promise<{ error: string } | undefined> {
  const parseResult = parseMarkdownToSpec(text);
  if (!parseResult.success) {
    return { error: parseResult.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { spec } = parseResult;
  const title = spec.page.title;

  const { data, error } = await supabase
    .from('pages')
    .insert({ user_id: user.id, title, spec })
    .select('id')
    .single();

  if (error || !data) return { error: 'Failed to save page. Please try again.' };
  redirect(`/editor/${data.id}`);
}
