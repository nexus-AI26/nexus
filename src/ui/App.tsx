import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useApp, measureElement } from 'ink';
import { getConfig, setConfig, isFirstRun, hasApiKey, setApiKey as setKey, PROVIDER_MODELS } from '../core/config.js';
import { getTheme, type Theme } from '../themes/index.js';
import { agent, type AgentEvent } from '../core/agent.js';
import { getCommandList, executeCommand } from '../commands/index.js';
import { Logo } from './Logo.js';
import { MessageList, type ToolEvent } from './MessageList.js';
import { InputBar } from './InputBar.js';
import { CommandPalette } from './CommandPalette.js';
import { StatusBar } from './StatusBar.js';
import { SetupWizard } from './SetupWizard.js';
import type { Message } from '../core/providers.js';

interface SystemMessage {
  role: 'system_output';
  content: string;
  timestamp: number;
}

type DisplayMessage = Message | SystemMessage;

export function App() {
  const { exit } = useApp();
  const cfg = getConfig();

  const [theme, setTheme] = useState<Theme>(getTheme(cfg.theme));
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [toolAsk, setToolAsk] = useState<{ id: string; name: string; args: Record<string, unknown> } | null>(null);
  const [toolAskExpanded, setToolAskExpanded] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [verboseMode, setVerboseMode] = useState(false);
  const [setupMode, setSetupMode] = useState(isFirstRun());
  const [logoShown, setLogoShown] = useState(true);
  const [pendingSubmission, setPendingSubmission] = useState<string | null>(null);
  const isRunning = useRef(false);

  const refreshMessages = useCallback(() => {
    setMessages([...agent.messages]);
  }, []);

  const resetForNewChat = useCallback(() => {
    agent.clearHistory();
    setMessages([]);
    setStreamBuffer('');
    setToolEvents([]);
    setToolAsk(null);
    setToolAskExpanded(false);
    setInput('');
    setShowPalette(false);
    setPaletteIndex(0);
    setIsThinking(false);
    setIsWriting(false);
    isRunning.current = false;
    setLogoShown(true);
    process.stdout.write('\x1Bc');
  }, []);

  useEffect(() => {
    refreshMessages();

    const unsub = agent.on((event: AgentEvent) => {
      switch (event.type) {
        case 'thinking':
          setIsThinking(true);
          setIsWriting(false);
          setStreamBuffer('');
          setToolEvents([]);
          break;
        case 'text':
          setIsWriting(prev => prev || true);
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
          setIsWriting(false);
          setStreamBuffer('');
          setMessages(prev => [...prev, {
            role: 'system_output' as const,
            content: `⚠ Error: ${event.message}`,
            timestamp: Date.now(),
          }]);
          isRunning.current = false;
          break;
        case 'done':
          setIsThinking(false);
          setIsWriting(false);
          setStreamBuffer('');
          setToolEvents([]);
          refreshMessages();
          isRunning.current = false;
          break;
      }
    });

    return unsub;
  }, [refreshMessages]);

  useEffect(() => {
    if (isRunning.current || !pendingSubmission) return;
    const next = pendingSubmission;
    setPendingSubmission(null);
    void handleSubmit(next);
  }, [pendingSubmission]);

  useInput((inputChar, key) => {
    if (setupMode) return;

    if (key.ctrl && inputChar === 'c') {
      if (isRunning.current || isThinking || toolAsk) {
        agent.cancel();
        setIsThinking(false);
        setIsWriting(false);
        setStreamBuffer('');
        setToolEvents([]);
        setToolAsk(null);
        setToolAskExpanded(false);
        isRunning.current = false;
      } else {
        exit();
        process.exit(0);
      }
      return;
    }

    if (key.ctrl && inputChar === 'b') {
      setVerboseMode(v => !v);
      return;
    }

    if (key.ctrl && inputChar === 'o' && !toolAsk) {
      setShowThinking(v => !v);
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
      if (showPalette) { setShowPalette(false); setInput(''); }
      return;
    }

    if (showPalette) {
      if (key.upArrow) { setPaletteIndex(i => Math.max(0, i - 1)); return; }
      if (key.downArrow) { setPaletteIndex(i => i + 1); return; }
      if (key.tab) {
        const cmds = getCommandList().filter(c => {
          const q = input.toLowerCase().replace(/^\//, '');
          return c.name.startsWith(q) || c.aliases?.some(a => a.startsWith(q));
        });
        const selected = cmds[paletteIndex % Math.max(1, cmds.length)];
        if (selected) { setInput('/' + selected.name + ' '); }
        return;
      }
      if (key.return && !input.includes(' ')) {
        const q = input.toLowerCase().replace(/^\//, '');
        const cmds = getCommandList().filter(c =>
          c.name.includes(q) || c.description.toLowerCase().includes(q) ||
          (c.aliases?.some(a => a.includes(q)) ?? false)
        );
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
      if (!input.trim()) return;
      const text = input.trim();
      setInput('');
      setShowPalette(false);
      setPaletteIndex(0);
      setLogoShown(false);
      if (isRunning.current) {
        setPendingSubmission(text);
        setMessages(prev => [...prev, {
          role: 'system_output' as const,
          content: 'Agent is busy. Your message was queued and will run next.',
          timestamp: Date.now(),
        }]);
        return;
      }
      handleSubmit(text);
      return;
    }

    if (!key.ctrl && !key.meta && inputChar) {
      const newVal = input + inputChar;
      setInput(newVal);
      if (newVal.startsWith('/')) {
        setShowPalette(true);
        setPaletteIndex(0);
      } else {
        setShowPalette(false);
      }
    }
  });

  const addSystemMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      role: 'system_output' as const,
      content,
      timestamp: Date.now(),
    }]);
  }, []);

  const handleSubmit = useCallback(async (text: string) => {
    if (text.startsWith('/')) {
      const slashCmd = text.trim().slice(1).split(/\s+/)[0]?.toLowerCase() ?? '';
      const result = await executeCommand(
        text,
        agent,
        addSystemMessage,
        (newTheme: string) => {
          const t = getTheme(newTheme);
          setTheme(t);
        },
        resetForNewChat,
        () => { exit(); process.exit(0); },
      );

      // For slash commands, keep system output visible in the chat.
      // Only force-refresh from agent history when the command explicitly mutates it.
      if (result.type === 'clear') {
        refreshMessages();
      } else if (slashCmd === 'load' || slashCmd === 'l') {
        refreshMessages();
      } else if (result.type === 'message' && result.message) {
        if (isRunning.current) return;
        isRunning.current = true;
        setMessages(prev => [...prev, { role: 'user' as const, content: text, timestamp: Date.now() }]);
        await agent.send(result.message);
      }
      return;
    }

    if (isRunning.current) return;
    isRunning.current = true;

    setMessages(prev => [...prev, { role: 'user' as const, content: text, timestamp: Date.now() }]);

    await agent.send(text);
  }, [addSystemMessage, exit, refreshMessages, resetForNewChat]);

  if (setupMode) {
    return (
      <Box flexDirection="column">
        <Logo theme={theme} />
        <SetupWizard
          theme={theme}
          onComplete={(provider, apiKey, model, newTheme) => {
            agent.setApiKey(provider, apiKey);
            agent.setProvider(provider);
            agent.setModel(model);
            setConfig('theme', newTheme);
            setTheme(getTheme(newTheme));
            setSetupMode(false);
          }}
        />
      </Box>
    );
  }

  const displayMsgs = messages.map((m, i) => {
    if ((m as SystemMessage).role === 'system_output') {
      return { role: 'assistant' as const, content: (m as SystemMessage).content, timestamp: (m as SystemMessage).timestamp };
    }
    return m as Message;
  });

  return (
    <Box flexDirection="column" height="100%">
      {logoShown && messages.length === 0 && (
        <Logo theme={theme} />
      )}

      <MessageList
        messages={displayMsgs}
        theme={theme}
        toolEvents={toolEvents}
        streamBuffer={streamBuffer}
        isThinking={isThinking}
        isWriting={isWriting}
        showThinking={showThinking}
        verbose={verboseMode}
      />

      {showPalette && (
        <CommandPalette
          commands={getCommandList()}
          query={input}
          selectedIndex={paletteIndex}
          theme={theme}
          onSelect={(cmd) => {
            setInput('/' + cmd.name + ' ');
            setShowPalette(false);
          }}
          onClose={() => setShowPalette(false)}
        />
      )}

      {toolAsk && (
        <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1} marginBottom={1}>
           <Text color={theme.accent} bold>⚠ Agent wants to run: {toolAsk.name}</Text>
           <Box marginY={0} paddingLeft={1}>
              {toolAskExpanded ? (
                <Text color={theme.secondary}>{JSON.stringify(toolAsk.args, null, 2)}</Text>
              ) : (
                <Text color={theme.secondary}>
                  {JSON.stringify(toolAsk.args).replace(/\n/g, '\\n').slice(0, 100)}
                  {JSON.stringify(toolAsk.args).length > 100 ? '...' : ''}
                </Text>
              )}
           </Box>
           <Text color={theme.muted} dimColor>
             [Y/Enter] Approve  •  [N/Esc] Reject  •  [Ctrl+O] {toolAskExpanded ? 'Collapse' : 'Expand'}
           </Text>
        </Box>
      )}

      <InputBar
        value={input}
        isThinking={isThinking}
        isWriting={isWriting}
        showThinking={showThinking}
        theme={theme}
        hasKey={hasApiKey()}
      />

      <StatusBar
        provider={agent.provider}
        model={agent.model}
        themeName={theme.name}
        theme={theme}
        messageCount={messages.filter(m => (m as any).role !== 'system_output').length}
        cwd={process.cwd()}
        showThinking={showThinking}
      />
    </Box>
  );
}
