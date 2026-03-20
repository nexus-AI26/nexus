import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
export function InputBar({ value, isThinking, theme, hasKey }) {
    const lines = value.split('\n');
    const displayValue = lines[lines.length - 1] ?? '';
    return (React.createElement(Box, { borderStyle: "round", borderColor: isThinking ? theme.primary : theme.border, paddingX: 1, flexDirection: "row" }, isThinking ? (React.createElement(Box, { gap: 1 },
        React.createElement(Text, { color: theme.primary },
            React.createElement(Spinner, { type: "dots" })),
        React.createElement(Text, { color: theme.muted, dimColor: true }, "thinking\u2026"))) : (React.createElement(Box, { flexGrow: 1, gap: 1 },
        hasKey
            ? React.createElement(Text, { color: theme.primary, bold: true }, "\u276F")
            : React.createElement(Text, { color: theme.error, bold: true }, "!"),
        React.createElement(Text, { color: theme.userMsg }, displayValue),
        React.createElement(Text, { color: theme.primary }, "\u2588")))));
}
//# sourceMappingURL=InputBar.js.map