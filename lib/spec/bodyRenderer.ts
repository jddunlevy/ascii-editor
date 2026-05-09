import type { PageSpec, Element } from './types';

function sortByPosition(elements: Element[]): Element[] {
  return [...elements].sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });
}

export function renderBody(spec: PageSpec): string {
  const sorted = sortByPosition(spec.page.elements);
  const lines: string[] = [`# ${spec.page.title}`, ''];

  for (const el of sorted) {
    switch (el.type) {
      case 'text': {
        const c = el.content;
        switch (el.semantic) {
          case 'h1':      lines.push(`# ${c}`, '');       break;
          case 'h2':      lines.push(`## ${c}`, '');      break;
          case 'h3':      lines.push(`### ${c}`, '');     break;
          case 'body':    lines.push(c, '');               break;
          case 'caption': lines.push(`_${c}_`, '');       break;
          case 'code':    lines.push(`\`${c}\``, '');     break;
          case 'label':   lines.push(`**${c}**`, '');     break;
        }
        break;
      }
      case 'ascii_art': {
        lines.push('```', el.content, '```', '');
        break;
      }
      case 'divider': {
        const pat = el.pattern;
        let result = '';
        while (result.length < 40) result += pat;
        lines.push(result.slice(0, 40), '');
        break;
      }
      case 'structural': {
        if (el.label) lines.push(`### ${el.label}`, '');
        break;
      }
      // 'decorative' — omitted from body
    }
  }

  // End with exactly one trailing newline
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');

  return lines.join('\n');
}
