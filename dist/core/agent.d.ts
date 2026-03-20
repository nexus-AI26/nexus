import { hasApiKey, isFirstRun } from '../core/config.js';
import { type Message } from '../core/providers.js';
export type AgentEvent = {
    type: 'text';
    content: string;
} | {
    type: 'tool_ask';
    id: string;
    name: string;
    args: Record<string, unknown>;
} | {
    type: 'tool_start';
    name: string;
    args: Record<string, unknown>;
} | {
    type: 'tool_done';
    name: string;
    output: string;
    success: boolean;
} | {
    type: 'error';
    message: string;
} | {
    type: 'done';
} | {
    type: 'thinking';
};
export type AgentEventCallback = (event: AgentEvent) => void;
export declare class Agent {
    private session;
    private listeners;
    private pendingTools;
    private abortController;
    constructor();
    get messages(): Message[];
    get provider(): string;
    get model(): string;
    get sessionId(): string;
    on(cb: AgentEventCallback): () => void;
    private emit;
    send(userMessage: string): Promise<void>;
    cancel(): void;
    approveTool(id: string, allow: boolean): void;
    clearHistory(): void;
    compact(): void;
    setProvider(provider: string): void;
    setModel(model: string): void;
    saveCurrentSession(name?: string): string;
    loadNamedSession(name: string): boolean;
    listSavedSessions(): {
        name: string;
        updatedAt: number;
        messages: number;
    }[];
    isFirstRun: typeof isFirstRun;
    hasApiKey: typeof hasApiKey;
    setApiKey(provider: string, key: string): void;
}
export declare const agent: Agent;
//# sourceMappingURL=agent.d.ts.map