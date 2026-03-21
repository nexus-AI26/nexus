import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolResult {
  output: string;
  error?: string;
  success: boolean;
}

export interface ToolDef {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export const tools: Record<string, ToolDef> = {
  read_file: {
    name: 'read_file',
    description: 'Read the contents of a file',
    async execute(args) {
      try {
        const filePath = String(args.path ?? '');
        const resolved = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(resolved)) {
          return { output: '', error: `File not found: ${resolved}`, success: false };
        }
        const content = fs.readFileSync(resolved, 'utf8');
        return { output: content, success: true };
      } catch (e: unknown) {
        return { output: '', error: String(e), success: false };
      }
    },
  },

  write_file: {
    name: 'write_file',
    description: 'Write content to a file',
    async execute(args) {
      try {
        const filePath = String(args.path ?? '');
        const content = String(args.content ?? '');
        const resolved = path.resolve(process.cwd(), filePath);
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(resolved, content, 'utf8');
        return { output: `Written ${content.length} bytes to ${resolved}`, success: true };
      } catch (e: unknown) {
        return { output: '', error: String(e), success: false };
      }
    },
  },

  run_command: {
    name: 'run_command',
    description: 'Execute a shell command',
    async execute(args) {
      try {
        const command = String(args.command ?? '');
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 5,
        });
        return { output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''), success: true };
      } catch (e: unknown) {
        const err = e as { stdout?: string; stderr?: string; message?: string };
        return { output: err.stdout ?? '', error: err.stderr ?? err.message, success: false };
      }
    },
  },

  list_directory: {
    name: 'list_directory',
    description: 'List files in a directory',
    async execute(args) {
      try {
        const dirPath = String(args.path ?? process.cwd());
        const resolved = path.resolve(process.cwd(), dirPath);
        const entries = fs.readdirSync(resolved, { withFileTypes: true });
        const lines = entries.map(e => {
          const type = e.isDirectory() ? 'd' : 'f';
          return `[${type}] ${e.name}`;
        });
        return { output: lines.join('\n'), success: true };
      } catch (e: unknown) {
        return { output: '', error: String(e), success: false };
      }
    },
  },

  search_files: {
    name: 'search_files',
    description: 'Search for a pattern in files',
    async execute(args) {
      try {
        const pattern = String(args.pattern ?? '');
        const dir = String(args.directory ?? process.cwd());
        const resolved = path.resolve(process.cwd(), dir);
        const cmd = process.platform === 'win32'
          ? `findstr /s /n /i "${pattern}" "${resolved}\\*.*"`
          : `grep -r -n --include="*" "${pattern}" "${resolved}"`;
        const { stdout } = await execAsync(cmd, { timeout: 15000 });
        return { output: stdout || 'No matches found.', success: true };
      } catch (e: unknown) {
        return { output: 'No matches found.', success: true };
      }
    },
  },

  web_search: {
    name: 'web_search',
    description: 'Search the web for recent information',
    async execute(args) {
      try {
        const query = String(args.query ?? '').trim();
        const limitRaw = Number(args.limit ?? 5);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10, Math.floor(limitRaw))) : 5;
        if (!query) {
          return { output: '', error: 'Missing required argument: query', success: false };
        }

        const { default: fetch } = await import('node-fetch');
        const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 nexus-web-search',
          },
        });

        if (!res.ok) {
          return { output: '', error: `Web search request failed: ${res.status}`, success: false };
        }

        const html = await res.text();
        const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const out: string[] = [];
        let match: RegExpExecArray | null;

        while ((match = resultRegex.exec(html)) !== null && out.length < limit) {
          const rawHref = match[1] ?? '';
          const rawTitle = match[2] ?? '';
          const title = rawTitle.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
          const decodedHref = decodeDuckDuckGoRedirect(rawHref);
          if (!title || !decodedHref) continue;
          out.push(`${out.length + 1}. ${title}\n   ${decodedHref}`);
        }

        if (out.length === 0) {
          return { output: `No web results found for "${query}".`, success: true };
        }

        return { output: `Web results for "${query}":\n${out.join('\n')}`, success: true };
      } catch (e: unknown) {
        return { output: '', error: String(e), success: false };
      }
    },
  },
};

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const tool = tools[name];
  if (!tool) {
    return { output: '', error: `Unknown tool: ${name}`, success: false };
  }
  return tool.execute(args);
}

function decodeDuckDuckGoRedirect(href: string): string {
  if (!href) return '';
  if (!href.startsWith('//duckduckgo.com/l/?')) return href;
  try {
    const normalized = href.startsWith('//') ? `https:${href}` : href;
    const u = new URL(normalized);
    const uddg = u.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}
