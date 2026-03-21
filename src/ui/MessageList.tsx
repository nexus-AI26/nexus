import React from 'react';
import { Text, Box } from 'ink';
import type { Theme } from '../themes/index.js';
import type { Message } from '../core/providers.js';

interface MessageListProps {
  messages: Message[];
  theme: Theme;
  toolEvents: ToolEvent[];
  streamBuffer: string;
  isThinking: boolean;
  isWriting: boolean;
  showThinking: boolean;
  thinkingLabel: string;
  verbose: boolean;
}

export interface ToolEvent {
  type: 'start' | 'done';
  name: string;
  args?: Record<string, unknown>;
  output?: string;
  success?: boolean;
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
    parts.push(<CodeBlock key={`c-${match.index}`} code={match[1]?.trim() ?? ''} theme={theme} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<Text key={`t-end`} wrap="wrap">{renderInline(content.slice(lastIndex), theme)}</Text>);
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

function MessageBubble({ message, theme, verbose }: { message: Message; theme: Theme; verbose: boolean }) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  const prefix = isUser
    ? <Text color={theme.accent} bold>❯ </Text>
    : isTool
    ? <Text color={theme.warning} bold>⚙ </Text>
    : <Text color={theme.primary} bold>✦ </Text>;

  const color = isUser ? theme.userMsg : isTool ? theme.toolMsg : theme.assistantMsg;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        {prefix}
        {isUser && <Text color={theme.accent} bold>{message.content}</Text>}
        {isTool && (
          <Box flexDirection="column" marginLeft={2}>
            <Text color={theme.warning} dimColor>Tool: {message.toolName}</Text>
            {verbose ? (
              <Box borderStyle="single" borderColor={theme.muted} paddingX={1} marginY={0}>
                <Text color={theme.muted} wrap="wrap">{message.content}</Text>
              </Box>
            ) : (
              <Text color={theme.muted} wrap="wrap">
                {message.content.slice(0, 150)}{message.content.length > 150 ? '… (press Ctrl+B to expand)' : ''}
              </Text>
            )}
          </Box>
        )}
        {!isUser && !isTool && (
          <Box flexDirection="column" flexShrink={1}>
            {renderContent(message.content, theme)}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ToolEventRow({ event, theme, verbose }: { event: ToolEvent; theme: Theme; verbose: boolean }) {
  if (event.type === 'start') {
    const isCodeWriteTool = ['write_file', 'edit_file', 'apply_patch'].includes(event.name);
    const pathValue = event.args && typeof event.args.path === 'string' ? event.args.path : null;
    const actionLabel = isCodeWriteTool ? 'Writing code' : 'Running';
    return (
      <Box flexDirection="column" marginLeft={2}>
        <Box>
          <Text color={theme.warning}>⚙ {actionLabel} </Text>
          <Text color={theme.secondary} bold>{event.name}</Text>
          <Text color={theme.warning}> …</Text>
        </Box>
        {isCodeWriteTool && pathValue && (
          <Text color={theme.muted}>Path: {pathValue}</Text>
        )}
        {verbose && event.args && Object.keys(event.args).length > 0 && (
          <Box borderStyle="single" borderColor={theme.muted} paddingX={1} marginY={0}>
             <Text color={theme.muted}>{JSON.stringify(event.args, null, 2)}</Text>
          </Box>
        )}
      </Box>
    );
  }
  return null;
}

export function MessageList({ messages, theme, toolEvents, streamBuffer, isThinking, isWriting, showThinking, thinkingLabel, verbose }: MessageListProps) {
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {displayMessages.map((msg, i) => (
        <MessageBubble key={i} message={msg} theme={theme} verbose={verbose} />
      ))}

      {toolEvents.map((ev, i) => (
        <ToolEventRow key={i} event={ev} theme={theme} verbose={verbose} />
      ))}

      {showThinking && isThinking && !isWriting && !streamBuffer && (
        <Box>
          <Text color={theme.primary} bold>✦ </Text>
          <Text color={theme.muted}>{thinkingLabel}</Text>
        </Box>
      )}

      {showThinking && isWriting && !streamBuffer && (
        <Box>
          <Text color={theme.primary} bold>✦ </Text>
          <Text color={theme.muted}>writing</Text>
          <Text color={theme.primary}>…</Text>
        </Box>
      )}

      {streamBuffer && (
        <Box flexDirection="column">
          <Box>
            <Text color={theme.primary} bold>✦ </Text>
            <Box flexDirection="column" flexShrink={1}>
              {renderContent(streamBuffer, theme)}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
