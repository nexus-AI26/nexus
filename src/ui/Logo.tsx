import React, { useMemo } from 'react';
import { Text, Box } from 'ink';
import path from 'path';
import os from 'node:os';
import type { Theme } from '../themes/index.js';
import { borderBottomLine, borderTopLine, useTerminalWidth } from './useTerminalWidth.js';

interface LogoProps {
  theme: Theme;
  compact?: boolean;
  /** When true, only the wordmark lines (for the welcome panel). */
  embedded?: boolean;
}

/** FIGlet slant, ASCII-only — reliable column width on Windows and narrow terminals */
const LOGO_FULL = [
  '    _   _________  ____  _______',
  '   / | / / ____/ |/ / / / / ___/',
  '  /  |/ / __/  |   / / / /\\__ \\ ',
  ' / /|  / /___ /   / /_/ /___/ / ',
  '/_/ |_/_____//_/|_\\____//____/  ',
];

const LOGO_UNDERLINE = '────────────────────────────────';

const LOGO_COMPACT = 'nexus';

function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + '…';
}

export function Logo({ theme, compact = false, embedded = false }: LogoProps) {
  if (compact) {
    return (
      <Box>
        <Text color={theme.accent}>✦ </Text>
        <Text bold color={theme.primary}>{LOGO_COMPACT}</Text>
        <Text color={theme.muted}> — AI coding agent</Text>
      </Box>
    );
  }

  const lineColors = [
    theme.primary,
    theme.secondary,
    theme.accent,
    theme.secondary,
    theme.primary,
  ];

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={embedded ? 0 : 1}>
      {LOGO_FULL.map((line, i) => (
        <Text key={i} color={lineColors[i] ?? theme.primary} bold>{line}</Text>
      ))}
      {!embedded && (
        <>
          <Text dimColor color={theme.border}>{LOGO_UNDERLINE}</Text>
          <Box marginTop={1} gap={2}>
            <Text color={theme.muted}>AI coding agent</Text>
            <Text color={theme.accent}>✦</Text>
            <Text color={theme.muted}>Any provider. Any model.</Text>
            <Text color={theme.accent}>✦</Text>
            <Text color={theme.muted}>Type <Text color={theme.secondary} bold>/help</Text> to start</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

interface WelcomeCardProps {
  theme: Theme;
  version: string;
  provider: string;
  model: string;
  cwd: string;
}

export function WelcomeCard({ theme, version, provider, model, cwd }: WelcomeCardProps) {
  const w = useTerminalWidth();
  const shortCwd = useMemo(() => {
    const parts = cwd.split(path.sep);
    if (parts.length > 4) {
      return '…' + path.sep + parts.slice(-3).join(path.sep);
    }
    return cwd;
  }, [cwd]);

  const title = `Nexus v${version}`;
  const topLine = borderTopLine(w, title);
  const bottomLine = borderBottomLine(w);
  const inHomeDir = useMemo(() => {
    try {
      return path.resolve(cwd) === path.resolve(os.homedir());
    } catch {
      return false;
    }
  }, [cwd]);

  const shortModel = trunc(model, 36);

  const narrow = w < 72;
  const inner = Math.max(1, w - 2);
  const leftW = narrow ? inner : Math.max(34, Math.floor(inner * 0.38));
  const rightW = narrow ? inner : inner - leftW;

  const tips = (
    <Box flexDirection="column" width={rightW} paddingX={1} flexShrink={1}>
      <Text bold color={theme.primary}>Tips for getting started</Text>
      <Text color={theme.muted} wrap="wrap">
        Run <Text bold color={theme.secondary}>/init</Text> to create a NEXUS.md file with instructions for Nexus.
      </Text>
      <Text color={theme.muted} wrap="wrap">
        Type <Text bold color={theme.secondary}>/help</Text> to see all commands.
      </Text>
      <Text color={theme.muted} wrap="wrap">
        Press <Text bold color={theme.secondary}>Ctrl+O</Text> to toggle live reasoning in the transcript.
      </Text>
      {inHomeDir && (
        <Text color={theme.muted} wrap="wrap">
          Note: You launched nexus in your home directory. For the best experience, run it inside a project folder.
        </Text>
      )}
      <Box marginY={1}>
        <Text dimColor color={theme.border}>{'─'.repeat(Math.max(8, rightW - 2))}</Text>
      </Box>
      <Text bold color={theme.primary}>Recent activity</Text>
      <Text color={theme.muted} italic>No recent activity in this session.</Text>
    </Box>
  );

  const leftColumn = (
    <Box
      flexDirection="column"
      alignItems="center"
      width={leftW}
      paddingX={1}
      borderStyle="single"
      borderColor={theme.border}
      borderLeft={false}
      borderTop={false}
      borderBottom={false}
      borderRight={!narrow}
    >
      <Box marginY={1}>
        <Text bold color={theme.accent}>Welcome back!</Text>
      </Box>
      <Box marginBottom={1}>
        <Logo theme={theme} embedded />
      </Box>
      <Text color={theme.secondary} wrap="truncate">{trunc(`${provider} · ${shortModel}`, leftW - 2)}</Text>
      <Box marginTop={1}>
        <Text color={theme.muted} dimColor wrap="truncate">{trunc(shortCwd, leftW - 2)}</Text>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" marginY={1} width={w}>
      <Text wrap="truncate" color={theme.border}>{topLine}</Text>
      <Box flexDirection="row" width={w} alignItems="flex-start">
        <Text color={theme.border}>│</Text>
        {narrow ? (
          <Box flexDirection="column" width={inner} alignItems="center" paddingBottom={1}>
            <Box marginY={1}>
              <Text bold color={theme.accent}>Welcome back!</Text>
            </Box>
            <Logo theme={theme} embedded />
            <Box marginY={1} flexDirection="column" alignItems="center">
              <Text color={theme.secondary} wrap="wrap">{provider} · {shortModel}</Text>
              <Text color={theme.muted} dimColor wrap="wrap">{shortCwd}</Text>
            </Box>
            {tips}
          </Box>
        ) : (
          <>
            {leftColumn}
            {tips}
          </>
        )}
        <Text color={theme.border}>│</Text>
      </Box>
      <Text wrap="truncate" color={theme.border}>{bottomLine}</Text>
    </Box>
  );
}
