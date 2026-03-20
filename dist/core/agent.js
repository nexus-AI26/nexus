import { getConfig, getApiKey, setConfig, setApiKey, hasApiKey, isFirstRun, PROVIDER_MODELS } from '../core/config.js';
import { createProvider } from '../core/providers.js';
import { executeTool } from '../core/tools.js';
import { createSession, saveSession, loadSession, listSessions, compactMessages, } from '../core/session.js';
export class Agent {
    session;
    listeners = [];
    pendingTools = new Map();
    abortController = null;
    constructor() {
        const cfg = getConfig();
        this.session = createSession(cfg.provider, cfg.model);
    }
    get messages() { return this.session.messages; }
    get provider() { return this.session.provider; }
    get model() { return this.session.model; }
    get sessionId() { return this.session.id; }
    on(cb) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }
    emit(event) {
        for (const cb of this.listeners)
            cb(event);
    }
    async send(userMessage) {
        const cfg = getConfig();
        const apiKey = getApiKey(this.session.provider);
        if (!apiKey) {
            this.emit({ type: 'error', message: `No API key for provider "${this.session.provider}". Run /key ${this.session.provider} <your-api-key>` });
            return;
        }
        this.session.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
        });
        this.emit({ type: 'thinking' });
        this.abortController = new AbortController();
        const provider = createProvider(this.session.provider);
        let accText = '';
        const onChunk = async (chunk) => {
            if (chunk.type === 'text' && chunk.content) {
                accText += chunk.content;
                this.emit({ type: 'text', content: chunk.content });
            }
            if (chunk.type === 'error') {
                this.emit({ type: 'error', message: chunk.error ?? 'Unknown error' });
            }
            if (chunk.type === 'tool_call' && chunk.toolName) {
                const args = (chunk.toolArgs ?? {});
                const id = chunk.toolCallId || Date.now().toString() + Math.random().toString();
                const isSafe = ['read_file', 'list_directory', 'search_files'].includes(chunk.toolName);
                let approved = true;
                if (!isSafe) {
                    this.emit({ type: 'tool_ask', id, name: chunk.toolName, args });
                    approved = await new Promise((resolve) => {
                        this.pendingTools.set(id, resolve);
                    });
                }
                if (approved) {
                    this.emit({ type: 'tool_start', name: chunk.toolName, args });
                    const result = await executeTool(chunk.toolName, args);
                    this.emit({ type: 'tool_done', name: chunk.toolName, output: result.output, success: result.success });
                    this.session.messages.push({
                        role: 'tool',
                        content: result.success ? result.output : `Error: ${result.error}`,
                        toolName: chunk.toolName,
                    });
                }
                else {
                    const rejectedMsg = 'User rejected this action.';
                    this.emit({ type: 'tool_done', name: chunk.toolName, output: rejectedMsg, success: false });
                    this.session.messages.push({
                        role: 'tool',
                        content: rejectedMsg,
                        toolName: chunk.toolName,
                    });
                }
            }
            if (chunk.type === 'done') {
                if (accText) {
                    this.session.messages.push({ role: 'assistant', content: accText, timestamp: Date.now() });
                    accText = '';
                }
                this.emit({ type: 'done' });
            }
        };
        try {
            await provider.chat(this.session.messages, {
                apiKey,
                model: this.session.model,
                baseUrl: cfg.customBaseUrl,
                maxTokens: cfg.maxTokens,
                temperature: cfg.temperature,
                systemPrompt: cfg.systemPrompt,
                signal: this.abortController.signal,
            }, onChunk);
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                if (accText) {
                    this.session.messages.push({ role: 'assistant', content: accText + ' [cancelled]', timestamp: Date.now() });
                    accText = '';
                }
                this.emit({ type: 'done' });
                return;
            }
            const msg = err instanceof Error ? err.message : String(err);
            this.emit({ type: 'error', message: msg });
            this.emit({ type: 'done' });
        }
        finally {
            this.abortController = null;
        }
    }
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        for (const resolve of this.pendingTools.values())
            resolve(false);
        this.pendingTools.clear();
    }
    approveTool(id, allow) {
        const resolve = this.pendingTools.get(id);
        if (resolve) {
            resolve(allow);
            this.pendingTools.delete(id);
        }
    }
    clearHistory() {
        this.session.messages = [];
    }
    compact() {
        this.session.messages = compactMessages(this.session.messages);
    }
    setProvider(provider) {
        this.session.provider = provider;
        setConfig('provider', provider);
        const models = PROVIDER_MODELS[provider];
        if (models && models.length > 0) {
            this.session.model = models[0];
            setConfig('model', models[0]);
        }
    }
    setModel(model) {
        this.session.model = model;
        setConfig('model', model);
    }
    saveCurrentSession(name) {
        saveSession(this.session, name);
        return name ?? this.session.name;
    }
    loadNamedSession(name) {
        const s = loadSession(name);
        if (!s)
            return false;
        this.session = s;
        return true;
    }
    listSavedSessions() {
        return listSessions();
    }
    isFirstRun = isFirstRun;
    hasApiKey = hasApiKey;
    setApiKey(provider, key) {
        setApiKey(provider, key);
    }
}
export const agent = new Agent();
//# sourceMappingURL=agent.js.map