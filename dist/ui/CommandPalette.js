import React from 'react';
import { Box, Text } from 'ink';
export function CommandPalette({ commands, query, selectedIndex, theme, onSelect, onClose }) {
    const filtered = commands.filter(cmd => {
        const q = query.toLowerCase().replace('/', '');
        return (cmd.name.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.aliases?.some(a => a.toLowerCase().includes(q)));
    });
    if (filtered.length === 0 && query.length <= 1) {
        return null;
    }
    const displayCommands = filtered.slice(0, 8);
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.primary, paddingX: 1, marginBottom: 0 },
        React.createElement(Box, { marginBottom: 0, paddingBottom: 0 },
            React.createElement(Text, { color: theme.muted, dimColor: true }, "Commands "),
            React.createElement(Text, { color: theme.primary, bold: true }, "\u2726"),
            React.createElement(Text, { color: theme.muted, dimColor: true },
                " (",
                filtered.length,
                " matches)")),
        React.createElement(Box, { flexDirection: "column" }, displayCommands.map((cmd, i) => {
            const isSelected = i === (selectedIndex % Math.max(1, displayCommands.length));
            return (React.createElement(Box, { key: cmd.name, paddingX: 0 },
                isSelected
                    ? React.createElement(Text, { color: theme.primary, bold: true }, "\u25B6 ")
                    : React.createElement(Text, null, "  "),
                React.createElement(Text, { color: isSelected ? theme.primary : theme.secondary, bold: true },
                    "/",
                    cmd.name),
                cmd.args && React.createElement(Text, { color: theme.muted },
                    " ",
                    cmd.args),
                React.createElement(Text, { color: theme.muted }, "  "),
                React.createElement(Text, { color: isSelected ? theme.userMsg : theme.muted }, cmd.description)));
        }))));
}
//# sourceMappingURL=CommandPalette.js.map