import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import * as fs from 'fs';
import * as path from 'path';
import { setConfig } from './core/config.js';
function loadProjectContext() {
    const nexusFile = path.join(process.cwd(), 'NEXUS.md');
    if (fs.existsSync(nexusFile)) {
        const content = fs.readFileSync(nexusFile, 'utf8');
        setConfig('systemPrompt', `You are nexus, an expert AI coding assistant. The user has provided this project context:\n\n${content}\n\nUse this context to give better, more relevant answers.`);
    }
}
async function main() {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if ((arg === '--provider' || arg === '-p') && args[i + 1]) {
            setConfig('provider', args[i + 1]);
            i++;
        }
        else if ((arg === '--model' || arg === '-m') && args[i + 1]) {
            setConfig('model', args[i + 1]);
            i++;
        }
        else if ((arg === '--theme' || arg === '-t') && args[i + 1]) {
            setConfig('theme', args[i + 1]);
            i++;
        }
        else if (arg === '--version' || arg === '-v') {
            console.log('nexus v1.0.0');
            process.exit(0);
        }
        else if (arg === '--help' || arg === '-h') {
            console.log(`
nexus — AI coding agent v1.0.0

Usage:
  nexus [options]

Options:
  --provider, -p   <name>   AI provider (openai|anthropic|openrouter|custom)
  --model, -m      <name>   Model name
  --theme, -t      <name>   Color theme (dracula|tokyonight|monokai|catppuccin|nord|light)
  --version, -v             Show version
  --help, -h                Show this help

Inside nexus, type / to open the command palette.
      `);
            process.exit(0);
        }
    }
    loadProjectContext();
    process.stdout.write('\x1b[2J\x1b[H');
    const { waitUntilExit } = render(React.createElement(App), {
        exitOnCtrlC: false,
    });
    await waitUntilExit();
}
main().catch(err => {
    console.error('nexus crashed:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map