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

const defaults: NexusConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  theme: 'dracula',
  apiKeys: {},
  maxTokens: 4096,
  temperature: 0.7,
  autoApproveShell: false,
};

let store: Conf<NexusConfig>;

export function getStore(): Conf<NexusConfig> {
  if (!store) {
    store = new Conf<NexusConfig>({
      projectName: 'nexus',
      defaults,
    });
  }
  return store;
}

export function getConfig(): NexusConfig {
  const s = getStore();
  return {
    provider: s.get('provider'),
    model: s.get('model'),
    theme: s.get('theme'),
    apiKeys: s.get('apiKeys'),
    customBaseUrl: s.get('customBaseUrl'),
    systemPrompt: s.get('systemPrompt'),
    maxTokens: s.get('maxTokens'),
    temperature: s.get('temperature'),
    autoApproveShell: s.get('autoApproveShell'),
  };
}

export function setConfig<K extends keyof NexusConfig>(key: K, value: NexusConfig[K]): void {
  getStore().set(key, value);
}

export function setApiKey(provider: string, key: string): void {
  const keys = getStore().get('apiKeys') as Record<string, string>;
  keys[provider] = key;
  getStore().set('apiKeys', keys);
}

export function getApiKey(provider?: string): string {
  const keys = getStore().get('apiKeys') as Record<string, string>;
  const p = provider ?? getStore().get('provider');
  return keys[p] ?? '';
}

export function hasApiKey(provider?: string): boolean {
  return !!getApiKey(provider);
}

export function isFirstRun(): boolean {
  const keys = getStore().get('apiKeys') as Record<string, string>;
  return Object.keys(keys).length === 0;
}

export const PROVIDER_MODELS: Record<ProviderName | string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  openrouter: [
    'openrouter/auto',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.5-pro-exp-03-25:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'deepseek/deepseek-v3-base:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'anthropic/claude-3-5-sonnet',
    'openai/gpt-4o',
  ],
  custom: [],
};
