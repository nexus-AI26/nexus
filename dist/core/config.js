import Conf from 'conf';
const defaults = {
    provider: 'openai',
    model: 'gpt-4o',
    theme: 'dracula',
    apiKeys: {},
    maxTokens: 4096,
    temperature: 0.7,
    autoApproveShell: false,
};
let store;
export function getStore() {
    if (!store) {
        store = new Conf({
            projectName: 'nexus',
            defaults,
        });
    }
    return store;
}
export function getConfig() {
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
export function setConfig(key, value) {
    getStore().set(key, value);
}
export function setApiKey(provider, key) {
    const keys = getStore().get('apiKeys');
    keys[provider] = key;
    getStore().set('apiKeys', keys);
}
export function getApiKey(provider) {
    const keys = getStore().get('apiKeys');
    const p = provider ?? getStore().get('provider');
    return keys[p] ?? '';
}
export function hasApiKey(provider) {
    return !!getApiKey(provider);
}
export function isFirstRun() {
    const keys = getStore().get('apiKeys');
    return Object.keys(keys).length === 0;
}
export const PROVIDER_MODELS = {
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
//# sourceMappingURL=config.js.map