---
name: scan-marketplace
description: Scan plugin marketplace for relevant components to add to the project
arguments:
  - name: focus
    description: Focus area (all, agents, commands, hooks, skills, mcp)
    required: false
---

# Scan Marketplace Command

Scan the Organized-AI/plugin-marketplace for components relevant to the current project.

## Usage
```
/scan-marketplace [focus]
```

## Focus Areas

| Focus | Description |
|-------|-------------|
| all | Scan all component types |
| agents | Look for relevant agents |
| commands | Look for slash commands |
| hooks | Look for safety/workflow hooks |
| skills | Look for domain skills |
| mcp | Look for MCP server integrations |

## Marketplace Repository

**URL:** https://github.com/Organized-AI/plugin-marketplace

## Available Plugins

### Development & Design
| Plugin | Type | Relevance Check |
|--------|------|-----------------|
| frontend-design | Skills | UI/frontend work? |
| agent-sdk-dev | Commands, Agents | Building Agent SDK apps? |
| hookify | Commands, Agents, Skills, Hooks | Need custom hooks? |

### Integrations (MCP Servers)
| Plugin | Type | Relevance Check |
|--------|------|-----------------|
| stripe | Commands, Skills, MCP | Payment processing? |
| supabase | MCP | Database with Supabase? |
| github | MCP | GitHub API operations? |
| slack | MCP | Slack integration? |
| asana | MCP | Task management? |
| context7 | MCP | Need up-to-date docs? |
| serena | MCP | Semantic code analysis? |

### Tracking & Analytics
| Plugin | Type | Relevance Check |
|--------|------|-----------------|
| gtm-ai-plugin | Commands, Skills, Hooks | GTM/tracking work? |
| blade-linkedin-plugin | Commands | LinkedIn tracking? |
| fix-your-tracking | Tools | Tracking audits? |

### Utilities
| Plugin | Type | Relevance Check |
|--------|------|-----------------|
| organized-codebase-applicator | Skills | Project structure? |

## Relevance Analysis Process

1. **Read project context:**
   ```bash
   cat CLAUDE.md
   cat package.json
   ls src/
   ```

2. **Identify project type:**
   - TypeScript/JavaScript → context7, hookify
   - API/Backend → github, stripe (if payments)
   - Frontend → frontend-design
   - Database → supabase
   - Tracking → gtm-ai-plugin

3. **Check existing components:**
   ```bash
   ls .claude/agents/
   ls .claude/commands/
   ls .claude/hooks/
   ls .claude/skills/
   cat .mcp.json
   ```

4. **Generate recommendations:**
   - List missing components that would help
   - Prioritize by relevance score (High/Medium/Low)
   - Note any conflicts with existing components

## Installation Commands

```bash
# Add marketplace (one-time)
/plugin marketplace add Organized-AI/plugin-marketplace

# Install specific plugin
/plugin install [plugin-name]@organized-ai-marketplace

# Or manually copy components:
# 1. Clone marketplace
git clone https://github.com/Organized-AI/plugin-marketplace.git /tmp/marketplace

# 2. Copy relevant files
cp -r /tmp/marketplace/[plugin]/agents/* .claude/agents/
cp -r /tmp/marketplace/[plugin]/commands/* .claude/commands/
cp -r /tmp/marketplace/[plugin]/hooks/* .claude/hooks/

# 3. Update .mcp.json if MCP servers needed
```

## Example Output

```
🔍 Marketplace Scan Results
===========================

Project: whop-clipping-agency
Type: TypeScript/Express API

📦 Recommended Plugins:

HIGH RELEVANCE:
✅ context7 - Up-to-date docs for googleapis, node-fetch
✅ hookify - Custom safety hooks for API operations
✅ github - Repository management MCP

MEDIUM RELEVANCE:
⚡ serena - Semantic code analysis for refactoring

LOW RELEVANCE:
➖ stripe - Not using payments currently
➖ supabase - Using Drive, not Supabase

ALREADY INSTALLED:
✓ organized-codebase-applicator

📋 Installation:
/plugin install context7@organized-ai-marketplace
/plugin install hookify@organized-ai-marketplace
```

## Integration with Phased Planning

This command should be run during Phase 0 (Project Setup) to ensure all relevant tools are available before implementation begins.

Add to Phase 0 checklist:
- [ ] Run `/scan-marketplace` to identify helpful plugins
- [ ] Install recommended plugins
- [ ] Verify MCP servers are configured
