import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { getConfig, setConfig, isFirstRun, hasApiKey } from '../core/config.js';
import { getTheme } from '../themes/index.js';
import { agent } from '../core/agent.js';
import { getCommandList, executeCommand } from '../commands/index.js';
import { Logo } from './Logo.js';
import { MessageList } from './MessageList.js';
import { InputBar } from './InputBar.js';
import { CommandPalette } from './CommandPalette.js';
import { StatusBar } from './StatusBar.js';
import { SetupWizard } from './SetupWizard.js';
export function App() {
    const { exit } = useApp();
    const cfg = getConfig();
    const [theme, setTheme] = useState(getTheme(cfg.theme));
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [streamBuffer, setStreamBuffer] = useState('');
    const [toolEvents, setToolEvents] = useState([]);
    const [toolAsk, setToolAsk] = useState(null);
    const [toolAskExpanded, setToolAskExpanded] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [paletteIndex, setPaletteIndex] = useState(0);
    const [verboseMode, setVerboseMode] = useState(false);
    const [setupMode, setSetupMode] = useState(isFirstRun());
    const [logoShown, setLogoShown] = useState(true);
    const isRunning = useRef(false);
    const refreshMessages = useCallback(() => {
        setMessages([...agent.messages]);
    }, []);
    useEffect(() => {
        refreshMessages();
        const unsub = agent.on((event) => {
            switch (event.type) {
                case 'thinking':
                    setIsThinking(true);
                    setStreamBuffer('');
                    setToolEvents([]);
                    break;
                case 'text':
                    setStreamBuffer(prev => prev + (event.content ?? ''));
                    break;
                case 'tool_start':
                    setToolEvents(prev => [...prev, { type: 'start', name: event.name, args: event.args }]);
                    break;
                case 'tool_done':
                    setToolEvents(prev => prev.filter(e => !(e.type === 'start' && e.name === event.name)));
                    break;
                case 'tool_ask':
                    setIsThinking(false);
                    setToolAsk({ id: event.id, name: event.name, args: event.args });
                    setToolAskExpanded(false);
                    break;
                case 'error':
                    setIsThinking(false);
                    setStreamBuffer('');
                    setMessages(prev => [...prev, {
                            role: 'system_output',
                            content: `⚠ Error: ${event.message}`,
                            timestamp: Date.now(),
                        }]);
                    isRunning.current = false;
                    break;
                case 'done':
                    setIsThinking(false);
                    setStreamBuffer('');
                    setToolEvents([]);
                    refreshMessages();
                    isRunning.current = false;
                    break;
            }
        });
        return unsub;
    }, [refreshMessages]);
    useInput((inputChar, key) => {
        if (setupMode)
            return;
        if (key.ctrl && inputChar === 'c') {
            if (isRunning.current || isThinking || toolAsk) {
                agent.cancel();
            }
            else {
                exit();
                process.exit(0);
            }
            return;
        }
        if (key.ctrl && inputChar === 'b') {
            setVerboseMode(v => !v);
            return;
        }
        if (toolAsk) {
            if (key.ctrl && inputChar === 'o') {
                setToolAskExpanded(prev => !prev);
                return;
            }
            if (inputChar?.toLowerCase() === 'y' || key.return) {
                agent.approveTool(toolAsk.id, true);
                setToolAsk(null);
                setIsThinking(true);
                return;
            }
            if (inputChar?.toLowerCase() === 'n' || key.escape) {
                agent.approveTool(toolAsk.id, false);
                setToolAsk(null);
                setIsThinking(true);
                return;
            }
            return;
        }
        if (key.escape) {
            if (showPalette) {
                setShowPalette(false);
                setInput('');
            }
            return;
        }
        if (showPalette) {
            if (key.upArrow) {
                setPaletteIndex(i => Math.max(0, i - 1));
                return;
            }
            if (key.downArrow) {
                setPaletteIndex(i => i + 1);
                return;
            }
            if (key.tab) {
                const cmds = getCommandList().filter(c => {
                    const q = input.toLowerCase().replace(/^\//, '');
                    return c.name.startsWith(q) || c.aliases?.some(a => a.startsWith(q));
                });
                const selected = cmds[paletteIndex % Math.max(1, cmds.length)];
                if (selected) {
                    setInput('/' + selected.name + ' ');
                }
                return;
            }
            if (key.return && !input.includes(' ')) {
                const q = input.toLowerCase().replace(/^\//, '');
                const cmds = getCommandList().filter(c => c.name.includes(q) || c.description.toLowerCase().includes(q) ||
                    (c.aliases?.some(a => a.includes(q)) ?? false));
                const selected = cmds[paletteIndex % Math.max(1, cmds.length)];
                if (selected) {
                    setInput('/' + selected.name + ' ');
                    setShowPalette(false);
                }
                return;
            }
        }
        if (key.backspace || key.delete) {
            const newInput = input.slice(0, -1);
            setInput(newInput);
            if (newInput === '' || newInput.length <= 1) {
                setShowPalette(false);
            }
            return;
        }
        if (key.return) {
            if (isRunning.current || !input.trim())
                return;
            const text = input.trim();
            setInput('');
            setShowPalette(false);
            setPaletteIndex(0);
            setLogoShown(false);
            handleSubmit(text);
            return;
        }
        if (!key.ctrl && !key.meta && inputChar) {
            const newVal = input + inputChar;
            setInput(newVal);
            if (newVal.startsWith('/')) {
                setShowPalette(true);
                setPaletteIndex(0);
            }
            else {
                setShowPalette(false);
            }
        }
    });
    const addSystemMessage = useCallback((content) => {
        setMessages(prev => [...prev, {
                role: 'system_output',
                content,
                timestamp: Date.now(),
            }]);
    }, []);
    const handleSubmit = useCallback(async (text) => {
        if (text.startsWith('/')) {
            await executeCommand(text, agent, addSystemMessage, (newTheme) => {
                const t = getTheme(newTheme);
                setTheme(t);
            }, () => {
                agent.clearHistory();
                setMessages([]);
            }, () => { exit(); process.exit(0); });
            refreshMessages();
            return;
        }
        if (isRunning.current)
            return;
        isRunning.current = true;
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
        await agent.send(text);
    }, [addSystemMessage, exit, refreshMessages]);
    if (setupMode) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Logo, { theme: theme }),
            React.createElement(SetupWizard, { theme: theme, onComplete: (provider, apiKey, model, newTheme) => {
                    agent.setApiKey(provider, apiKey);
                    agent.setProvider(provider);
                    agent.setModel(model);
                    setConfig('theme', newTheme);
                    setTheme(getTheme(newTheme));
                    setSetupMode(false);
                } })));
    }
    const displayMsgs = messages.map((m, i) => {
        if (m.role === 'system_output') {
            return { role: 'assistant', content: m.content, timestamp: m.timestamp };
        }
        return m;
    });
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        logoShown && messages.length === 0 && (React.createElement(Logo, { theme: theme })),
        React.createElement(MessageList, { messages: displayMsgs, theme: theme, toolEvents: toolEvents, streamBuffer: streamBuffer, isThinking: isThinking, verbose: verboseMode }),
        showPalette && (React.createElement(CommandPalette, { commands: getCommandList(), query: input, selectedIndex: paletteIndex, theme: theme, onSelect: (cmd) => {
                setInput('/' + cmd.name + ' ');
                setShowPalette(false);
            }, onClose: () => setShowPalette(false) })),
        toolAsk && (React.createElement(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.accent, paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { color: theme.accent, bold: true },
                "\u26A0 Agent wants to run: ",
                toolAsk.name),
            React.createElement(Box, { marginY: 0, paddingLeft: 1 }, toolAskExpanded ? (React.createElement(Text, { color: theme.secondary }, JSON.stringify(toolAsk.args, null, 2))) : (React.createElement(Text, { color: theme.secondary },
                JSON.stringify(toolAsk.args).replace(/\n/g, '\\n').slice(0, 100),
                JSON.stringify(toolAsk.args).length > 100 ? '...' : ''))),
            React.createElement(Text, { color: theme.muted, dimColor: true },
                "[Y/Enter] Approve  \u2022  [N/Esc] Reject  \u2022  [Ctrl+O] ",
                toolAskExpanded ? 'Collapse' : 'Expand'))),
        React.createElement(InputBar, { value: input, isThinking: isThinking, theme: theme, hasKey: hasApiKey() }),
        React.createElement(StatusBar, { provider: agent.provider, model: agent.model, themeName: theme.name, theme: theme, messageCount: messages.filter(m => m.role !== 'system_output').length, cwd: process.cwd() })));
}
//# sourceMappingURL=App.js.map