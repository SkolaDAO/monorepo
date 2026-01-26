# Chapter 1: Getting Started with Clawdbot

## What is Clawdbot?

Clawdbot is your personal AI assistant that lives on your machine and connects to your life. Unlike cloud-only AI assistants, Clawdbot runs locally and can:

- Access your files and execute commands
- Connect to messaging platforms (Telegram, Discord, WhatsApp, Signal, iMessage)
- Control browsers and automate web tasks
- Schedule tasks with cron jobs
- Manage multiple AI models and providers

## Installation

### Prerequisites
- Node.js 20+ (recommend using nvm)
- macOS, Linux, or Windows (WSL)

### Install via npm
```bash
npm install -g clawdbot
```

### Verify installation
```bash
clawdbot --version
clawdbot status
```

## First Run Setup

### 1. Initialize your workspace
```bash
mkdir ~/clawd && cd ~/clawd
clawdbot init
```

This creates essential files:
- `AGENTS.md` — Instructions for the AI
- `SOUL.md` — Personality and behavior guidelines
- `USER.md` — Info about you (the user)
- `TOOLS.md` — Notes about available tools

### 2. Configure your AI provider

Create or edit `~/.clawdbot/config.yaml`:

```yaml
providers:
  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
  openai:
    apiKey: ${OPENAI_API_KEY}

defaultModel: anthropic/claude-sonnet-4
```

Set your API keys:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

### 3. Start the gateway
```bash
clawdbot gateway start
```

### 4. Chat via web interface
```bash
clawdbot chat
```
This opens a local web UI at `http://localhost:3000`

## Understanding the Architecture

```
┌─────────────────────────────────────────┐
│              Your Machine               │
│  ┌─────────────────────────────────┐   │
│  │         Clawdbot Gateway        │   │
│  │  ┌─────────┐  ┌──────────────┐  │   │
│  │  │ Channels│  │    Tools     │  │   │
│  │  │Telegram │  │ exec, read,  │  │   │
│  │  │ Discord │  │ write, browser│  │   │
│  │  │WhatsApp │  │ cron, nodes  │  │   │
│  │  └─────────┘  └──────────────┘  │   │
│  └─────────────────────────────────┘   │
│                   │                     │
│                   ▼                     │
│  ┌─────────────────────────────────┐   │
│  │      ~/clawd (Workspace)        │   │
│  │  AGENTS.md, SOUL.md, memory/    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────┐
         │   AI Provider   │
         │ (Anthropic/OpenAI)│
         └─────────────────┘
```

## Key Concepts

### Sessions
Each conversation is a "session" with its own context and history. Sessions can be:
- **Main session**: Direct chat with your AI
- **Channel sessions**: Conversations via Telegram, Discord, etc.
- **Spawned sessions**: Background tasks running autonomously

### Workspace Files
Your AI reads these files every session:
- `AGENTS.md` — How to behave
- `SOUL.md` — Personality traits
- `USER.md` — Info about you
- `memory/YYYY-MM-DD.md` — Daily notes
- `MEMORY.md` — Long-term memories (main session only)

### Heartbeats
Periodic check-ins where your AI can:
- Check for new messages
- Run scheduled tasks
- Perform maintenance

---

## Lesson Summary

✅ Installed Clawdbot via npm  
✅ Created workspace with `clawdbot init`  
✅ Configured AI provider  
✅ Started the gateway  
✅ Understand the architecture  

**Next Chapter**: Connecting messaging channels and configuring advanced options.
