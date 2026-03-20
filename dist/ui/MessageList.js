import React from 'react';
import { Text, Box } from 'ink';
function CodeBlock({ code, theme }) {
    const lines = code.split('\n');
    return (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border, paddingX: 1, marginY: 0 }, lines.map((line, i) => (React.createElement(Text, { key: i, color: theme.secondary }, line)))));
}
function renderContent(content, theme) {
    const codeBlockRe = /```(?:\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRe.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index);
            parts.push(React.createElement(Text, { key: `t-${lastIndex}`, wrap: "wrap" }, renderInline(text, theme)));
        }
        parts.push(React.createElement(CodeBlock, { key: `c-${match.index}`, code: match[1]?.trim() ?? '', theme: theme }));
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        parts.push(React.createElement(Text, { key: `t-end`, wrap: "wrap" }, renderInline(content.slice(lastIndex), theme)));
    }
    return parts.length > 0 ? parts : [React.createElement(Text, { key: "empty", wrap: "wrap" }, renderInline(content, theme))];
}
function renderInline(text, theme) {
    const boldRe = /\*\*(.+?)\*\*/g;
    const parts = [];
    let last = 0;
    let m;
    while ((m = boldRe.exec(text)) !== null) {
        if (m.index > last)
            parts.push(text.slice(last, m.index));
        parts.push(React.createElement(Text, { key: m.index, bold: true, color: theme.primary }, m[1]));
        last = m.index + m[0].length;
    }
    if (last < text.length)
        parts.push(text.slice(last));
    return React.createElement(React.Fragment, null, parts);
}
function MessageBubble({ message, theme, verbose }) {
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';
    const prefix = isUser
        ? React.createElement(Text, { color: theme.accent, bold: true }, "\u276F ")
        : isTool
            ? React.createElement(Text, { color: theme.warning, bold: true }, "\u2699 ")
            : React.createElement(Text, { color: theme.primary, bold: true }, "\u2726 ");
    const color = isUser ? theme.userMsg : isTool ? theme.toolMsg : theme.assistantMsg;
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, null,
            prefix,
            isUser && React.createElement(Text, { color: theme.accent, bold: true }, message.content),
            isTool && (React.createElement(Box, { flexDirection: "column", marginLeft: 2 },
                React.createElement(Text, { color: theme.warning, dimColor: true },
                    "Tool: ",
                    message.toolName),
                verbose ? (React.createElement(Box, { borderStyle: "single", borderColor: theme.muted, paddingX: 1, marginY: 0 },
                    React.createElement(Text, { color: theme.muted, wrap: "wrap" }, message.content))) : (React.createElement(Text, { color: theme.muted, wrap: "wrap" },
                    message.content.slice(0, 150),
                    message.content.length > 150 ? '… (press Ctrl+B to expand)' : '')))),
            !isUser && !isTool && (React.createElement(Box, { flexDirection: "column", flexShrink: 1 }, renderContent(message.content, theme))))));
}
function ToolEventRow({ event, theme, verbose }) {
    if (event.type === 'start') {
        return (React.createElement(Box, { flexDirection: "column", marginLeft: 2 },
            React.createElement(Box, null,
                React.createElement(Text, { color: theme.warning }, "\u2699 Running "),
                React.createElement(Text, { color: theme.secondary, bold: true }, event.name),
                React.createElement(Text, { color: theme.warning }, " \u2026")),
            verbose && event.args && Object.keys(event.args).length > 0 && (React.createElement(Box, { borderStyle: "single", borderColor: theme.muted, paddingX: 1, marginY: 0 },
                React.createElement(Text, { color: theme.muted }, JSON.stringify(event.args, null, 2))))));
    }
    return null;
}
export function MessageList({ messages, theme, toolEvents, streamBuffer, isThinking, verbose }) {
    const displayMessages = messages.filter(m => m.role !== 'system');
    return (React.createElement(Box, { flexDirection: "column", flexGrow: 1, paddingX: 1 },
        displayMessages.map((msg, i) => (React.createElement(MessageBubble, { key: i, message: msg, theme: theme, verbose: verbose }))),
        toolEvents.map((ev, i) => (React.createElement(ToolEventRow, { key: i, event: ev, theme: theme, verbose: verbose }))),
        isThinking && !streamBuffer && (React.createElement(Box, null,
            React.createElement(Text, { color: theme.primary, bold: true }, "\u2726 "),
            React.createElement(Text, { color: theme.muted }, "thinking"),
            React.createElement(Text, { color: theme.primary }, "\u2026"))),
        streamBuffer && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Box, null,
                React.createElement(Text, { color: theme.primary, bold: true }, "\u2726 "),
                React.createElement(Box, { flexDirection: "column", flexShrink: 1 }, renderContent(streamBuffer, theme)))))));
}
//# sourceMappingURL=MessageList.js.map