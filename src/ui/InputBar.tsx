import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Theme } from '../themes/index.js';

interface InputBarProps {
  value: string;
  isThinking: boolean;
  isWriting: boolean;
  showThinking: boolean;
  thinkingLabel: string;
  theme: Theme;
  hasKey: boolean;
}

export function InputBar({ value, isThinking, isWriting, showThinking, thinkingLabel, theme, hasKey }: InputBarProps) {
  const lines = value.split('\n');
  const displayValue = lines[lines.length - 1] ?? '';
  const activityLabel = isWriting ? 'writing...' : thinkingLabel;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={theme.muted}>────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────</Text>
      <Box paddingX={1} marginBottom={0}>
        <Text color={theme.muted}>❯ Try <Text bold color={theme.secondary}>"edit <Text italic>filepath</Text> to..."</Text></Text>
      </Box>
      <Text color={theme.muted}>────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────</Text>
      
      <Box
        borderStyle="round"
        borderColor={isThinking ? theme.primary : theme.border}
        paddingX={1}
        flexDirection="row"
        marginTop={0}
      >
        {isThinking ? (
          <Box gap={1}>
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            {showThinking && <Text color={theme.muted} dimColor>{activityLabel}</Text>}
          </Box>
        ) : (
          <Box flexGrow={1} gap={1}>
            {hasKey
              ? <Text color={theme.primary} bold>❯</Text>
              : <Text color={theme.error} bold>!</Text>
            }
            <Text color={theme.userMsg}>{displayValue}</Text>
            <Text color={theme.muted} dimColor>▏</Text>
          </Box>
        )}
      </Box>
      <Box paddingX={1} marginTop={0}>
        <Text color={theme.muted} dimColor>? for shortcuts</Text>
      </Box>
    </Box>
  );
}
