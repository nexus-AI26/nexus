import React from 'react';
import { Text, Box } from 'ink';
const LOGO_FULL = [
    ' ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗',
    ' ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝',
    ' ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗',
    ' ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║',
    ' ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║',
    ' ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝',
];
const LOGO_COMPACT = ' ✦ nexus';
export function Logo({ theme, compact = false }) {
    if (compact) {
        return (React.createElement(Box, null,
            React.createElement(Text, { bold: true, color: theme.primary }, LOGO_COMPACT),
            React.createElement(Text, { color: theme.muted }, " \u2014 AI coding agent")));
    }
    const colors = [
        theme.primary,
        theme.primary,
        theme.secondary,
        theme.secondary,
        theme.accent,
        theme.accent,
    ];
    return (React.createElement(Box, { flexDirection: "column", alignItems: "center", marginBottom: 1 },
        LOGO_FULL.map((line, i) => (React.createElement(Text, { key: i, color: colors[i] ?? theme.primary, bold: true }, line))),
        React.createElement(Box, { marginTop: 1, gap: 2 },
            React.createElement(Text, { color: theme.muted }, "AI coding agent"),
            React.createElement(Text, { color: theme.accent }, "\u2726"),
            React.createElement(Text, { color: theme.muted }, "Any provider. Any model."),
            React.createElement(Text, { color: theme.accent }, "\u2726"),
            React.createElement(Text, { color: theme.muted },
                "Type ",
                React.createElement(Text, { color: theme.secondary, bold: true }, "/help"),
                " to start"))));
}
//# sourceMappingURL=Logo.js.map