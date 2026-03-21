import React, { useMemo } from 'react';
import { Text, Box } from 'ink';
import path from 'path';
import os from 'node:os';
import type { Theme } from '../themes/index.js';
import { borderBottomLine, borderTopLine, useTerminalWidth } from './useTerminalWidth.js';

interface LogoProps {
  theme: Theme;
  compact?: boolean;
  embedded?: boolean;
}

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
  const inner = Math.max(1, w - 2);
  const textW = Math.max(20, inner - 2);

  const inHomeDir = useMemo(() => {
    try {
      return path.resolve(cwd) === path.resolve(os.homedir());
    } catch {
      return false;
    }
  }, [cwd]);

  const shortModel = trunc(model, 48);
  const ruleLen = Math.min(textW, 72);

  const leftW = Math.floor(inner / 2);
  const rightW = inner - leftW - 1; // -1 for divider

  return (
    <Box flexDirection="column" marginBottom={1} width={w}>
      <Text wrap="truncate" color={theme.border}>{topLine}</Text>
      <Box flexDirection="row" width={w} flexShrink={0}>
        <Text color={theme.border}>│</Text>
        <Box flexDirection="row" width={inner} flexShrink={0}>
          {/* Left Column: Info & Logo */}
          <Box flexDirection="column" width={leftW} alignItems="center" paddingY={1} justifyContent="space-between">
            <Box flexDirection="column" alignItems="center">
              <Text bold color={theme.accent}>Welcome back!</Text>
            </Box>
            
            <Box marginY={1}>
              <Logo theme={theme} embedded />
            </Box>
            
            <Box flexDirection="column" alignItems="center">
               <Text color={theme.secondary} wrap="truncate">{trunc(`${provider} · ${shortModel}`, leftW - 2)}</Text>
               <Text color={theme.muted} dimColor wrap="truncate">{trunc(shortCwd, leftW - 2)}</Text>
            </Box>
          </Box>

          {/* Vertical Divider */}
          <Box width={1}>
            <Text color={theme.border}>│</Text>
          </Box>

          {/* Right Column: Tips & Activity */}
          <Box flexDirection="column" width={rightW} paddingX={2} paddingY={1}>
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color={theme.primary}>Tips for getting started</Text>
              <Text color={theme.muted} wrap="wrap">
                • Run <Text bold color={theme.secondary}>/init</Text> for project context.
              </Text>
              <Text color={theme.muted} wrap="wrap">
                • Type <Text bold color={theme.secondary}>/help</Text> for all commands.
              </Text>
              <Text color={theme.muted} wrap="wrap">
                • <Text bold color={theme.secondary}>Ctrl+O</Text> toggles live reasoning.
              </Text>
            </Box>

            <Text dimColor color={theme.border}>{'─'.repeat(rightW - 4)}</Text>

            <Box flexDirection="column" marginTop={1}>
              <Text bold color={theme.primary}>Recent activity</Text>
              <Text color={theme.muted} italic>No recent activity.</Text>
            </Box>
          </Box>
        </Box>
        <Text color={theme.border}>│</Text>
      </Box>
      <Text wrap="truncate" color={theme.border}>{bottomLine}</Text>
    </Box>
  );
}
