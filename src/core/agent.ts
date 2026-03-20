import { getConfig, getApiKey, setConfig, setApiKey, hasApiKey, isFirstRun, PROVIDER_MODELS } from '../core/config.js';
import { createProvider, type Message, type StreamCallback } from '../core/providers.js';
import { executeTool } from '../core/tools.js';
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  compactMessages,
  type Session,
} from '../core/session.js';

export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_ask'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'tool_start'; name: string; args: Record<string, unknown> }
  | { type: 'tool_done'; name: string; output: string; success: boolean }
  | { type: 'error'; message: string }
  | { type: 'done' }
  | { type: 'thinking' };

export type AgentEventCallback = (event: AgentEvent) => void;

export class Agent {
  private session: Session;
  private listeners: AgentEventCallback[] = [];
  private pendingTools = new Map<string, (allow: boolean) => void>();
  private abortController: AbortController | null = null;

  constructor() {
    const cfg = getConfig();
    this.session = createSession(cfg.provider, cfg.model);
  }

  get messages(): Message[] { return this.session.messages; }
  get provider(): string { return this.session.provider; }
  get model(): string { return this.session.model; }
  get sessionId(): string { return this.session.id; }

  on(cb: AgentEventCallback): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private emit(event: AgentEvent) {
    for (const cb of this.listeners) cb(event);
  }

  async send(userMessage: string): Promise<void> {
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

    this.abortController = new AbortController();
    let keepGoing = true;

    while (keepGoing && this.abortController) {
      this.emit({ type: 'thinking' });
      keepGoing = false;
      
      const provider = createProvider(this.session.provider);
      let accText = '';
      const pendingReqTools: Array<{ id: string; name: string; args: Record<string, unknown> }> = [];

      const onChunk: StreamCallback = (chunk) => {
        if (chunk.type === 'text' && chunk.content) {
          accText += chunk.content;
          this.emit({ type: 'text', content: chunk.content });
        }
        if (chunk.type === 'error') {
          this.emit({ type: 'error', message: chunk.error ?? 'Unknown error' });
        }
        if (chunk.type === 'tool_call' && chunk.toolName) {
          pendingReqTools.push({
            id: chunk.toolCallId || Date.now().toString() + Math.random().toString(),
            name: chunk.toolName,
            args: (chunk.toolArgs ?? {}) as Record<string, unknown>
          });
        }
        // We ignore chunk.type === 'done' here, as we manually handle the end of the stream below.
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

        if (accText) {
          this.session.messages.push({ role: 'assistant', content: accText, timestamp: Date.now() });
        }

        if (pendingReqTools.length > 0) {
          keepGoing = true; 
          for (const tc of pendingReqTools) {
            if (!this.abortController) break;

            const isSafe = ['read_file', 'list_directory', 'search_files'].includes(tc.name);
            let approved = true;

            if (!isSafe) {
              this.emit({ type: 'tool_ask', id: tc.id, name: tc.name, args: tc.args });
              approved = await new Promise<boolean>((resolve) => {
                this.pendingTools.set(tc.id, resolve);
              });
            }

            if (!this.abortController) break;

            if (approved) {
              this.emit({ type: 'tool_start', name: tc.name, args: tc.args });
              const result = await executeTool(tc.name, tc.args);
              this.emit({ type: 'tool_done', name: tc.name, output: result.output, success: result.success });
              this.session.messages.push({
                role: 'tool',
                content: result.success ? result.output : `Error: ${result.error}`,
                toolName: tc.name,
                toolCallId: tc.id
              });
            } else {
              const rejectedMsg = 'User rejected this action.';
              this.emit({ type: 'tool_done', name: tc.name, output: rejectedMsg, success: false });
              this.session.messages.push({
                role: 'tool',
                content: rejectedMsg,
                toolName: tc.name,
                toolCallId: tc.id
              });
            }
          }
        } else {
          this.emit({ type: 'done' });
        }

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (accText) {
            this.session.messages.push({ role: 'assistant', content: accText + ' [cancelled]', timestamp: Date.now() });
          }
          this.emit({ type: 'done' });
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        this.emit({ type: 'error', message: msg });
        this.emit({ type: 'done' });
        keepGoing = false;
      }
    }

    this.abortController = null;
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    for (const resolve of this.pendingTools.values()) resolve(false);
    this.pendingTools.clear();
  }

  approveTool(id: string, allow: boolean) {
    const resolve = this.pendingTools.get(id);
    if (resolve) {
      resolve(allow);
      this.pendingTools.delete(id);
    }
  }

  clearHistory(): void {
    this.session.messages = [];
  }

  compact(): void {
    this.session.messages = compactMessages(this.session.messages);
  }

  setProvider(provider: string): void {
    this.session.provider = provider;
    setConfig('provider', provider as any);
    const models = PROVIDER_MODELS[provider];
    if (models && models.length > 0) {
      this.session.model = models[0]!;
      setConfig('model', models[0]!);
    }
  }

  setModel(model: string): void {
    this.session.model = model;
    setConfig('model', model);
  }

  saveCurrentSession(name?: string): string {
    saveSession(this.session, name);
    return name ?? this.session.name;
  }

  loadNamedSession(name: string): boolean {
    const s = loadSession(name);
    if (!s) return false;
    this.session = s;
    return true;
  }

  listSavedSessions() {
    return listSessions();
  }

  isFirstRun = isFirstRun;
  hasApiKey = hasApiKey;

  setApiKey(provider: string, key: string) {
    setApiKey(provider, key);
  }
}

export const agent = new Agent();
