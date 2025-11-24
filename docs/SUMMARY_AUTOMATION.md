# Synthetic Summary Automation

This document describes how to generate condensed conversation summaries for AI agents.

## Input Format

The generator expects JSON supplied through `--input <file>` or STDIN. Supported payloads:

1. Array of messages
2. Object with a `messages` array

Each message should follow the schema below:

```json
{
  "id": "msg-001",
  "timestamp": "2025-11-23T18:12:00Z",
  "author": "Guillaume",
  "role": "user",
  "threadId": "main",
  "content": "Outlined the accessibility goals for the mairie scenario.",
  "meta": {
    "source": "Teams",
    "attachments": ["agenda.pdf"]
  }
}
```

Missing timestamps are tolerated, but ISO strings yield a better timeline.

## CLI Usage

```bash
node tools/generate_summary.js \
  --input logs/conversation.json \
  --output summaries/2025-11-23.md \
  --format markdown \
  --highlights 6
```

Flags:

- `--input`: Optional path to the JSON transcript. Falls back to STDIN.
- `--output`: Destination file. Defaults to STDOUT when omitted.
- `--format`: `markdown` (default) or `json`.
- `--highlights`: Cap the number of highlight sentences per thread (default 5).
- `--help`: Display usage information.

## Output Structure

### Markdown

```
# Synthetic Summary
- Window: 2025-11-22T08:00:00Z -> 2025-11-23T19:10:00Z
- Messages: 42
- Threads: 3
- Participants: Guillaume, Copilot, Claude

## Thread main (26 messages)
- Guillaume: Locked export scope to mairie onboarding only.
- Copilot: Flagged missing variable manager tests as a blocker.
- Claude: Proposed guided wizard for scenario authoring.
  
Recent context:
  - Copilot: Wiring the condition evaluator to dialogue branching now.
  - Guillaume: Need confirmation that the wizard data exports clean JSON.

## Action Items
- Copilot: Add automated regression covering variable clamping edge cases.
- Guillaume: Share sprite palette once the art team finalizes it.

## Open Questions
- Copilot: Do we need an emergency rollback script for corrupted journals?
```

### JSON

When `--format json` is used the CLI outputs a structured payload containing metadata, per-thread highlights, action items, and open questions. This is useful for programmatic ingestion or chaining with other tools.

## Tips

- Keep the raw transcript lean; remove duplicate system notices before running the tool.
- Provide `threadId` whenever parallel discussions happen (for example `main`, `art`, `qa`).
- Use the JSON output to feed dashboards or daily status emails.
- Combine with `pack_project.py` to archive both the code context and discussion summary.
