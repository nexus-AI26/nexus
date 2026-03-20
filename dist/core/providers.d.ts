export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    toolName?: string;
    toolCallId?: string;
    timestamp?: number;
}
export interface StreamChunk {
    type: 'text' | 'tool_call' | 'error' | 'done';
    content?: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    toolCallId?: string;
    error?: string;
}
export type StreamCallback = (chunk: StreamChunk) => void;
export interface ProviderOptions {
    apiKey: string;
    model: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    signal?: AbortSignal;
}
export interface Provider {
    name: string;
    chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void>;
}
export declare class OpenAIProvider implements Provider {
    name: string;
    chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void>;
}
export declare class AnthropicProvider implements Provider {
    name: string;
    chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void>;
}
export declare class OpenRouterProvider implements Provider {
    name: string;
    chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void>;
}
export declare function createProvider(name: string): Provider;
//# sourceMappingURL=providers.d.ts.map