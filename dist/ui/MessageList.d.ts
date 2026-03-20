import React from 'react';
import type { Theme } from '../themes/index.js';
import type { Message } from '../core/providers.js';
interface MessageListProps {
    messages: Message[];
    theme: Theme;
    toolEvents: ToolEvent[];
    streamBuffer: string;
    isThinking: boolean;
    verbose: boolean;
}
export interface ToolEvent {
    type: 'start' | 'done';
    name: string;
    args?: Record<string, unknown>;
    output?: string;
    success?: boolean;
}
export declare function MessageList({ messages, theme, toolEvents, streamBuffer, isThinking, verbose }: MessageListProps): React.JSX.Element;
export {};
//# sourceMappingURL=MessageList.d.ts.map