import { getConfig, setConfig, PROVIDER_MODELS } from '../core/config.js';
import { themeNames } from '../themes/index.js';
import * as fs from 'fs';
import * as path from 'path';
export function getCommandList() {
    return [
        { name: 'help', description: 'Show all available commands', aliases: ['h', '?'] },
        { name: 'clear', description: 'Clear conversation history', aliases: ['reset', 'new'] },
        { name: 'model', description: 'Switch the active model', args: '[model-name]', aliases: ['m'] },
        { name: 'provider', description: 'Switch the AI provider', args: '[openai|anthropic|openrouter|custom]', aliases: ['p'] },
        { name: 'key', description: 'Set API key for a provider', args: '[provider] [api-key]', aliases: ['apikey'] },
        { name: 'theme', description: 'Change the color theme', args: '[theme-name]', aliases: ['t', 'colors'] },
        { name: 'init', description: 'Initialize NEXUS.md project context file' },
        { name: 'file', description: 'Attach a file to your next message', args: '[path]', aliases: ['f', 'attach'] },
        { name: 'run', description: 'Execute a shell command', args: '[command]', aliases: ['exec', '!'] },
        { name: 'review', description: 'Enter code review mode for a file', args: '[file]' },
        { name: 'compact', description: 'Compact conversation history to save context', aliases: ['compress'] },
        { name: 'save', description: 'Save current session', args: '[name]', aliases: ['s'] },
        { name: 'load', description: 'Load a saved session', args: '[name]', aliases: ['l'] },
        { name: 'sessions', description: 'List all saved sessions', aliases: ['ls'] },
        { name: 'status', description: 'Show current configuration', aliases: ['info', 'config'] },
        { name: 'models', description: 'List available models for current provider' },
        { name: 'themes', description: 'List all available themes' },
        { name: 'undo', description: 'Remove the last AI message from history' },
        { name: 'copy', description: 'Copy last AI response to clipboard (if supported)' },
        { name: 'exit', description: 'Exit nexus', aliases: ['quit', 'q', 'bye'] },
    ];
}
export async function executeCommand(input, agent, onOutput, onThemeChange, onClear, onExit) {
    const parts = input.trim().replace(/^\//, '').split(/\s+/);
    const cmd = parts[0]?.toLowerCase() ?? '';
    const args = parts.slice(1);
    switch (cmd) {
        case 'help':
        case 'h':
        case '?': {
            const cmds = getCommandList();
            const lines = ['', '  ✦ nexus — Available Commands', '  ' + '─'.repeat(40), ''];
            for (const c of cmds) {
                const aliases = c.aliases ? ` (${c.aliases.map(a => '/' + a).join(', ')})` : '';
                const argStr = c.args ? ` <${c.args}>` : '';
                lines.push(`  /${c.name}${argStr}${aliases}`);
                lines.push(`     ${c.description}`);
                lines.push('');
            }
            onOutput(lines.join('\n'));
            return { type: 'noop' };
        }
        case 'clear':
        case 'reset':
        case 'new':
            onClear();
            onOutput('✦ Conversation cleared.');
            return { type: 'clear' };
        case 'model':
        case 'm': {
            if (args[0]) {
                agent.setModel(args[0]);
                onOutput(`✦ Model switched to: ${args[0]}`);
            }
            else {
                const cfg = getConfig();
                onOutput(`✦ Current model: ${cfg.model}\nUse /model <name> to switch.`);
            }
            return { type: 'noop' };
        }
        case 'models': {
            const cfg = getConfig();
            const models = PROVIDER_MODELS[cfg.provider] ?? [];
            if (models.length === 0) {
                onOutput(`✦ No preset models for provider "${cfg.provider}". Enter model name manually with /model <name>.`);
            }
            else {
                onOutput(`✦ Models for ${cfg.provider}:\n${models.map((m, i) => `  ${i === 0 ? '▶' : ' '} ${m}`).join('\n')}`);
            }
            return { type: 'noop' };
        }
        case 'provider':
        case 'p': {
            if (args[0]) {
                agent.setProvider(args[0]);
                onOutput(`✦ Provider switched to: ${args[0]}\nModel set to: ${agent.model}`);
            }
            else {
                const cfg = getConfig();
                onOutput(`✦ Current provider: ${cfg.provider}\nAvailable: openai, anthropic, openrouter, custom`);
            }
            return { type: 'noop' };
        }
        case 'key':
        case 'apikey': {
            if (args.length >= 2) {
                agent.setApiKey(args[0], args[1]);
                onOutput(`✦ API key set for ${args[0]}`);
            }
            else if (args.length === 1) {
                const cfg = getConfig();
                agent.setApiKey(cfg.provider, args[0]);
                onOutput(`✦ API key set for ${cfg.provider}`);
            }
            else {
                onOutput('✦ Usage: /key [provider] <api-key>');
            }
            return { type: 'noop' };
        }
        case 'theme':
        case 't':
        case 'colors': {
            if (args[0]) {
                if (!themeNames.includes(args[0])) {
                    onOutput(`✦ Unknown theme "${args[0]}". Available: ${themeNames.join(', ')}`);
                }
                else {
                    setConfig('theme', args[0]);
                    onThemeChange(args[0]);
                    onOutput(`✦ Theme changed to: ${args[0]}`);
                }
            }
            else {
                const cfg = getConfig();
                onOutput(`✦ Current theme: ${cfg.theme}\nAvailable: ${themeNames.join(', ')}`);
            }
            return { type: 'theme_change', theme: args[0] };
        }
        case 'themes': {
            const { getTheme: gt } = await import('../themes/index.js');
            const lines = themeNames.map(t => `  ${t === getConfig().theme ? '▶' : ' '} ${gt(t).label}`);
            onOutput('✦ Available Themes:\n' + lines.join('\n'));
            return { type: 'noop' };
        }
        case 'init': {
            const filePath = path.join(process.cwd(), 'NEXUS.md');
            if (fs.existsSync(filePath)) {
                onOutput(`✦ NEXUS.md already exists at ${filePath}`);
            }
            else {
                const content = `# NEXUS Project Context

## Project Description
<!-- Describe what this project does -->

## Architecture
<!-- Key directories and their purpose -->

## Tech Stack
<!-- Languages, frameworks, tools used -->

## Coding Conventions
<!-- Style guides, naming, patterns to follow -->

## Key Commands
<!-- How to build, run, test this project -->
`;
                fs.writeFileSync(filePath, content, 'utf8');
                onOutput(`✦ Created NEXUS.md at ${filePath}\nAdd project context to help nexus understand your codebase.`);
            }
            return { type: 'noop' };
        }
        case 'compact':
        case 'compress': {
            const before = agent.messages.length;
            agent.compact();
            const after = agent.messages.length;
            onOutput(`✦ Compacted: ${before} → ${after} messages`);
            return { type: 'noop' };
        }
        case 'save':
        case 's': {
            const name = args[0] ?? `session-${Date.now()}`;
            agent.saveCurrentSession(name);
            onOutput(`✦ Session saved as "${name}"`);
            return { type: 'noop' };
        }
        case 'load':
        case 'l': {
            if (!args[0]) {
                onOutput('✦ Usage: /load <session-name>');
                return { type: 'noop' };
            }
            const ok = agent.loadNamedSession(args[0]);
            if (ok) {
                onOutput(`✦ Loaded session "${args[0]}" (${agent.messages.length} messages)`);
            }
            else {
                onOutput(`✦ Session "${args[0]}" not found. Use /sessions to list all.`);
            }
            return { type: 'noop' };
        }
        case 'sessions':
        case 'ls': {
            const sessions = agent.listSavedSessions();
            if (sessions.length === 0) {
                onOutput('✦ No saved sessions. Use /save <name> to save one.');
            }
            else {
                const lines = sessions.map(s => {
                    const date = new Date(s.updatedAt).toLocaleString();
                    return `  ${s.name} (${s.messages} msgs, ${date})`;
                });
                onOutput('✦ Saved Sessions:\n' + lines.join('\n'));
            }
            return { type: 'noop' };
        }
        case 'status':
        case 'info':
        case 'config': {
            const cfg = getConfig();
            const keyPreview = (k) => k ? k.slice(0, 6) + '…' : 'not set';
            onOutput([
                '✦ nexus Status',
                '─'.repeat(30),
                `Provider:    ${cfg.provider}`,
                `Model:       ${cfg.model}`,
                `Theme:       ${cfg.theme}`,
                `Max tokens:  ${cfg.maxTokens}`,
                `Temperature: ${cfg.temperature}`,
                `OpenAI key:  ${keyPreview(cfg.apiKeys['openai'] ?? '')}`,
                `Anthropic:   ${keyPreview(cfg.apiKeys['anthropic'] ?? '')}`,
                `OpenRouter:  ${keyPreview(cfg.apiKeys['openrouter'] ?? '')}`,
                `CWD:         ${process.cwd()}`,
            ].join('\n'));
            return { type: 'noop' };
        }
        case 'undo': {
            const msgs = agent.messages;
            const lastAssistant = [...msgs].reverse().findIndex(m => m.role === 'assistant');
            if (lastAssistant === -1) {
                onOutput('✦ Nothing to undo.');
            }
            else {
                const idx = msgs.length - 1 - lastAssistant;
                msgs.splice(idx, 1);
                onOutput('✦ Removed last assistant message.');
            }
            return { type: 'noop' };
        }
        case 'file':
        case 'f':
        case 'attach': {
            if (!args[0]) {
                onOutput('✦ Usage: /file <path>');
                return { type: 'noop' };
            }
            const p = path.resolve(process.cwd(), args[0]);
            if (!fs.existsSync(p)) {
                onOutput(`✦ File not found: ${p}`);
                return { type: 'error', message: `File not found: ${p}` };
            }
            const content = fs.readFileSync(p, 'utf8');
            const ext = path.extname(p).replace('.', '') || 'text';
            const msg = `[File: ${p}]\n\`\`\`${ext}\n${content}\n\`\`\``;
            return { type: 'message', message: msg };
        }
        case 'review': {
            if (!args[0]) {
                onOutput('✦ Usage: /review <file-path>');
                return { type: 'noop' };
            }
            const p = path.resolve(process.cwd(), args[0]);
            if (!fs.existsSync(p)) {
                onOutput(`✦ File not found: ${p}`);
                return { type: 'error' };
            }
            const content = fs.readFileSync(p, 'utf8');
            const ext = path.extname(p).replace('.', '') || 'text';
            const msg = `Please do a thorough code review of this file. Look for bugs, security issues, performance problems, and style improvements.\n\n[File: ${p}]\n\`\`\`${ext}\n${content}\n\`\`\``;
            return { type: 'message', message: msg };
        }
        case 'run':
        case 'exec':
        case '!': {
            if (!args[0]) {
                onOutput('✦ Usage: /run <command>');
                return { type: 'noop' };
            }
            const command = args.join(' ');
            const msg = `Run this shell command and show me the output: \`${command}\``;
            return { type: 'message', message: msg };
        }
        case 'copy': {
            onOutput('✦ Clipboard copy is not supported in this environment.');
            return { type: 'noop' };
        }
        case 'exit':
        case 'quit':
        case 'q':
        case 'bye':
            onExit();
            return { type: 'exit' };
        default:
            onOutput(`✦ Unknown command: /${cmd}\nType /help to see all commands.`);
            return { type: 'error', message: `Unknown command: /${cmd}` };
    }
}
//# sourceMappingURL=index.js.map