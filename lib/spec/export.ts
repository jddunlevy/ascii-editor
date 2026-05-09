import yaml from 'js-yaml';
import type { PageSpec } from './types';
import { renderBody } from './bodyRenderer';

export function exportToMarkdown(spec: PageSpec): string {
  const frontmatterObj = {
    spec_version: spec.spec_version,
    generator: 'ascii-editor',
    exported_at: new Date().toISOString(),
    page: spec.page,
  };

  const yamlStr = yaml.dump(frontmatterObj, {
    lineWidth: -1, // no auto line-wrapping
    noRefs: true,
  });

  const body = renderBody(spec);
  return `---\n${yamlStr}---\n\n${body}`;
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  ) || 'untitled';
}
