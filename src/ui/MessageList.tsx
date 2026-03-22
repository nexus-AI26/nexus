import React, { memo, useMemo, useCallback } from 'react';
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

// Global caches for performance
const contentRenderCache = new Map<string, React.ReactNode[]>();
const inlineRenderCache = new Map<string, React.ReactNode>();
const metaLineCache = new Map<string, string>();

const assistantMetaLine = (width: number, ts: number, modelId: string): string => {
  const cacheKey = `${width}-${ts}-${modelId}`;
  if (metaLineCache.has(cacheKey)) {
    return metaLineCache.get(cacheKey)!;
  }
  const time = new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  let meta = `${time} ${modelId}`;
  if ([...meta].length > width) {
    meta = meta.slice(0, Math.max(0, width - 1)) + '…';
  }
  const pad = Math.max(0, width - [...meta].length);
  const result = ' '.repeat(pad) + meta;
  metaLineCache.set(cacheKey, result);
  return result;
};

const CodeBlock = memo(({ code, theme }: { code: string; theme: Theme }) => {
  const lines = useMemo(() => code.split('\n'), [code]);
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.border}
      paddingX={1}
      marginY={0}
    >
      {lines.map((line, i) => (
        <Box key={i} flexDirection="row">
          <Box width={4} marginRight={1}>
            <Text color={theme.muted} dimColor>{String(i + 1).padStart(3)}</Text>
          </Box>
          <Text color={theme.secondary}>{line || ' '}</Text>
        </Box>
      ))}
    </Box>
  );
});

const renderContent = (content: string, theme: Theme) => {
  const cacheKey = `${content.substring(0, 100)}|${theme.primary}`;
  if (contentRenderCache.has(cacheKey)) {
    return contentRenderCache.get(cacheKey)!;
  }

  const codeBlockRe = /```(?:\w+)?\n?([\s\S]*?)```/g;
  const renderedParts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      renderedParts.push(<Text key={`t-${lastIndex}`} wrap="wrap">{renderInline(text, theme)}</Text>);
    }
    renderedParts.push(<CodeBlock key={`c-${match.index}`} code={match[1] ?? ''} theme={theme} />);
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  const openMatch = remaining.match(/^(?:[\s\S]*?)\n?```(?:\w+)?\n?([\s\S]*)$/);

  if (openMatch) {
    const beforeOpen = remaining.split(/```/)[0];
    if (beforeOpen) {
      renderedParts.push(<Text key="t-before-open" wrap="wrap">{renderInline(beforeOpen, theme)}</Text>);
    }
    renderedParts.push(<CodeBlock key="c-open" code={openMatch[1] ?? ''} theme={theme} />);
  } else if (remaining) {
    renderedParts.push(<Text key="t-end" wrap="wrap">{renderInline(remaining, theme)}</Text>);
  }

  const result = renderedParts.length > 0 ? renderedParts : [<Text key="empty" wrap="wrap">{renderInline(content, theme)}</Text>];
  
  // Limit cache size to prevent memory leaks
  if (contentRenderCache.size > 100) {
    const firstKey = contentRenderCache.keys().next().value;
    if (firstKey) contentRenderCache.delete(firstKey);
  }
  
  contentRenderCache.set(cacheKey, result);
  return result;
};

const renderInline = (text: string, theme: Theme): React.ReactNode => {
  const cacheKey = `${text}|${theme.primary}`;
  if (inlineRenderCache.has(cacheKey)) {
    return inlineRenderCache.get(cacheKey)!;
  }

  const boldRe = /\*\*(.+?)\*\*/g;
  const renderedParts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) renderedParts.push(text.slice(last, m.index));
    renderedParts.push(<Text key={m.index} bold color={theme.primary}>{m[1]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < text.length) renderedParts.push(text.slice(last));
  
  const result = <>{renderedParts}</>;
  
  // Limit cache size to prevent memory leaks
  if (inlineRenderCache.size > 200) {
    const firstKey = inlineRenderCache.keys().next().value;
    if (firstKey) inlineRenderCache.delete(firstKey);
  }
  
  inlineRenderCache.set(cacheKey, result);
  return result;
};

const MessageBubble = memo(({
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
}) => {
  const isUser = useMemo(() => message.role === 'user', [message.role]);
  const isTool = useMemo(() => message.role === 'tool', [message.role]);
  const isAssistant = useMemo(() => message.role === 'assistant', [message.role]);

  const prefix = useMemo(() => {
    if (isUser) return <Text color={theme.accent} bold>❯ </Text>;
    if (isTool) return null;
    return <Text color={theme.primary}>● </Text>;
  }, [isUser, isTool, theme.accent, theme.primary]);

  const toolLines = useMemo(() => {
    if (!isTool || !verbose) return null;
    return message.content.split('\n');
  }, [isTool, verbose, message.content]);

  const truncatedContent = useMemo(() => {
    if (isTool && !verbose) {
      const content = message.content;
      return content.length > 150 ? content.slice(0, 150) + '… (Ctrl+B to expand)' : content;
    }
    return message.content;
  }, [isTool, verbose, message.content]);

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
            <Text color={theme.primary}>
              ● {toolHeading(message.toolName || 'tool')}
            </Text>
            {(toolLines || [truncatedContent]).map((line, i) => (
              <Box key={i} flexDirection="row">
                <Text color={theme.muted} dimColor>  ⎿ </Text>
                <Text color={theme.muted} dimColor wrap="truncate">{line || ' '}</Text>
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
});

const ToolEventRow = memo(({ event, theme, verbose, showWork, w }: { event: ToolEvent; theme: Theme; verbose: boolean; showWork: boolean; w: number }) => {
  const isCodeWriteTool = useMemo(() => ['write_file', 'edit_file', 'apply_patch'].includes(event.name), [event.name]);
  const pathValue = useMemo(() => event.args && typeof event.args.path === 'string' ? event.args.path : null, [event.args]);
  
  const contentValue = useMemo(() => {
    if (event.type === 'update' && event.partialArgs && !pathValue) {
      const contentMatch = event.partialArgs.match(/"content"\s*:\s*"([\s\S]*?)(?:"|$)/);
      const commandMatch = event.partialArgs.match(/"command"\s*:\s*"([\s\S]*?)(?:"|$)/);
      const pathMatch = event.partialArgs.match(/"path"\s*:\s*"([\s\S]*?)(?:"|$)/);
      
      if (contentMatch && contentMatch[1]) {
        return contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      if (commandMatch && commandMatch[1]) {
        return commandMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }
    return event.args && typeof event.args.content === 'string' ? event.args.content : null;
  }, [event.type, event.partialArgs, event.args, pathValue]);

  const displayPath = useMemo(() => {
    if (pathValue) return pathValue;
    if (event.type === 'update' && event.partialArgs) {
      const pathMatch = event.partialArgs.match(/"path"\s*:\s*"([\s\S]*?)(?:"|$)/);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1].replace(/\\"/g, '"');
      }
    }
    return '…';
  }, [pathValue, event.type, event.partialArgs]);

  if (event.type === 'start' || event.type === 'update') {
    return (
      <Box flexDirection="column" marginLeft={0} marginBottom={1}>
        <Box>
          <Text color={theme.primary}>● </Text>
          <Text color={theme.secondary}>{toolHeading(event.name)}</Text>
          <Text color={theme.muted} dimColor>({displayPath})</Text>
        </Box>
        {event.type === 'start' && (
           <Box flexDirection="row">
              <Text color={theme.muted} dimColor>  ⎿ </Text>
              <Text color={theme.muted} italic dimColor>Running…</Text>
           </Box>
        )}
        {event.type === 'update' && (
           <Box flexDirection="row">
              <Text color={theme.muted} dimColor>  ⎿ </Text>
              <Text color={theme.muted} italic dimColor>{contentValue ? 'streaming…' : 'preparing…'}</Text>
           </Box>
        )}
        {(verbose || (showWork && contentValue)) && (
          <Box flexDirection="column" marginTop={1}>
             {(isCodeWriteTool || event.name === 'run_command') && (
               <Box flexDirection="column" marginBottom={0}>
                  <Text color={theme.muted} dimColor>{'─'.repeat(w - 4)}</Text>
                  <Text color={theme.secondary}> {isCodeWriteTool ? 'Writing file' : 'Running command'}</Text>
                  <Text color={theme.secondary}> {displayPath}</Text>
                  <Text color={theme.muted} dimColor>{'╌'.repeat(w - 4)}</Text>
               </Box>
             )}
            <Box borderStyle="single" borderColor={theme.muted} paddingX={1} marginY={0} flexDirection="column" borderTop={false} borderBottom={false} borderLeft={false} borderRight={false}>
              {contentValue ? (
                <CodeBlock code={contentValue} theme={theme} />
              ) : (
                <Text color={theme.muted}>{event.args ? JSON.stringify(event.args, null, 2) : (event.partialArgs ?? '')}</Text>
              )}
            </Box>
            {(isCodeWriteTool || event.name === 'run_command') && <Text color={theme.muted} dimColor>{'╌'.repeat(w - 4)}</Text>}
          </Box>
        )}
      </Box>
    );
  }

  if (event.type === 'done') {
    return (
       <Box flexDirection="row" marginBottom={1}>
          <Text color={theme.primary}>● </Text>
          <Text color={theme.secondary}>{toolHeading(event.name)}</Text>
          <Text color={theme.muted} dimColor>  ⎿ {event.success ? 'Done' : 'Failed'}</Text>
       </Box>
    );
  }

  return null;
});

export const MessageList = memo(({
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
}: MessageListProps) => {
  const staticMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages]);
  const w = useTerminalWidth();
  const modelLabel = model;

  const items = useMemo(() => {
    return welcomeData 
      ? [{ role: 'welcome' as const, ...welcomeData }, ...staticMessages]
      : staticMessages;
  }, [welcomeData, staticMessages]);

  // Windowing for "contained" look. Show last 10 items to avoid terminal overflow in Windows.
  const windowedItems = useMemo(() => items.slice(-10), [items]);

  const streamComponents = useMemo(() => {
    const components: React.ReactNode[] = [];
    
    toolEvents.forEach((ev, i) => {
      components.push(
        <ToolEventRow key={i} event={ev} theme={theme} verbose={verbose} showWork={showThinking} w={w} />
      );
    });

    if (thoughtBuffer || streamBuffer) {
      components.push(
        <Box key="stream" flexDirection="column" marginBottom={1}>
          {thoughtBuffer && showThinking && (
            <Box flexDirection="row" marginBottom={streamBuffer ? 1 : 0} alignItems="flex-start">
              <Text color={theme.muted}>✻ </Text>
              <Text color={theme.muted} dimColor wrap="wrap">{thoughtBuffer}</Text>
            </Box>
          )}
          {streamBuffer && (
            <Box flexDirection="column">
              <Text color={theme.muted} dimColor>{assistantMetaLine(w, Date.now(), modelLabel)}</Text>
              <Box flexDirection="row" alignItems="flex-start">
                <Text color={theme.primary}>● </Text>
                <Box flexDirection="column" flexShrink={1}>
                  {renderContent(streamBuffer, theme)}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (showThinking && isThinking && !isWriting && !streamBuffer && !thoughtBuffer) {
      components.push(
        <Box key="thinking" marginBottom={1}>
          <Text color={theme.muted}>✻ Thinking…</Text>
        </Box>
      );
    }

    return components;
  }, [toolEvents, thoughtBuffer, streamBuffer, showThinking, isThinking, isWriting, theme, verbose, w, modelLabel]);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={0} overflow="hidden">
      {windowedItems.map((msg, i) => {
        if ((msg as any).role === 'welcome') {
           const d = msg as any;
           return (
             <Box key="welcome" flexDirection="column">
               <WelcomeCard
                  version={d.version}
                  provider={d.provider}
                  model={d.model}
                  cwd={d.cwd}
                  theme={theme}
               />
               {verbose && (
                 <Box paddingLeft={2} marginBottom={1}>
                   <Text color={theme.muted} dimColor>
                     Detailed transcript · Ctrl+O to toggle reasoning · Ctrl+B verbose
                   </Text>
                 </Box>
               )}
             </Box>
           );
        }
        return (
          <Box key={i} paddingLeft={2}>
            <MessageBubble 
              message={msg as Message} 
              theme={theme} 
              verbose={verbose} 
              terminalWidth={w} 
              modelLabel={modelLabel} 
            />
          </Box>
        );
      })}

      <Box flexDirection="column" paddingLeft={2}>
        {streamComponents}
      </Box>
    </Box>
  );
});
