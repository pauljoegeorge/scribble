export function wrapText(text: string, width: number, measure: (text: string) => number): string[] {
  return text.split('\n').flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const token of paragraph.match(/\S+\s*|\s+/g) ?? []) {
      if (line && measure(line + token.trimEnd()) > width) {
        lines.push(line.trimEnd()); line = '';
      }
      for (const character of token) {
        if (line && measure(line + character) > width) {
          lines.push(line.trimEnd()); line = '';
        }
        if (line || character.trim()) line += character;
      }
    }
    lines.push(line.trimEnd());
    return lines;
  });
}
