# Chapter 3: Advanced Tips & Power User Tricks

## Tip 1: Customize Your AI's Personality

The `SOUL.md` file is where your AI's personality lives. Make it yours:

```markdown
# SOUL.md

## Core Traits
- Be direct and concise — no fluff
- Use humor when appropriate
- Challenge bad ideas politely
- Default to action over asking permission

## Communication Style
- Use bullet points for lists
- Code blocks for technical content
- Emoji sparingly but effectively 

## Boundaries
- Never share private data in group chats
- Ask before sending external messages
- Be honest about uncertainty
```

**Pro tip**: Update SOUL.md over time as you learn what works. Your AI reads it every session.

## Tip 2: Memory System Mastery

### Daily notes (automatic context)
```
memory/
├── 2026-01-25.md  ← Yesterday
├── 2026-01-26.md  ← Today (auto-loaded)
└── heartbeat-state.json
```

Your AI automatically reads today's and yesterday's notes.

### Long-term memory (MEMORY.md)
Store important information that persists:

```markdown
# MEMORY.md

## Projects
- Skola: Web3 education platform, deploying on Base
- Side project: Building a CLI tool in Rust

## Preferences  
- Prefers concise responses
- Uses pnpm over npm
- Timezone: Europe/Paris

## Key Dates
- 2026-02-15: Product launch
- 2026-01-30: Investor meeting
```

**Pro tip**: Ask your AI to update MEMORY.md when you share important info.

## Tip 3: Cron Jobs for Automation

Schedule recurring tasks:

```bash
# Check emails every morning at 9am
clawdbot cron add --schedule "0 9 * * *" --text "Check my inbox and summarize important emails"

# Daily standup reminder
clawdbot cron add --schedule "0 10 * * 1-5" --text "Remind me to post standup in Slack"

# Weekly review
clawdbot cron add --schedule "0 18 * * 5" --text "Summarize what I accomplished this week"
```

Or in config:
```yaml
cron:
  jobs:
    - id: morning-briefing
      schedule: "0 9 * * *"
      text: "Good morning! What's on my calendar today? Any urgent emails?"
    - id: weekly-review
      schedule: "0 17 * * 5"
      text: "Weekly review time. Summarize this week's accomplishments."
```

## Tip 4: Spawn Background Agents

Run complex tasks without blocking your chat:

```
You: Research the top 5 competitors to Notion and write a comparison report

AI: I'll spawn a background agent for this research task...
    [Spawned agent: research-abc123]
    I'll notify you when it's complete.
```

The agent runs independently and pings you when done.

**Use cases:**
- Long research tasks
- Code refactoring across many files
- Data processing jobs
- Monitoring tasks

## Tip 5: Browser Automation

Control browsers for web tasks:

```
You: Go to twitter.com and check my notifications

AI: [Opens browser, navigates, takes snapshot]
    You have 3 new notifications:
    - @user1 liked your post
    - @user2 replied to your thread
    - @user3 followed you
```

### Browser profiles

```yaml
tools:
  browser:
    enabled: true
    profiles:
      personal:
        dataDir: ~/.clawdbot/browser/personal
      work:
        dataDir: ~/.clawdbot/browser/work
```

**Pro tip**: Use separate profiles for different accounts.

## Tip 6: Skills System

Skills are reusable instruction sets for specific tasks:

```
skills/
├── github/
│   └── SKILL.md
├── twitter/
│   └── SKILL.md
└── notion/
    └── SKILL.md
```

Your AI automatically loads relevant skills when needed.

### Finding skills
- Browse [clawdhub.com](https://clawdhub.com) for community skills
- Or create your own in `~/clawd/skills/`

### Creating a custom skill

```markdown
# skills/my-workflow/SKILL.md

## My Custom Workflow

When user asks to "deploy", follow these steps:
1. Run tests: `npm test`
2. Build: `npm run build`
3. Deploy: `./deploy.sh`
4. Notify in Slack
```

## Tip 7: Model Switching

Use different models for different tasks:

```
You: /model opus
AI: Switched to anthropic/claude-opus-4

You: Analyze this complex architecture...
```

Or per-message:
```
You: [using gpt4] Summarize this in OpenAI's style
```

### Cost optimization
- Use Sonnet for everyday tasks
- Switch to Opus for complex reasoning
- Use Haiku for simple queries

## Tip 8: Useful Slash Commands

```
/status          - Check gateway status, model, usage
/model <name>    - Switch models
/reasoning on    - Enable extended thinking
/clear           - Clear session context
/session         - Session info
/help            - All commands
```

## Tip 9: HEARTBEAT.md for Proactive Tasks

Make your AI proactively helpful:

```markdown
# HEARTBEAT.md

## Check every heartbeat:
- [ ] Any urgent emails in the last hour?
- [ ] Calendar events in the next 2 hours?
- [ ] GitHub PR reviews requested?

## If something needs attention:
Alert me via the current channel.

## Otherwise:
Reply HEARTBEAT_OK
```

## Tip 10: Security Best Practices

1. **Use allowlists** for exec commands in production
2. **Never commit** config.yaml with real tokens
3. **Use env vars** for all secrets: `${SECRET_NAME}`
4. **Restrict channels** to specific users/groups
5. **Review spawned agents** — they have your permissions

```yaml
tools:
  exec:
    security: allowlist
    allowlist:
      - git
      - npm
      - docker
    blocklist:
      - rm -rf
      - sudo
```

---

## Bonus: Quick Reference Card

| Task | Command/Config |
|------|----------------|
| Start gateway | `clawdbot gateway start` |
| Check status | `clawdbot status` |
| View logs | `clawdbot gateway logs` |
| Restart | `clawdbot gateway restart` |
| Add cron | `clawdbot cron add --schedule "..." --text "..."` |
| List crons | `clawdbot cron list` |
| Update | `clawdbot update` |

---

## Course Complete! 🎉

You've learned:
✅ Installation and setup  
✅ Channel configuration (Telegram, Discord, WhatsApp)  
✅ Core config.yaml mastery  
✅ Memory systems (daily notes, long-term)  
✅ Cron jobs and automation  
✅ Background agents  
✅ Browser automation  
✅ Skills system  
✅ Security best practices  

**Go build something awesome with your AI assistant!**

---

*Questions? Join the [Clawdbot Discord](https://discord.gg/clawd) or check the [docs](https://docs.clawd.bot)*
