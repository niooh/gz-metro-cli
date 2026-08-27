const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

function paint(color: string, text: string): string {
  return `${color}${text}${RESET}`;
}

export const yellow = (s: string) => paint(YELLOW, s);
export const blue = (s: string) => paint(BLUE, s);
export const gray = (s: string) => paint(GRAY, s);
export const bold = (s: string) => paint(BOLD, s);
