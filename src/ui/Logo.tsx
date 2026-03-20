import React from 'react';
import { Text, Box } from 'ink';
import type { Theme } from '../themes/index.js';

interface LogoProps {
  theme: Theme;
  compact?: boolean;
}

const LOGO_FULL = [
  ' ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗',
  ' ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝',
  ' ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗',
  ' ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║',
  ' ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║',
  ' ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝',
];

const LOGO_COMPACT = ' ✦ nexus';

export function Logo({ theme, compact = false }: LogoProps) {
  if (compact) {
    return (
      <Box>
        <Text bold color={theme.primary}>{LOGO_COMPACT}</Text>
        <Text color={theme.muted}> — AI coding agent</Text>
      </Box>
    );
  }

  const colors = [
    theme.primary,
    theme.primary,
    theme.secondary,
    theme.secondary,
    theme.accent,
    theme.accent,
  ];

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      {LOGO_FULL.map((line, i) => (
        <Text key={i} color={colors[i] ?? theme.primary} bold>{line}</Text>
      ))}
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
