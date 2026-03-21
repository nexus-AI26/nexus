import React from 'react';
import { Box, Text } from 'ink';
import type { Theme } from '../themes/index.js';

interface StatusBarProps {
  provider: string;
  model: string;
  themeName: string;
  theme: Theme;
  messageCount: number;
  cwd: string;
  showThinking: boolean;
}

export function StatusBar({ provider, model, themeName, theme, messageCount, cwd, showThinking }: StatusBarProps) {
  const shortModel = model.length > 20 ? model.slice(0, 18) + '…' : model;
  const shortCwd = cwd.length > 25 ? '…' + cwd.slice(-22) : cwd;
  const providerColor: Record<string, string> = {
    openai: '#74aa9c',
    anthropic: '#cc785c',
    openrouter: '#9d7cd8',
    custom: '#7aa2f7',
  };
  const pc = providerColor[provider] ?? theme.primary;

  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={2}>
        <Text color={theme.primary} bold>✦ nexus</Text>
        <Text color={theme.border}>│</Text>
        <Text color={pc} bold>{provider.toUpperCase()}</Text>
        <Text color={theme.muted}>{shortModel}</Text>
      </Box>
      <Box gap={2}>
        <Text color={theme.muted}>{shortCwd}</Text>
        <Text color={theme.border}>│</Text>
        <Text color={theme.secondary}>msgs: {messageCount}</Text>
        <Text color={theme.border}>│</Text>
        <Text color={theme.accent}>{themeName}</Text>
        <Text color={theme.border}>│</Text>
        <Text color={theme.muted} dimColor>/ commands</Text>
        <Text color={theme.border}>│</Text>
        <Text color={theme.muted} dimColor>Ctrl+O {showThinking ? 'hide' : 'show'} thinking</Text>
      </Box>
    </Box>
  );
}
