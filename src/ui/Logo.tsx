import React, { useMemo } from 'react';
import { Text, Box } from 'ink';
import path from 'path';
import type { Theme } from '../themes/index.js';

interface LogoProps {
  theme: Theme;
  compact?: boolean;
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

export function Logo({ theme, compact = false }: LogoProps) {
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
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      {LOGO_FULL.map((line, i) => (
        <Text key={i} color={lineColors[i] ?? theme.primary} bold>{line}</Text>
      ))}
      <Text dimColor color={theme.border}>{LOGO_UNDERLINE}</Text>
      <Box marginTop={1} gap={2}>
        <Text color={theme.muted}>AI coding agent</Text>
        <Text color={theme.accent}>✦</Text>
        <Text color={theme.muted}>Any provider. Any model.</Text>
        <Text color={theme.accent}>✦</Text>
        <Text color={theme.muted}>Type <Text color={theme.secondary} bold>/help</Text> to start</Text>
      </Box>
    </Box>
  );
}

interface WelcomeCardProps {
  theme: Theme;
  version: string;
  provider: string;
  model: string;
  cwd: string;
  compact?: boolean;
}

export function WelcomeCard({ theme, version, provider, model, cwd, compact = false }: WelcomeCardProps) {
  const shortCwd = useMemo(() => {
    const parts = cwd.split(path.sep);
    if (parts.length > 4) {
      return '...' + path.sep + parts.slice(-3).join(path.sep);
    }
    return cwd;
  }, [cwd]);

  return (
    <Box flexDirection="column" marginY={compact ? 0 : 1}>
      <Box
        borderStyle="round"
        borderColor={theme.border}
        flexDirection="column"
        paddingX={1}
      >
        <Box paddingX={1} marginTop={-1}>
           <Text color={theme.border}>─── </Text>
           <Text bold color={theme.primary}>Nexus CLI v{version}</Text>
           <Text color={theme.border}> ──────────────────────────────────────────</Text>
        </Box>

        <Box paddingY={compact ? 0 : 1}>
           <Box flexDirection="column" width={compact ? '100%' : '40%'} alignItems="center" borderRight={!compact} borderRightColor={theme.border} paddingRight={compact ? 0 : 2} paddingY={compact ? 0 : 1}>
              {!compact && <Text bold color={theme.accent}>Welcome back!</Text>}
              
              <Box marginY={compact ? 0 : 1}>
                <Logo theme={theme} compact={compact} />
              </Box>

              <Box gap={2} flexDirection={compact ? 'row' : 'column'} alignItems="center">
                <Text color={theme.secondary}>{provider} · {model}</Text>
                <Text color={theme.muted} dimColor>{shortCwd}</Text>
              </Box>
           </Box>

           {!compact && (
             <Box flexDirection="column" width="60%" paddingLeft={2}>
                <Text bold color={theme.primary}>Tips for getting started</Text>
                <Text color={theme.muted}>• Type <Text bold color={theme.secondary}>/help</Text> to see all commands</Text>
                <Text color={theme.muted}>• Use <Text bold color={theme.secondary}>/init</Text> to configure your project</Text>
                <Text color={theme.muted}>• Press <Text bold color={theme.secondary}>Ctrl+O</Text> to see live reasoning</Text>
                
                <Box borderBottom borderBottomColor={theme.border} marginY={1} width="100%" />
  
                <Text bold color={theme.primary}>Recent activity</Text>
                <Text color={theme.muted} italic>No recent activity in this session.</Text>
             </Box>
           )}
        </Box>
      </Box>
    </Box>
  );
}
