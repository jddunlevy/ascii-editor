import matter from 'gray-matter';
import { safeValidatePageSpec } from './validate';
import type { PageSpec } from './types';

export type ImportResult =
  | { success: true; spec: PageSpec }
  | { success: false; error: string };

export function parseMarkdownToSpec(text: string): ImportResult {
  let data: Record<string, unknown>;
  try {
    ({ data } = matter(text));
  } catch {
    return { success: false, error: 'Could not parse markdown frontmatter.' };
  }

  const result = safeValidatePageSpec(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.join('.') ?? '';
    const msg = firstIssue?.message ?? 'unknown validation error';
    return {
      success: false,
      error: path ? `Invalid spec at "${path}": ${msg}` : `Invalid spec: ${msg}`,
    };
  }

  return { success: true, spec: result.data };
}
