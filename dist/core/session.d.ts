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
export declare function createSession(provider: string, model: string): Session;
export declare function saveSession(session: Session, name?: string): void;
export declare function loadSession(name: string): Session | null;
export declare function listSessions(): Array<{
    name: string;
    updatedAt: number;
    messages: number;
}>;
export declare function deleteSession(name: string): boolean;
export declare function compactMessages(messages: Message[], keep?: number): Message[];
//# sourceMappingURL=session.d.ts.map