# nexus — AI Coding Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](https://www.typescriptlang.org/)

**nexus** is a deeply customizable, terminal-based AI coding assistant. It brings the power of agentic coding (like Cursor or Claude Code) directly into your command line, but with a philosophy of absolute freedom: you bring your own API keys, choose any model from any provider, and customize the UI to your liking.

Built with React for the terminal (Ink) and designed for developers who live in their terminal.

---

## Features

- **Bring Your Own Provider:** Support for OpenAI, Anthropic, OpenRouter, or Custom local endpoints (LM Studio, Ollama). Use `claude-3.5-sonnet`, `gpt-4o`, `llama-3.3`, `deepseek-v3`, or anything else.
- **Beautiful TUI:** 6 built-in color themes (Dracula, Tokyo Night, Monokai, Catppuccin, Nord, Light) with live switching.
- **Command Palette:** Press `/` to open a fuzzy-searchable overlay for 20+ built-in commands.
- **Safe Agentic Tools:** nexus can read your code, write files, and run terminal commands to fix bugs. It will always ask for your permission before writing a file or running a shell command, so you stay in control.
- **Lightning Fast UX:**
  - `Ctrl + C` gracefully interrupts the AI stream instantly if it's going off-track.
  - `Ctrl + B` toggles **Verbose Mode** to see exactly what tools the AI is calling under the hood.
  - `Ctrl + O` expands long code previews.
- **Sessions & Context:** Saves chat history automatically. Drop a `NEXUS.md` in your project root to give the AI permanent context about your codebase.

---

## What It Looks Like

```text
 ❯ hi, can you search for any python files in the src folder?
 
 ✦ thinking...

 ⚙ Running search_files ...
 
 ✦ I found 3 python files inside the src folder:
   - src/main.py
   - src/utils.py
   - src/api/server.py

 ❯ ok, rewrite the utils file to use async functions

 ╭──────────────────────────────────────────────────────────────────────────╮
 │  ⚠ Agent wants to run: write_file                                        │
 │                                                                          │
 │  {"path": "src/utils.py", "content": "import asyncio\n\n..."}            │
 │                                                                          │
 │  [Y/Enter] Approve  •  [N/Esc] Reject  •  [Ctrl+O] Expand                │
 ╰──────────────────────────────────────────────────────────────────────────╯

 ❯ _
 
┌───────────────────────────────────────────────────────────────────────────┐
│ ✦ nexus  │  openai  gpt-4o  │  ~/projects/app  │  nord  │  / commands     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nexus.git
cd nexus

# Install dependencies and build
npm install
npm run build

# Link globally so you can run `nexus` from any folder
npm link
```

Now, just type `nexus` anywhere in your terminal.

---

## First Run

On your first launch, an interactive wizard will guide you through:
1. Choosing your provider (OpenRouter is recommended for free `:free` models)
2. Entering your API key (stored locally in `~/.nexus/config.json`)
3. Picking a default model
4. Selecting your terminal theme

---

## Shortcuts & Commands

### Global Hotkeys
- **`Ctrl + C`**: Interrupt the AI while it's typing, or cancel a tool prompt.
- **`Ctrl + B`**: Toggle **Verbose Mode** (shows raw JSON data for all hidden tool calls).
- **`Ctrl + O`**: Expand/Collapse the code preview when the AI asks to run a command.
- **`/`**: Open the Command Palette.

### Essential Slash Commands
| Command | Action |
|---|---|
| `/help` | List all commands |
| `/theme <name>` | Switch UI color theme live |
| `/model <name>` | Switch the active AI model |
| `/provider <name>`| Switch backend provider |
| `/key <prv> <key>`| Update your API key |
| `/clear` | Clear conversation history |
| `/run <cmd>` | Ask the AI to execute a specific shell command |
| `/sessions` | View saved chat histories |

---

## Project Context (`NEXUS.md`)

Run `/init` in any project folder to generate a `NEXUS.md` file.
Whenever you launch nexus in that folder, it reads that file and injects it into the AI's system prompt. Use it to specify your tech stack, coding conventions, or architecture rules.

---

## Contributing

Contributions, issues, and feature requests are very welcome.
nexus is written in strict TypeScript and uses `ink` to render React components to the terminal.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
