import React from 'react';
import { Box, Text } from 'ink';
import type { Theme } from '../themes/index.js';

interface StatusBarProps {
  theme: Theme;
  showThinking: boolean;
}

export function StatusBar({ theme, showThinking, isBusy }: StatusBarProps & { isBusy?: boolean }) {
  return (
    <Box paddingLeft={2} marginTop={0} justifyContent="space-between" width="100%">
      <Text color={theme.muted} dimColor>
        Ctrl+C interrupt or exit · Ctrl+O {showThinking ? 'hide' : 'show'} reasoning · / for commands
      </Text>
      {isBusy && (
        <Box marginRight={2}>
           <Text color={theme.accent}>● </Text>
           <Text color={theme.muted} dimColor italic>Working…</Text>
        </Box>
      )}
    </Box>
  );
}
