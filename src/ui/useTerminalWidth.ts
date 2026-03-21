import { useEffect, useState } from 'react';

export function useTerminalSize(): { columns: number; rows: number } {
  const [size, setSize] = useState(() => ({
    columns: clampCols(process.stdout.columns),
    rows: clampRows(process.stdout.rows),
  }));

  useEffect(() => {
    const onResize = () => {
      setSize({
        columns: clampCols(process.stdout.columns),
        rows: clampRows(process.stdout.rows),
      });
    };

    onResize();
    if (!process.stdout.isTTY) return;
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  return size;
}

export function useTerminalWidth(): number {
  return useTerminalSize().columns;
}

function clampCols(c: number | undefined): number {
  return Math.max(40, Math.min(300, c ?? 80));
}

function clampRows(r: number | undefined): number {
  return Math.max(10, Math.min(200, r ?? 24));
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
