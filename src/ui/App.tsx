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
  const [streamBuffer, setStreamBuffer] = useState('');
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [toolAsk, setToolAsk] = useState<{ id: string; name: string; args: Record<string, unknown> } | null>(null);
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

    const unsub = agent.on((event: AgentEvent) => {
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
            role: 'system_output' as const,
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
    if (setupMode) return;

    if (key.ctrl && inputChar === 'c') {
      if (isRunning.current || isThinking || toolAsk) {
        agent.cancel();
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
      if (isRunning.current || !input.trim()) return;
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
      await executeCommand(
        text,
        agent,
        addSystemMessage,
        (newTheme: string) => {
          const t = getTheme(newTheme);
          setTheme(t);
        },
        () => {
          agent.clearHistory();
          setMessages([]);
        },
        () => { exit(); process.exit(0); },
      );
      refreshMessages();
      return;
    }

    if (isRunning.current) return;
    isRunning.current = true;

    setMessages(prev => [...prev, { role: 'user' as const, content: text, timestamp: Date.now() }]);

    await agent.send(text);
  }, [addSystemMessage, exit, refreshMessages]);

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
      />
    </Box>
  );
}
