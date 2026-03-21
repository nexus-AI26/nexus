import { useEffect, useState } from 'react';

export function useTerminalWidth(): number {
  const [cols, setCols] = useState(() => clampCols(process.stdout.columns));
  useEffect(() => {
    const onResize = () => setCols(clampCols(process.stdout.columns));
    onResize();
    if (!process.stdout.isTTY) return;
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);
  return cols;
}

function clampCols(c: number | undefined): number {
  return Math.max(40, Math.min(200, c ?? 80));
}

export function borderTopLine(width: number, title: string): string {
  const head = `╭─── ${title} ─`;
  const tail = '╮';
  const fill = Math.max(0, width - head.length - tail.length);
  return head + '─'.repeat(fill) + tail;
}

export function borderBottomLine(width: number): string {
  return '╰' + '─'.repeat(Math.max(0, width - 2)) + '╯';
}

export function horizontalRule(width: number): string {
  return '─'.repeat(Math.max(0, width));
}
