# Chapter 2: Channels & Core Configuration

## Connecting Messaging Channels

Clawdbot shines when connected to your messaging apps. You can chat with your AI from anywhere.

### Telegram Setup (Recommended for beginners)

1. **Create a bot with BotFather**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot`
   - Choose a name and username
   - Copy the API token

2. **Add to config**
```yaml
channels:
  telegram:
    enabled: true
    token: "your-bot-token-here"
    allowedUsers:
      - your_telegram_username
```

3. **Restart gateway**
```bash
clawdbot gateway restart
```

4. **Start chatting!**
   Message your bot on Telegram.

### Discord Setup

1. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create New Application
   - Go to "Bot" → Add Bot
   - Copy the token
   - Enable "Message Content Intent"

2. **Invite bot to server**
   - Go to OAuth2 → URL Generator
   - Select `bot` scope
   - Select permissions: Send Messages, Read Message History
   - Use the generated URL to invite

3. **Add to config**
```yaml
channels:
  discord:
    enabled: true
    token: "your-discord-bot-token"
    allowedGuilds:
      - "your-server-id"
    allowedUsers:
      - "your-discord-user-id"
```

### WhatsApp Setup (via WhatsApp Web)

```yaml
channels:
  whatsapp:
    enabled: true
    allowedNumbers:
      - "1234567890"
```

Run `clawdbot gateway start` and scan the QR code that appears.

### Signal Setup

Requires `signal-cli` installed separately:
```yaml
channels:
  signal:
    enabled: true
    phoneNumber: "+1234567890"
    allowedNumbers:
      - "+0987654321"
```

## Core Configuration Deep Dive

### Full config.yaml structure

```yaml
# AI Provider Configuration
providers:
  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
  openai:
    apiKey: ${OPENAI_API_KEY}
  google:
    apiKey: ${GOOGLE_API_KEY}

# Default model (can be overridden per-session)
defaultModel: anthropic/claude-sonnet-4

# Model aliases (shortcuts)
aliases:
  opus: anthropic/claude-opus-4
  sonnet: anthropic/claude-sonnet-4
  gpt4: openai/gpt-4o

# Workspace settings
workspace:
  path: ~/clawd
  contextFiles:
    - AGENTS.md
    - SOUL.md
    - USER.md
    - TOOLS.md
    - HEARTBEAT.md

# Gateway settings
gateway:
  port: 3033
  host: 127.0.0.1

# Heartbeat configuration
heartbeat:
  enabled: true
  intervalMinutes: 30
  prompt: "Read HEARTBEAT.md if it exists. If nothing needs attention, reply HEARTBEAT_OK."

# Tool permissions
tools:
  exec:
    enabled: true
    allowlist:
      - git
      - npm
      - node
      - python
    # Or use 'full' for unrestricted access
    # security: full
  browser:
    enabled: true
    target: host  # or 'sandbox'
  
# Channel configurations
channels:
  telegram:
    enabled: true
    token: ${TELEGRAM_BOT_TOKEN}
    allowedUsers:
      - your_username
  discord:
    enabled: false
  whatsapp:
    enabled: false
  webchat:
    enabled: true
    port: 3000
```

### Environment Variables

Store secrets in environment variables:

```bash
# ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC..."
export OPENAI_API_KEY="sk-..."
```

Reference them in config with `${VAR_NAME}` syntax.

### Security Modes

Control what commands your AI can execute:

```yaml
tools:
  exec:
    # 'deny' - No shell access
    # 'allowlist' - Only specified commands
    # 'full' - Unrestricted (use carefully!)
    security: allowlist
    allowlist:
      - git
      - npm
      - ls
      - cat
      - grep
```

## Multi-Channel Tips

### Different personalities per channel

Use context files to customize behavior:

```yaml
channels:
  discord:
    enabled: true
    token: "..."
    contextFiles:
      - DISCORD_SOUL.md  # More casual personality
  
  telegram:
    enabled: true
    token: "..."
    contextFiles:
      - WORK_SOUL.md  # More professional
```

### Rate limiting

Prevent runaway conversations:

```yaml
channels:
  telegram:
    rateLimit:
      maxMessages: 20
      windowMinutes: 5
```

---

## Lesson Summary

✅ Connected Telegram bot  
✅ Understand Discord/WhatsApp/Signal setup  
✅ Mastered config.yaml structure  
✅ Configured security and permissions  
✅ Set up multi-channel with different behaviors  

**Next Chapter**: Advanced tips, tricks, and power-user workflows.
