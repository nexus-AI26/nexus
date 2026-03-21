import React from 'react';
import { Text, Box } from 'ink';
import { agent } from '../core/agent.js';
import type { Theme } from '../themes/index.js';
import type { Message } from '../core/providers.js';

interface MessageListProps {
  messages: Message[];
  theme: Theme;
  toolEvents: ToolEvent[];
  streamBuffer: string;
  thoughtBuffer: string;
  isThinking: boolean;
  isWriting: boolean;
  showThinking: boolean;
  thinkingLabel: string;
  verbose: boolean;
  lastResponseTime: number | null;
}

export interface ToolEvent {
  type: 'start' | 'done' | 'update';
  name: string;
  args?: Record<string, unknown>;
  partialArgs?: string;
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
    parts.push(<CodeBlock key={`c-${match.index}`} code={match[1] ?? ''} theme={theme} />);
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  const openMatch = remaining.match(/^(?:[\s\S]*?)\n?```(?:\w+)?\n?([\s\S]*)$/);
  
  if (openMatch) {
    // If there's content before the open block in 'remaining', we should render it
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

function MessageBubble({ message, theme, verbose }: { message: Message; theme: Theme; verbose: boolean }) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  const isAssistant = message.role === 'assistant';

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
        {isAssistant && (
          <Box flexDirection="column" flexShrink={1}>
            {message.thought && (
              <Box borderStyle="round" borderColor={theme.muted} paddingX={1} marginBottom={1} flexDirection="column">
                <Text color={theme.muted} italic>Thinking: {message.thought}</Text>
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
    const actionLabel = isCodeWriteTool ? 'Writing code' : 'Running';
    
    // If it's a stream update, try to extract partial content if it's a code tool
    if (event.type === 'update' && isCodeWriteTool && event.partialArgs && !contentValue) {
      const contentMatch = event.partialArgs.match(/"content"\s*:\s*"([\s\S]*?)(?:"|$)/);
      if (contentMatch && contentMatch[1]) {
        contentValue = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }

    return (
      <Box flexDirection="column" marginLeft={2}>
        <Box>
          <Text color={theme.warning}>⚙ {actionLabel} </Text>
          <Text color={theme.secondary} bold>{event.name}</Text>
          <Text color={theme.warning}> …</Text>
        </Box>
        {(pathValue || (event.type === 'update' && event.partialArgs?.includes('"path"'))) && (
          <Text color={theme.muted}>Path: {pathValue ?? (event.partialArgs?.match(/"path"\s*:\s*"([^"]*)"/)?.[1] ?? '...')}</Text>
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
  thinkingLabel,
  verbose,
  lastResponseTime
}: MessageListProps) {
  const displayMessages = messages.filter(m => m.role !== 'system');

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {displayMessages.map((msg, i) => (
        <MessageBubble key={i} message={msg} theme={theme} verbose={verbose} />
      ))}

      {toolEvents.map((ev, i) => (
        <ToolEventRow key={i} event={ev} theme={theme} verbose={verbose} showWork={showThinking} />
      ))}

      {showThinking && isThinking && !isWriting && !streamBuffer && !thoughtBuffer && (
        <Box>
          <Text color={theme.primary} bold>✦ </Text>
          <Text color={theme.muted}>{thinkingLabel}</Text>
        </Box>
      )}

      {(thoughtBuffer || streamBuffer) && (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={theme.primary} bold>✦ </Text>
            <Box flexDirection="column" flexShrink={1}>
              {thoughtBuffer && (
                <Box borderStyle="round" borderColor={theme.muted} paddingX={1} marginBottom={1} flexDirection="column">
                  <Text color={theme.muted} italic>Thinking: {thoughtBuffer}</Text>
                </Box>
              )}
              {streamBuffer ? renderContent(streamBuffer, theme) : (isWriting && (
                <Box>
                   <Text color={theme.muted}>writing</Text>
                   <Text color={theme.primary}>…</Text>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {lastResponseTime !== null && displayMessages.length > 0 && displayMessages[displayMessages.length - 1]?.role === 'assistant' && !isThinking && !isWriting && (
        <Box marginLeft={2} marginBottom={1}>
           <Text color={theme.muted}>▣ Build · </Text>
           <Text color={theme.muted} dimColor>{agent.model} · {(lastResponseTime / 1000).toFixed(1)}s</Text>
        </Box>
      )}
    </Box>
  );
}
