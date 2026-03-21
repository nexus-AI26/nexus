import React from 'react';
import { Box, Text } from 'ink';
import type { Theme } from '../themes/index.js';

interface StatusBarProps {
  theme: Theme;
  showThinking: boolean;
}

export function StatusBar({ theme, showThinking }: StatusBarProps) {
  return (
    <Box paddingLeft={2} marginTop={0}>
      <Text color={theme.muted} dimColor>
        Ctrl+C interrupt or exit · Ctrl+O {showThinking ? 'hide' : 'show'} reasoning · / for commands
      </Text>
    </Box>
  );
}
