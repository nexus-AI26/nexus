import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Theme } from '../themes/index.js';

interface InputBarProps {
  value: string;
  isThinking: boolean;
  theme: Theme;
  hasKey: boolean;
}

export function InputBar({ value, isThinking, theme, hasKey }: InputBarProps) {
  const lines = value.split('\n');
  const displayValue = lines[lines.length - 1] ?? '';

  return (
    <Box
      borderStyle="round"
      borderColor={isThinking ? theme.primary : theme.border}
      paddingX={1}
      flexDirection="row"
    >
      {isThinking ? (
        <Box gap={1}>
          <Text color={theme.primary}>
            <Spinner type="dots" />
          </Text>
          <Text color={theme.muted} dimColor>thinking…</Text>
        </Box>
      ) : (
        <Box flexGrow={1} gap={1}>
          {hasKey
            ? <Text color={theme.primary} bold>❯</Text>
            : <Text color={theme.error} bold>!</Text>
          }
          <Text color={theme.userMsg}>{displayValue}</Text>
          <Text color={theme.primary}>█</Text>
        </Box>
      )}
    </Box>
  );
}
