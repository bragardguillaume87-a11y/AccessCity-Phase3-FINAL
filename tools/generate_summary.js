#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const HELP_TEXT = `Synthetic summary generator

Usage:
  node tools/generate_summary.js --input logs/conversation.json --output summary.md

Flags:
  --input <path>     Optional path to a JSON file. Falls back to STDIN when omitted.
  --output <path>    Optional path for the generated summary. Defaults to STDOUT.
  --format <type>    Output format: "markdown" (default) or "json".
  --highlights <n>   Maximum highlights per thread. Default: 5.
  --help             Print this help and exit.
`;

const KEYWORD_GROUPS = {
  action: ['todo', 'action', 'implement', 'ship', 'deliver', 'plan', 'next step', 'assign'],
  risk: ['risk', 'issue', 'blocker', 'bug', 'fail', 'delay', 'concern'],
  decision: ['decide', 'approved', 'agreed', 'align', 'choose'],
  question: ['?', 'who', 'what', 'why', 'when', 'how', 'pending']
};

const DEFAULT_OPTIONS = {
  format: 'markdown',
  highlights: 5
};

function parseArgs(argv) {
  const options = { ...DEFAULT_OPTIONS };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--help':
        return { ...options, help: true };
      case '--input':
        options.input = argv[i + 1];
        i += 1;
        break;
      case '--output':
        options.output = argv[i + 1];
        i += 1;
        break;
      case '--format':
        options.format = (argv[i + 1] || 'markdown').toLowerCase();
        i += 1;
        break;
      case '--highlights':
        options.highlights = Number(argv[i + 1]) || DEFAULT_OPTIONS.highlights;
        i += 1;
        break;
      default:
        break;
    }
  }
  return options;
}

function readSource(inputPath) {
  if (inputPath) {
    return fs.readFileSync(inputPath, 'utf-8');
  }
  return fs.readFileSync(0, 'utf-8');
}

function safeJsonParse(raw, origin = 'input') {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${origin}: ${error.message}`);
  }
}

function normalizeMessages(raw) {
  const base = Array.isArray(raw) ? raw : raw?.messages;
  if (!Array.isArray(base)) {
    throw new Error('Input must be a JSON array or an object with a messages array.');
  }
  return base
    .map((message, index) => ({
      id: message.id || `msg_${index}`,
      author: message.author || message.role || 'unknown',
      threadId: message.threadId || message.thread || 'main',
      timestamp: parseTimestamp(message.timestamp),
      content: sanitizeContent(message.content),
      meta: message.meta || {}
    }))
    .filter((message) => message.content.length > 0);
}

function parseTimestamp(value) {
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : new Date(date).toISOString();
}

function sanitizeContent(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.join(' ').trim();
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return '';
}

function groupByThread(messages) {
  const map = new Map();
  messages.forEach((message) => {
    if (!map.has(message.threadId)) {
      map.set(message.threadId, []);
    }
    map.get(message.threadId).push(message);
  });
  map.forEach((threadMessages) => {
    threadMessages.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp);
      }
      return a.id.localeCompare(b.id);
    });
  });
  return map;
}

function splitSentences(text) {
  const sentences = [];
  let current = '';
  for (const char of text) {
    current += char;
    if ('.!?'.includes(char)) {
      const trimmed = current.trim();
      if (trimmed) {
        sentences.push(trimmed);
      }
      current = '';
    }
  }
  const trimmed = current.trim();
  if (trimmed) {
    sentences.push(trimmed);
  }
  return sentences;
}

function sentenceScore(sentence) {
  const lower = sentence.toLowerCase();
  let score = 0;
  Object.entries(KEYWORD_GROUPS).forEach(([group, tokens]) => {
    tokens.forEach((token) => {
      if (lower.includes(token)) {
        score += group === 'question' ? 2 : 3;
      }
    });
  });
  if (sentence.length < 40) {
    score -= 1;
  }
  if (sentence.length > 200) {
    score -= 1;
  }
  return score;
}

function buildHighlights(messages, limit) {
  const candidates = [];
  messages.forEach((message) => {
    splitSentences(message.content).forEach((sentence) => {
      const score = sentenceScore(sentence);
      if (score > 0) {
        candidates.push({ sentence, score, author: message.author, timestamp: message.timestamp });
      }
    });
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

function recentMessages(messages, limit = 3) {
  return messages.slice(-limit).map((message) => ({
    author: message.author,
    snippet: message.content.length > 180 ? `${message.content.slice(0, 177)}...` : message.content,
    timestamp: message.timestamp
  }));
}

function extractActionItems(messages) {
  const results = [];
  messages.forEach((message) => {
    splitSentences(message.content).forEach((sentence) => {
      const lower = sentence.toLowerCase();
      const hasAction = KEYWORD_GROUPS.action.some((token) => lower.includes(token));
      if (hasAction) {
        results.push({
          text: sentence,
          owner: message.author,
          timestamp: message.timestamp
        });
      }
    });
  });
  return dedupeByText(results);
}

function extractOpenQuestions(messages) {
  const results = [];
  messages.forEach((message) => {
    splitSentences(message.content).forEach((sentence) => {
      const trimmed = sentence.trim();
      if (trimmed.endsWith('?')) {
        results.push({
          text: trimmed,
          owner: message.author,
          timestamp: message.timestamp
        });
      }
    });
  });
  return dedupeByText(results);
}

function dedupeByText(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function computeMeta(messages, threadMap) {
  const timestamps = messages
    .map((message) => message.timestamp)
    .filter(Boolean)
    .sort();
  const participants = Array.from(new Set(messages.map((message) => message.author))).sort();
  return {
    totalMessages: messages.length,
    totalThreads: threadMap.size,
    participants,
    dateRange: timestamps.length
      ? { start: timestamps[0], end: timestamps[timestamps.length - 1] }
      : null
  };
}

function buildSummary(messages, options) {
  const threadMap = groupByThread(messages);
  const threads = Array.from(threadMap.entries()).map(([threadId, threadMessages]) => ({
    threadId,
    messageCount: threadMessages.length,
    highlights: buildHighlights(threadMessages, options.highlights),
    recent: recentMessages(threadMessages)
  }));
  return {
    meta: computeMeta(messages, threadMap),
    threads,
    actionItems: extractActionItems(messages),
    openQuestions: extractOpenQuestions(messages)
  };
}

function formatMarkdown(summary) {
  const lines = [];
  lines.push('# Synthetic Summary');
  if (summary.meta.dateRange) {
    lines.push(
      `- Window: ${summary.meta.dateRange.start} -> ${summary.meta.dateRange.end}`
    );
  }
  lines.push(`- Messages: ${summary.meta.totalMessages}`);
  lines.push(`- Threads: ${summary.meta.totalThreads}`);
  if (summary.meta.participants.length) {
    lines.push(`- Participants: ${summary.meta.participants.join(', ')}`);
  }
  lines.push('');
  summary.threads.forEach((thread) => {
    lines.push(`## Thread ${thread.threadId} (${thread.messageCount} messages)`);
    if (thread.highlights.length === 0) {
      lines.push('No highlight candidates.');
    } else {
      thread.highlights.forEach((highlight) => {
        const metaLabel = highlight.author ? `${highlight.author}` : 'unknown';
        lines.push(`- ${metaLabel}: ${highlight.sentence}`);
      });
    }
    if (thread.recent.length) {
      lines.push('  
Recent context:');
      thread.recent.forEach((item) => {
        lines.push(`  - ${item.author}: ${item.snippet}`);
      });
    }
    lines.push('');
  });
  if (summary.actionItems.length) {
    lines.push('## Action Items');
    summary.actionItems.forEach((item) => {
      lines.push(`- ${item.owner || 'unknown'}: ${item.text}`);
    });
    lines.push('');
  }
  if (summary.openQuestions.length) {
    lines.push('## Open Questions');
    summary.openQuestions.forEach((item) => {
      lines.push(`- ${item.owner || 'unknown'}: ${item.text}`);
    });
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

function formatJson(summary) {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

function writeOutput(content, outPath) {
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, 'utf-8');
  } else {
    process.stdout.write(content);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  try {
    const rawText = readSource(args.input);
    const payload = safeJsonParse(rawText, args.input || 'stdin');
    const messages = normalizeMessages(payload);
    if (messages.length === 0) {
      throw new Error('No messages found in input payload.');
    }
    const summary = buildSummary(messages, args);
    const output = args.format === 'json' ? formatJson(summary) : formatMarkdown(summary);
    writeOutput(output, args.output);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
