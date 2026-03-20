import Conf from 'conf';
export type ProviderName = 'openai' | 'anthropic' | 'openrouter' | 'custom';
export interface NexusConfig {
    provider: ProviderName;
    model: string;
    theme: string;
    apiKeys: Record<string, string>;
    customBaseUrl?: string;
    systemPrompt?: string;
    maxTokens: number;
    temperature: number;
    autoApproveShell: boolean;
}
export declare function getStore(): Conf<NexusConfig>;
export declare function getConfig(): NexusConfig;
export declare function setConfig<K extends keyof NexusConfig>(key: K, value: NexusConfig[K]): void;
export declare function setApiKey(provider: string, key: string): void;
export declare function getApiKey(provider?: string): string;
export declare function hasApiKey(provider?: string): boolean;
export declare function isFirstRun(): boolean;
export declare const PROVIDER_MODELS: Record<ProviderName | string, string[]>;
//# sourceMappingURL=config.d.ts.map