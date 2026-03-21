import React from 'react';
import { Box, Text } from 'ink';
import type { Theme } from '../themes/index.js';
import { horizontalRule, useTerminalWidth } from './useTerminalWidth.js';

interface InputBarProps {
  value: string;
  theme: Theme;
  hasKey: boolean;
}

export function InputBar({ value, theme, hasKey }: InputBarProps) {
  const w = useTerminalWidth();
  const rule = horizontalRule(w);
  const lines = value.split('\n');
  const displayValue = lines[lines.length - 1] ?? '';

  return (
    <Box flexDirection="column" marginTop={0} width={w}>
      <Text dimColor color={theme.border}>{rule}</Text>
      <Box flexDirection="row" paddingX={0} minHeight={1}>
        <Box flexGrow={1} gap={1}>
          {hasKey
            ? <Text color={theme.primary} bold>❯ </Text>
            : <Text color={theme.error} bold>! </Text>
          }
          <Text color={theme.userMsg}>{displayValue}</Text>
          <Text color={theme.muted} dimColor>▏</Text>
        </Box>
      </Box>
      <Text dimColor color={theme.border}>{rule}</Text>
    </Box>
  );
}
