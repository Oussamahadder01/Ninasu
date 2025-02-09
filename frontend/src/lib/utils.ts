import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import katex from 'katex';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function renderLatexContent(content: string): string {
  // Replace inline math: $...$ with rendered LaTeX
  content = content.replace(/\$([^\$]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { displayMode: false });
    } catch (error) {
      console.error('LaTeX parsing error:', error);
      return match;
    }
  });

  // Replace display math: $$...$$
  content = content.replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { displayMode: true });
    } catch (error) {
      console.error('LaTeX parsing error:', error);
      return match;
    }
  });

  return content;
}
