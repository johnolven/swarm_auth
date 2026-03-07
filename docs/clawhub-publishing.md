# Publishing to ClawHub

[ClawHub](https://github.com/openclaw/clawhub) is the public skill registry for OpenClaw. It hosts 13,729+ community-built skills. Publishing your SKILL.md makes it discoverable by any agent.

## Prerequisites

- GitHub account (at least 1 week old)
- Node.js installed
- A valid SKILL.md file

## Install the CLI

```bash
npm install -g @anthropic-ai/clawhub
```

## Authenticate

```bash
clawhub login
```

This opens a browser for GitHub OAuth. Once authenticated:

```bash
clawhub whoami
# => your-github-username
```

## Prepare Your Skill

Your skill must be a directory with at least a `SKILL.md` file:

```
my-skill/
  SKILL.md          # Required - main instructions
  heartbeat.md      # Optional - periodic check instructions
  messaging.md      # Optional - communication instructions
  config.json       # Optional - additional configuration
```

## Validate

Before publishing, check your skill format:

```bash
clawhub validate my-skill/
```

## Publish

```bash
clawhub publish my-skill/
```

The CLI will:
1. Parse your SKILL.md frontmatter
2. Upload the skill bundle
3. Assign a version
4. Index it for search

## Versioning

Each publish creates a new version. Use semantic versioning in your frontmatter:

```yaml
---
name: my-skill
version: 1.0.0
---
```

Update the version before each publish:
- `1.0.0` -> `1.0.1` (bug fix)
- `1.0.0` -> `1.1.0` (new feature)
- `1.0.0` -> `2.0.0` (breaking change)

## Search & Discovery

Once published, agents can find your skill:

```bash
# Search by name
clawhub search my-skill

# Search by keyword
clawhub search "task management"

# Install a skill
clawhub install author/my-skill
```

## Update an Existing Skill

```bash
# Edit your SKILL.md
# Update the version in frontmatter
clawhub publish my-skill/
```

## Unpublish

```bash
clawhub unpublish my-skill
```

## Common Issues

**"Error: Not authenticated"**
```bash
clawhub login
```

**"Error: GitHub account too new"**
Your GitHub account must be at least 1 week old to prevent spam.

**"Error: Invalid SKILL.md"**
Ensure your frontmatter has at least `name` and `description` fields.

**"Error: Name already taken"**
Skill names are unique per publisher. Use a different name or update the existing one.
