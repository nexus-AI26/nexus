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


export class OpenAIProvider implements Provider {
  name = 'openai';

  async chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void> {
    const { default: fetch } = await import('node-fetch');
    const baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    const url = `${baseUrl}/chat/completions`;

    const msgs = buildOpenAIMessages(messages, options.systemPrompt);

    const res = await fetch(url, {
      method: 'POST',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: msgs,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        stream: true,
        tools: getToolDefinitions(),
        tool_choice: 'auto',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      onChunk({ type: 'error', error: `API Error ${res.status}: ${errText}` });
      return;
    }

    await parseSSEStream(res.body as NodeJS.ReadableStream, onChunk);
  }
}


export class AnthropicProvider implements Provider {
  name = 'anthropic';

  async chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void> {
    const { default: fetch } = await import('node-fetch');
    const url = 'https://api.anthropic.com/v1/messages';

    const userMessages = messages.filter(m => m.role !== 'system');
    const systemMsg = options.systemPrompt ??
      messages.find(m => m.role === 'system')?.content ??
      'You are a helpful AI coding assistant.';

    const res = await fetch(url, {
      method: 'POST',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': options.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens ?? 4096,
        system: systemMsg,
        messages: userMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        stream: true,
        tools: getAnthropicToolDefinitions(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      onChunk({ type: 'error', error: `API Error ${res.status}: ${errText}` });
      return;
    }

    await parseAnthropicStream(res.body as NodeJS.ReadableStream, onChunk);
  }
}


export class OpenRouterProvider implements Provider {
  name = 'openrouter';

  async chat(messages: Message[], options: ProviderOptions, onChunk: StreamCallback): Promise<void> {
    const { default: fetch } = await import('node-fetch');
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const msgs = buildOpenAIMessages(messages, options.systemPrompt);

    const isFreeOrAuto = options.model.endsWith(':free') || options.model === 'openrouter/auto';
    const toolsPayload = isFreeOrAuto ? {} : { tools: getToolDefinitions(), tool_choice: 'auto' };

    const body = {
      model: options.model,
      messages: msgs,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
      provider: {
        allow_fallbacks: true,
        data_collection: 'deny',
      },
      transforms: ['middle-out'],
      ...toolsPayload,
    };

    const res = await fetch(url, {
      method: 'POST',
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`,
        'HTTP-Referer': 'https://github.com/nexus-cli',
        'X-Title': 'nexus',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      onChunk({ type: 'error', error: `OpenRouter API Error ${res.status}: ${errText}` });
      return;
    }

    await parseSSEStream(res.body as NodeJS.ReadableStream, onChunk);
  }
}


export function createProvider(name: string): Provider {
  switch (name) {
    case 'anthropic': return new AnthropicProvider();
    case 'openrouter': return new OpenRouterProvider();
    case 'custom':
    case 'openai':
    default:
      return new OpenAIProvider();
  }
}


function buildOpenAIMessages(messages: Message[], systemPrompt?: string) {
  const out: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    out.push({ role: 'system', content: systemPrompt });
  } else {
    out.push({ role: 'system', content: 'You are nexus, an expert AI coding assistant. Help the user write, debug, and understand code. You can read and write files and run shell commands when needed.' });
  }
  for (const m of messages) {
    if (m.role === 'system') continue;
    out.push({ role: m.role === 'tool' ? 'user' : m.role, content: m.content });
  }
  return out;
}

function getToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a file from the filesystem',
        parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path to read' } }, required: ['path'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Execute a shell command and return its output',
        parameters: { type: 'object', properties: { command: { type: 'string', description: 'Command to execute' } }, required: ['command'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_directory',
        description: 'List files in a directory',
        parameters: { type: 'object', properties: { path: { type: 'string', description: 'Directory path (default: current)' } }, required: [] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_files',
        description: 'Search for a pattern in files',
        parameters: { type: 'object', properties: { pattern: { type: 'string' }, directory: { type: 'string' } }, required: ['pattern'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web and return top links',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query string' },
            limit: { type: 'number', description: 'Max number of results to return (1-10)' },
          },
          required: ['query'],
        },
      },
    },
  ];
}

function getAnthropicToolDefinitions() {
  return [
    { name: 'read_file', description: 'Read the contents of a file', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
    { name: 'write_file', description: 'Write content to a file', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
    { name: 'run_command', description: 'Execute a shell command', input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
    { name: 'list_directory', description: 'List files in a directory', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: [] } },
    { name: 'search_files', description: 'Search for a pattern in files', input_schema: { type: 'object', properties: { pattern: { type: 'string' }, directory: { type: 'string' } }, required: ['pattern'] } },
    { name: 'web_search', description: 'Search the web and return top links', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
  ];
}

async function parseSSEStream(stream: NodeJS.ReadableStream, onChunk: StreamCallback): Promise<void> {
  const { createParser } = await import('eventsource-parser');
  let toolCallBuffer: { id: string; name: string; args: string } | null = null;

  return new Promise((resolve, reject) => {
    const parser = createParser((event) => {
      if (event.type !== 'event') return;
      if (event.data === '[DONE]') {
        if (toolCallBuffer) {
          try {
            const args = JSON.parse(toolCallBuffer.args || '{}');
            onChunk({ type: 'tool_call', toolName: toolCallBuffer.name, toolArgs: args, toolCallId: toolCallBuffer.id });
          } catch {}
        }
        onChunk({ type: 'done' });
        resolve();
        return;
      }
      try {
        const data = JSON.parse(event.data);
        const delta = data.choices?.[0]?.delta;
        if (!delta) return;

        if (delta.content) {
          onChunk({ type: 'text', content: delta.content });
        }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.id) {
              toolCallBuffer = { id: tc.id, name: tc.function?.name ?? '', args: tc.function?.arguments ?? '' };
            } else if (toolCallBuffer) {
              toolCallBuffer.args += tc.function?.arguments ?? '';
              if (tc.function?.name) toolCallBuffer.name = tc.function.name;
            }
          }
        }
      } catch {}
    });

    stream.on('data', (chunk: Buffer) => parser.feed(chunk.toString()));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
}

async function parseAnthropicStream(stream: NodeJS.ReadableStream, onChunk: StreamCallback): Promise<void> {
  const { createParser } = await import('eventsource-parser');

  return new Promise((resolve, reject) => {
    const parser = createParser((event) => {
      if (event.type !== 'event') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'content_block_delta' && data.delta?.text) {
          onChunk({ type: 'text', content: data.delta.text });
        }
        if (data.type === 'message_stop') {
          onChunk({ type: 'done' });
        }
      } catch {}
    });

    stream.on('data', (chunk: Buffer) => parser.feed(chunk.toString()));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
}
