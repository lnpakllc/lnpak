import { Fragment } from 'react';

// Shows text typed in an admin box the way it was typed: paragraphs stay separate, single line breaks are kept,
// and lines starting with "- ", "* " or "•" become a bullet list. Everything is rendered as plain text (no HTML).
const BULLET = /^\s*(?:[-*•]|•)\s+(.*)$/;

export function parseFormatted(text) {
  const blocks = [];
  let list = null;
  let para = null;
  const flush = () => { if (para) blocks.push({ type: 'p', lines: para }); if (list) blocks.push({ type: 'ul', items: list }); para = null; list = null; };
  for (const raw of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const m = BULLET.exec(line);
    if (!line.trim()) { flush(); continue; }
    if (m) { if (para) { blocks.push({ type: 'p', lines: para }); para = null; } (list ||= []).push(m[1]); continue; }
    if (list) { blocks.push({ type: 'ul', items: list }); list = null; }
    (para ||= []).push(line.trim());
  }
  flush();
  return blocks;
}

export default function FormattedText({ text, className = '' }) {
  const blocks = parseFormatted(text);
  if (!blocks.length) return null;
  return (
    <div className={`space-y-3 text-slate-600 ${className}`}>
      {blocks.map((b, i) => b.type === 'ul' ? (
        <ul key={i} className="list-disc space-y-1 pl-6">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
      ) : (
        <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{l}</Fragment>)}</p>
      ))}
    </div>
  );
}
