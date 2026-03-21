import React from 'react';
import { Text, Box, Static } from 'ink';
import type { Theme } from '../themes/index.js';
import type { Message } from '../core/providers.js';
import { useTerminalWidth } from './useTerminalWidth.js';
import { WelcomeCard } from './Logo.js';

interface MessageListProps {
  messages: Message[];
  theme: Theme;
  toolEvents: ToolEvent[];
  streamBuffer: string;
  thoughtBuffer: string;
  isThinking: boolean;
  isWriting: boolean;
  showThinking: boolean;
  verbose: boolean;
  model: string;
  welcomeData?: {
    version: string;
    provider: string;
    model: string;
    cwd: string;
  };
}

export interface ToolEvent {
  type: 'start' | 'done' | 'update';
  name: string;
  args?: Record<string, unknown>;
  partialArgs?: string;
  output?: string;
  success?: boolean;
}

const TOOL_HEADING: Record<string, string> = {
  write_file: 'Write',
  read_file: 'Read',
  run_command: 'Shell',
  list_dir: 'List',
  glob: 'Glob',
};

function toolHeading(name: string): string {
  return TOOL_HEADING[name] ?? name;
}

function assistantMetaLine(width: number, ts: number, modelId: string): string {
  const time = new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  let meta = `${time} ${modelId}`;
  if ([...meta].length > width) {
    meta = meta.slice(0, Math.max(0, width - 1)) + '…';
  }
  const pad = Math.max(0, width - [...meta].length);
  return ' '.repeat(pad) + meta;
}

function CodeBlock({ code, theme }: { code: string; theme: Theme }) {
  const lines = code.split('\n');
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.border}
      paddingX={1}
      marginY={0}
    >
      {lines.map((line, i) => (
        <Text key={i} color={theme.secondary}>{line}</Text>
      ))}
    </Box>
  );
}

function renderContent(content: string, theme: Theme) {
  const codeBlockRe = /```(?:\w+)?\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<Text key={`t-${lastIndex}`} wrap="wrap">{renderInline(text, theme)}</Text>);
    }
    parts.push(<CodeBlock key={`c-${match.index}`} code={match[1] ?? ''} theme={theme} />);
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  const openMatch = remaining.match(/^(?:[\s\S]*?)\n?```(?:\w+)?\n?([\s\S]*)$/);

  if (openMatch) {
    const beforeOpen = remaining.split(/```/)[0];
    if (beforeOpen) {
      parts.push(<Text key="t-before-open" wrap="wrap">{renderInline(beforeOpen, theme)}</Text>);
    }
    parts.push(<CodeBlock key="c-open" code={openMatch[1] ?? ''} theme={theme} />);
  } else if (remaining) {
    parts.push(<Text key="t-end" wrap="wrap">{renderInline(remaining, theme)}</Text>);
  }

  return parts.length > 0 ? parts : [<Text key="empty" wrap="wrap">{renderInline(content, theme)}</Text>];
}

function renderInline(text: string, theme: Theme): React.ReactNode {
  const boldRe = /\*\*(.+?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Text key={m.index} bold color={theme.primary}>{m[1]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function MessageBubble({
  message,
  theme,
  verbose,
  terminalWidth,
  modelLabel,
}: {
  message: Message;
  theme: Theme;
  verbose: boolean;
  terminalWidth: number;
  modelLabel: string;
}) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  const isAssistant = message.role === 'assistant';

  const prefix = isUser
    ? <Text color={theme.accent} bold>❯ </Text>
    : isTool
    ? null
    : <Text color={theme.primary} bold>● </Text>;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {isAssistant && (
        <Text color={theme.muted} dimColor>
          {assistantMetaLine(terminalWidth, message.timestamp ?? Date.now(), modelLabel)}
        </Text>
      )}
      <Box flexDirection="row" alignItems="flex-start">
        {prefix}
        {isUser && <Text color={theme.accent} bold>{message.content}</Text>}
        {isTool && (
          <Box flexDirection="column" flexShrink={1}>
            <Text color={theme.primary} bold>
              ● {toolHeading(message.toolName || 'tool')}
            </Text>
            {(verbose ? message.content.split('\n') : [message.content.slice(0, 150) + (message.content.length > 150 ? '… (Ctrl+B to expand)' : '')]).map((line, i) => (
              <Box key={i} flexDirection="row">
                <Text color={theme.muted}>⎿ </Text>
                <Text color={theme.muted} wrap="wrap">{line || ' '}</Text>
              </Box>
            ))}
          </Box>
        )}
        {isAssistant && (
          <Box flexDirection="column" flexShrink={1}>
            {message.thought && (
              <Box marginBottom={1} flexDirection="column">
                <Text color={theme.muted} dimColor wrap="wrap">✻ {message.thought}</Text>
              </Box>
            )}
            {renderContent(message.content, theme)}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ToolEventRow({ event, theme, verbose, showWork }: { event: ToolEvent; theme: Theme; verbose: boolean; showWork: boolean }) {
  if (event.type === 'start' || event.type === 'update') {
    const isCodeWriteTool = ['write_file', 'edit_file', 'apply_patch'].includes(event.name);
    const pathValue = event.args && typeof event.args.path === 'string' ? event.args.path : null;
    let contentValue = event.args && typeof event.args.content === 'string' ? event.args.content : null;
    const actionLabel = isCodeWriteTool ? 'Writing' : 'Running';

    if (event.type === 'update' && isCodeWriteTool && event.partialArgs && !contentValue) {
      const contentMatch = event.partialArgs.match(/"content"\s*:\s*"([\s\S]*?)(?:"|$)/);
      if (contentMatch && contentMatch[1]) {
        contentValue = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }

    return (
      <Box flexDirection="column" marginLeft={2}>
        <Box>
          <Text color={theme.secondary} bold>✽ </Text>
          <Text color={theme.secondary}>{actionLabel} </Text>
          <Text color={theme.secondary} bold>{toolHeading(event.name)}</Text>
          {pathValue && <Text color={theme.muted}> ({pathValue})</Text>}
          <Text color={theme.muted}>…</Text>
        </Box>
        {!pathValue && event.type === 'update' && event.partialArgs?.includes('"path"') && (
          <Text color={theme.muted}>
            Path: {event.partialArgs?.match(/"path"\s*:\s*"([^"]*)"/)?.[1] ?? '…'}
          </Text>
        )}

        {(verbose || (showWork && isCodeWriteTool && contentValue)) && (
          <Box borderStyle="single" borderColor={theme.muted} paddingX={1} marginY={0} flexDirection="column">
            {isCodeWriteTool && contentValue ? (
              <CodeBlock code={contentValue} theme={theme} />
            ) : (
              <Text color={theme.muted}>{event.args ? JSON.stringify(event.args, null, 2) : (event.partialArgs ?? '')}</Text>
            )}
          </Box>
        )}
      </Box>
    );
  }
  return null;
}

export function MessageList({
  messages,
  theme,
  toolEvents,
  streamBuffer,
  thoughtBuffer,
  isThinking,
  isWriting,
  showThinking,
  verbose,
  model,
  welcomeData,
}: MessageListProps) {
  const staticMessages = messages.filter(m => m.role !== 'system');
  const w = useTerminalWidth();
  const modelLabel = model;

  const items = welcomeData 
    ? [{ role: 'welcome' as const, ...welcomeData }, ...staticMessages]
    : staticMessages;

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={0}>
      <Static items={items}>
        {(msg, i) => {
          if ((msg as any).role === 'welcome') {
             const d = msg as any;
             return (
               <WelcomeCard
                 key="welcome"
                 theme={theme}
                 version={d.version}
                 provider={d.provider}
                 model={d.model}
                 cwd={d.cwd}
               />
             );
          }
          return (
            <MessageBubble
              key={i}
              message={msg as Message}
              theme={theme}
              verbose={verbose}
              terminalWidth={w}
              modelLabel={modelLabel}
            />
          );
        }}
      </Static>

      {toolEvents.map((ev, i) => (
        <ToolEventRow key={i} event={ev} theme={theme} verbose={verbose} showWork={showThinking} />
      ))}

      {showThinking && isThinking && !isWriting && !streamBuffer && !thoughtBuffer && (
        <Box marginBottom={1}>
          <Text color={theme.muted}>✻ Thinking…</Text>
        </Box>
      )}

      {(thoughtBuffer || streamBuffer) && (
        <Box flexDirection="column" marginBottom={1}>
          {thoughtBuffer && showThinking && (
            <Box flexDirection="row" marginBottom={streamBuffer ? 1 : 0} alignItems="flex-start">
              <Text color={theme.muted}>✻ </Text>
              <Text color={theme.muted} dimColor wrap="wrap">{thoughtBuffer}</Text>
            </Box>
          )}
          {streamBuffer && (
            <>
              <Text color={theme.muted} dimColor>{assistantMetaLine(w, Date.now(), modelLabel)}</Text>
              <Box flexDirection="row" alignItems="flex-start">
                <Text color={theme.primary} bold>● </Text>
                <Box flexDirection="column" flexShrink={1}>
                  {renderContent(streamBuffer, theme)}
                </Box>
              </Box>
            </>
          )}
          {!streamBuffer && isWriting && !thoughtBuffer && (
            <Text color={theme.muted}>✻ Thinking…</Text>
          )}
        </Box>
      )}

      {verbose && (
        <Box marginTop={1} marginBottom={0} paddingLeft={2}>
          <Text color={theme.muted} dimColor>
            Detailed transcript · Ctrl+O to toggle reasoning · Ctrl+B verbose
          </Text>
        </Box>
      )}
    </Box>
  );
}
