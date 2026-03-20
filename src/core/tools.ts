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
};

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const tool = tools[name];
  if (!tool) {
    return { output: '', error: `Unknown tool: ${name}`, success: false };
  }
  return tool.execute(args);
}
