import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from './providers.js';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  provider: string;
  model: string;
  cwd: string;
}

const SESSION_DIR = path.join(os.homedir(), '.nexus', 'sessions');

function ensureDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

export function createSession(provider: string, model: string): Session {
  return {
    id: uuidv4(),
    name: `session-${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    provider,
    model,
    cwd: process.cwd(),
  };
}

export function saveSession(session: Session, name?: string): void {
  ensureDir();
  const s = { ...session, name: name ?? session.name, updatedAt: Date.now() };
  const filePath = path.join(SESSION_DIR, `${s.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(s, null, 2), 'utf8');
}

export function loadSession(name: string): Session | null {
  ensureDir();
  const filePath = path.join(SESSION_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Session;
}

export function listSessions(): Array<{ name: string; updatedAt: number; messages: number }> {
  ensureDir();
  const files = fs.readdirSync(SESSION_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, f), 'utf8')) as Session;
      return { name: data.name, updatedAt: data.updatedAt, messages: data.messages.length };
    } catch {
      return { name: f.replace('.json', ''), updatedAt: 0, messages: 0 };
    }
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteSession(name: string): boolean {
  const filePath = path.join(SESSION_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function compactMessages(messages: Message[], keep = 4): Message[] {
  if (messages.length <= keep) return messages;
  const summary: Message = {
    role: 'system',
    content: `[Conversation compacted. ${messages.length - keep} messages summarized. Continuing from most recent context.]`,
    timestamp: Date.now(),
  };
  return [summary, ...messages.slice(-keep)];
}
