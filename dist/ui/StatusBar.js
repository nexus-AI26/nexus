import React from 'react';
import { Box, Text } from 'ink';
export function StatusBar({ provider, model, themeName, theme, messageCount, cwd }) {
    const shortModel = model.length > 20 ? model.slice(0, 18) + '…' : model;
    const shortCwd = cwd.length > 25 ? '…' + cwd.slice(-22) : cwd;
    const providerColor = {
        openai: '#74aa9c',
        anthropic: '#cc785c',
        openrouter: '#9d7cd8',
        custom: '#7aa2f7',
    };
    const pc = providerColor[provider] ?? theme.primary;
    return (React.createElement(Box, { borderStyle: "single", borderColor: theme.border, paddingX: 1, justifyContent: "space-between" },
        React.createElement(Box, { gap: 2 },
            React.createElement(Text, { color: theme.primary, bold: true }, "\u2726 nexus"),
            React.createElement(Text, { color: theme.border }, "\u2502"),
            React.createElement(Text, { color: pc, bold: true }, provider.toUpperCase()),
            React.createElement(Text, { color: theme.muted }, shortModel)),
        React.createElement(Box, { gap: 2 },
            React.createElement(Text, { color: theme.muted }, shortCwd),
            React.createElement(Text, { color: theme.border }, "\u2502"),
            React.createElement(Text, { color: theme.secondary },
                "msgs: ",
                messageCount),
            React.createElement(Text, { color: theme.border }, "\u2502"),
            React.createElement(Text, { color: theme.accent }, themeName),
            React.createElement(Text, { color: theme.border }, "\u2502"),
            React.createElement(Text, { color: theme.muted, dimColor: true }, "/ commands"))));
}
//# sourceMappingURL=StatusBar.js.map