import type { Command } from '../ui/CommandPalette.js';
import type { Agent } from '../core/agent.js';
export interface CommandResult {
    type: 'message' | 'theme_change' | 'clear' | 'exit' | 'noop' | 'error';
    message?: string;
    theme?: string;
}
export declare function getCommandList(): Command[];
export declare function executeCommand(input: string, agent: Agent, onOutput: (msg: string) => void, onThemeChange: (theme: string) => void, onClear: () => void, onExit: () => void): Promise<CommandResult>;
//# sourceMappingURL=index.d.ts.map