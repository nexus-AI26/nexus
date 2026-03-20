import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Theme } from '../themes/index.js';

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  args?: string;
}

interface CommandPaletteProps {
  commands: Command[];
  query: string;
  selectedIndex: number;
  theme: Theme;
  onSelect: (cmd: Command) => void;
  onClose: () => void;
}

export function CommandPalette({ commands, query, selectedIndex, theme, onSelect, onClose }: CommandPaletteProps) {
  const filtered = commands.filter(cmd => {
    const q = query.toLowerCase().replace('/', '');
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.aliases?.some(a => a.toLowerCase().includes(q))
    );
  });

  if (filtered.length === 0 && query.length <= 1) {
    return null;
  }

  const displayCommands = filtered.slice(0, 8);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.primary}
      paddingX={1}
      marginBottom={0}
    >
      <Box marginBottom={0} paddingBottom={0}>
        <Text color={theme.muted} dimColor>Commands </Text>
        <Text color={theme.primary} bold>✦</Text>
        <Text color={theme.muted} dimColor> ({filtered.length} matches)</Text>
      </Box>
      <Box flexDirection="column">
        {displayCommands.map((cmd, i) => {
          const isSelected = i === (selectedIndex % Math.max(1, displayCommands.length));
          return (
            <Box key={cmd.name} paddingX={0}>
              {isSelected
                ? <Text color={theme.primary} bold>▶ </Text>
                : <Text>  </Text>
              }
              <Text color={isSelected ? theme.primary : theme.secondary} bold>/{cmd.name}</Text>
              {cmd.args && <Text color={theme.muted}> {cmd.args}</Text>}
              <Text color={theme.muted}>  </Text>
              <Text color={isSelected ? theme.userMsg : theme.muted}>{cmd.description}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
