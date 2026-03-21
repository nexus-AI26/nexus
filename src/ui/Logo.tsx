import React, { useMemo } from 'react';
import { Text, Box } from 'ink';
import path from 'path';
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

interface WelcomeCardProps {
  theme: Theme;
  version: string;
  provider: string;
  model: string;
  cwd: string;
}

export function WelcomeCard({ theme, version, provider, model, cwd }: WelcomeCardProps) {
  const shortCwd = useMemo(() => {
    const parts = cwd.split(path.sep);
    if (parts.length > 4) {
      return '...' + path.sep + parts.slice(-3).join(path.sep);
    }
    return cwd;
  }, [cwd]);

  return (
    <Box flexDirection="column" marginY={1}>
      <Box
        borderStyle="round"
        borderColor={theme.border}
        flexDirection="column"
        paddingX={1}
      >
        <Box justifyContent="space-between" paddingX={1} marginTop={-1}>
           <Text color={theme.muted}>╭─── <Text bold color={theme.primary}>Nexus CLI v{version}</Text> </Text>
           <Text color={theme.muted}>──────────────────────────────────────────╮</Text>
        </Box>

        <Box paddingY={1}>
           {/* Left Column */}
           <Box flexDirection="column" width="40%" alignItems="center" borderRight borderRightColor={theme.border} paddingRight={2}>
              <Text bold color={theme.accent}>Welcome back!</Text>
              
              <Box flexDirection="column" marginY={1} alignItems="center">
                <Text color={theme.primary}>  ▟█▙      ▟█▙  </Text>
                <Text color={theme.primary}>  ▝██▙    ▟██▘  </Text>
                <Text color={theme.primary}>   ▝██▙  ▟██▘   </Text>
                <Text color={theme.primary}>    ▝██████▘    </Text>
                <Text color={theme.primary}>    ▟██████▙    </Text>
                <Text color={theme.primary}>   ▟██▘  ▝██▙   </Text>
                <Text color={theme.primary}>  ▟██▘    ▝██▙  </Text>
              </Box>

              <Text color={theme.secondary}>{provider} · {model}</Text>
              <Text color={theme.muted} dimColor>{shortCwd}</Text>
           </Box>

           {/* Right Column */}
           <Box flexDirection="column" width="60%" paddingLeft={2}>
              <Text bold color={theme.primary}>Tips for getting started</Text>
              <Text color={theme.muted}>• Type <Text bold color={theme.secondary}>/help</Text> to see all commands</Text>
              <Text color={theme.muted}>• Use <Text bold color={theme.secondary}>/init</Text> to configure your project</Text>
              <Text color={theme.muted}>• Press <Text bold color={theme.secondary}>Ctrl+O</Text> to see live reasoning</Text>
              
              <Box borderBottom borderBottomColor={theme.border} marginY={1} width="100%" />

              <Text bold color={theme.primary}>Recent activity</Text>
              <Text color={theme.muted} italic>No recent activity in this session.</Text>
           </Box>
        </Box>
      </Box>
    </Box>
  );
}
