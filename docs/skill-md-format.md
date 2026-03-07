# SKILL.md Format Specification

The SKILL.md file is the agent's instruction manual for your tool. It follows the [OpenClaw skill format](https://docs.openclaw.ai/tools/skills).

## Structure

```markdown
---
YAML frontmatter (metadata)
---

Markdown body (instructions)
```

## YAML Frontmatter

### Required Fields

```yaml
---
name: my-skill            # Unique identifier (lowercase, hyphens)
description: Short summary # What the skill does (agents read this to decide if they should use it)
---
```

### Optional Fields

```yaml
---
name: my-skill
description: Short summary of what this skill does
version: 1.0.0
metadata:
  openclaw:
    emoji: "\U0001F41D"      # Icon shown when skill activates
    requires:
      env:
        - API_KEY            # Required environment variables
      bins:
        - curl               # Required CLI tools
    primaryEnv: API_KEY
homepage: https://yourapp.com
user-invocable: true         # Expose as /slash-command (default: true)
---
```

**Important**: The `name` and `description` fields are what agents read to decide when to use the skill. Be clear and comprehensive.

## Markdown Body Sections

### Recommended sections:

```markdown
# What this skill does
- Bullet list of capabilities

# When to use it
- Trigger conditions and keywords

# Tools it uses
- curl, HTTP APIs, etc.

# Procedure
## Step 1: Register
[curl commands]

## Step 2: Authenticate
[Token usage instructions]

## Step 3: Use the API
[Endpoint reference]

# Output format
[Expected response structures]

# Safety / Constraints
[Rules the agent must follow]

# Examples
## Example 1: [Scenario name]
**Input:** [What the user asks]
**Steps:** [What the agent does]
**Output:** [Expected result]
```

## Real Examples

### Minimal SKILL.md
```yaml
---
name: todo-api
description: Manage tasks via a REST API
---

# Procedure

## Register
\```bash
curl -X POST https://todo-api.com/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent", "capabilities": ["task-management"]}'
\```

## Create a task
\```bash
curl -X POST https://todo-api.com/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
\```
```

### Full SKILL.md

See the root [SKILL.md](../SKILL.md) or the [SWARM Board SKILL.md](https://github.com/your-org/swarm/blob/main/SKILL.md) for a production example with:
- 15+ API endpoints
- 4 complete workflow examples
- Security constraints
- Troubleshooting guide
- API reference table

## Best Practices

1. **Be explicit** - Agents follow instructions literally. Don't assume context.
2. **Include curl examples** - Agents execute curl commands directly.
3. **Show request AND response** - Agents need to know what to expect.
4. **List all endpoints** - A reference table helps agents find what they need.
5. **Define safety rules** - Tell agents what they must NOT do.
6. **Add troubleshooting** - Common errors and how to fix them.
7. **Use consistent formatting** - Makes parsing easier for agents.
