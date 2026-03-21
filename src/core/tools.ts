import { exec } from 'child_process';
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
          return { output: '', error: `File not found: ${resolved}. If the parent folder is missing, you may need to creating it first.`, success: false };
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

  create_directory: {
    name: 'create_directory',
    description: 'Create a new directory (and any parent directories if needed)',
    async execute(args) {
      try {
        const dirPath = String(args.path ?? '');
        const resolved = path.resolve(process.cwd(), dirPath);
        if (fs.existsSync(resolved)) {
          return { output: `Directory already exists: ${resolved}`, success: true };
        }
        fs.mkdirSync(resolved, { recursive: true });
        return { output: `Created directory: ${resolved}`, success: true };
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
        if (!fs.existsSync(resolved)) {
          return { output: '', error: `Directory not found: ${resolved}. You can create it using the 'create_directory' tool if needed.`, success: false };
        }
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
        if (!pattern.trim()) {
          return { output: '', error: 'Missing required argument: pattern', success: false };
        }
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          return { output: '', error: `Directory not found: ${resolved}`, success: false };
        }

        const files = collectFiles(resolved, 2000);
        const needle = pattern.toLowerCase();
        const results: string[] = [];

        for (const filePath of files) {
          // Skip very large files to keep tool responsive.
          const stat = fs.statSync(filePath);
          if (stat.size > 1024 * 1024) continue;

          let content = '';
          try {
            content = fs.readFileSync(filePath, 'utf8');
          } catch {
            continue;
          }

          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? '';
            if (line.toLowerCase().includes(needle)) {
              const rel = path.relative(resolved, filePath) || filePath;
              results.push(`${rel}:${i + 1}:${line}`);
              if (results.length >= 200) break;
            }
          }
          if (results.length >= 200) break;
        }

        return { output: results.length > 0 ? results.join('\n') : 'No matches found.', success: true };
      } catch (e: unknown) {
        return { output: '', error: String(e), success: false };
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
          const title = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '')).trim();
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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function collectFiles(root: string, maxFiles: number): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  const ignored = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cursor']);

  while (stack.length > 0 && out.length < maxFiles) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.DS_Store')) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) stack.push(fullPath);
      } else if (entry.isFile()) {
        out.push(fullPath);
        if (out.length >= maxFiles) break;
      }
    }
  }

  return out;
}
