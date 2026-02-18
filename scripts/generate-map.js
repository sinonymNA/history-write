#!/usr/bin/env node

/**
 * Stage 1: Generate a structural map of an HTML file using Claude Haiku
 *
 * Sends a condensed "skeleton" of the file (not the full 450KB) to stay within
 * context limits and improve mapping accuracy. Validates the resulting JSON map
 * against the actual file.
 */

const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';

// ── Logging ──────────────────────────────────────────────────────────────────

function log(level, msg, data) {
  const ts = new Date().toISOString().slice(11, 23);
  const extra = data ? ' ' + JSON.stringify(data) : '';
  console.error(`[${ts}] ${level} ${msg}${extra}`);
}
const info  = (m, d) => log('INFO', m, d);
const ok    = (m, d) => log(' OK ', m, d);
const fail  = (m, d) => log('FAIL', m, d);

// ── JSON Parsing Pipeline ────────────────────────────────────────────────────

function parseJSON(raw) {
  // Step 1: strip markdown fences
  let text = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Step 2: extract { ... }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No JSON object found in response');
  }
  text = text.substring(start, end + 1);

  // Step 3: fix trailing commas
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // Step 4: try parse
  try {
    return JSON.parse(text);
  } catch (firstErr) {
    info('First parse failed, attempting truncation repair', { error: firstErr.message });

    // Step 5: truncation repair — close any open brackets
    let repaired = text;
    const opens = { '{': 0, '[': 0 };
    let inStr = false, esc = false;
    for (const c of repaired) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') opens['{']++;
      if (c === '}') opens['{']--;
      if (c === '[') opens['[']++;
      if (c === ']') opens['[']--;
    }
    // Close any dangling brackets
    for (let i = 0; i < opens['[']; i++) repaired += ']';
    for (let i = 0; i < opens['{']; i++) repaired += '}';

    // Also strip any trailing partial key-value (like `"name": "unfinis`)
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
    // Re-close
    const reopens = { '{': 0, '[': 0 };
    inStr = false; esc = false;
    for (const c of repaired) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') reopens['{']++;
      if (c === '}') reopens['{']--;
      if (c === '[') reopens['[']++;
      if (c === ']') reopens['[']--;
    }
    for (let i = 0; i < reopens['[']; i++) repaired += ']';
    for (let i = 0; i < reopens['{']; i++) repaired += '}';

    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    try {
      const result = JSON.parse(repaired);
      ok('Truncation repair succeeded');
      return result;
    } catch (secondErr) {
      throw new Error(
        `JSON parse failed after repair: ${secondErr.message}\n` +
        `Original error: ${firstErr.message}\n` +
        `First 300 chars: ${raw.substring(0, 300)}`
      );
    }
  }
}

// ── Skeleton Generator ───────────────────────────────────────────────────────

/**
 * Creates a condensed skeleton of the HTML file for Haiku to analyze.
 * Keeps structural lines (tags, comments, function declarations, class names)
 * and abbreviates long content (template literals, prose, data objects).
 */
function createSkeleton(content) {
  const lines = content.split('\n');
  const result = [];
  const structuralPatterns = [
    /^\s*<(!DOCTYPE|html|head|body|script|style|link|meta|title)/i,
    /^\s*<\/(html|head|body|script|style)/i,
    /^\s*(\/\/\s*[═━─=]+|\/\*\*|\/\/ ──)/,          // section dividers
    /^\s*(function |const |let |var |class |async |export )/,
    /^\s*(window\.|document\.|app\.|router|init|module)/,
    /^\s*['"]?(story|quiz|teacher|student|library|dashboard|editor|game|block|lesson)/i,
    /^\s*<(div|section|nav|header|footer|main|form|button)\s/i,
    /^\s*<\/(div|section|nav|header|footer|main|form)/i,
    /(getElementById|querySelector|addEventListener|createElement)/,
    /\bif\s*\(|else\s*{|switch\s*\(|case\s+/,
    /^\s*}\s*[,;]?\s*$/,                              // closing braces
    /^\s*\)\s*[,;]?\s*$/,
    /^\s*]\s*[,;]?\s*$/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Always include structural lines
    const isStructural = trimmed.length === 0 || structuralPatterns.some(p => p.test(trimmed));

    if (isStructural) {
      // Truncate very long lines
      result.push(`${i + 1}: ${line.length > 120 ? line.substring(0, 120) + '...' : line}`);
    } else if (i % 10 === 0) {
      // Sample every 10th line for context
      result.push(`${i + 1}: ${line.length > 80 ? line.substring(0, 80) + '...' : line}`);
    }
  }

  const skeleton = result.join('\n');
  info('Skeleton created', {
    originalLines: lines.length,
    skeletonLines: result.length,
    originalChars: content.length,
    skeletonChars: skeleton.length,
    compressionRatio: Math.round((1 - skeleton.length / content.length) * 100) + '%',
  });

  return skeleton;
}

// ── Haiku API Call ───────────────────────────────────────────────────────────

async function callHaiku(skeleton, filename, totalLines) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set.\n' +
      'Set it in GitHub repository Settings → Secrets → ANTHROPIC_API_KEY'
    );
  }

  const prompt = `Analyze this HTML file skeleton and create a JSON map of its major code sections.

The skeleton shows line numbers and structural lines from "${filename}" (${totalLines} total lines).
Lines that are not shown are content/data within these structural boundaries.

For each section, identify:
- name: descriptive name (e.g. "Story Lessons Module", "Quiz Game", "Teacher Dashboard CSS")
- startLine / endLine: line number boundaries (1-based, must be within 1–${totalLines})
- description: what the section does (one sentence)
- identifiers: key function names, class names, or element IDs in this section

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "filename": "${filename}",
  "totalLines": ${totalLines},
  "sections": [
    {
      "name": "Section Name",
      "startLine": 1,
      "endLine": 100,
      "description": "What this section does",
      "identifiers": ["id1", "funcName"]
    }
  ]
}

File skeleton:
${skeleton}`;

  info('Calling Haiku', { model: MODEL, promptLength: prompt.length });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Haiku API ${resp.status}: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();

  if (data.error) {
    throw new Error(`Haiku API error: ${data.error.message}`);
  }

  // Check for truncation
  if (data.stop_reason === 'max_tokens') {
    info('Response was truncated (hit max_tokens) — will attempt repair');
  }

  const text = data.content?.[0]?.text || '';
  if (!text) {
    throw new Error('Haiku returned empty response');
  }

  info('Haiku response received', { length: text.length, stopReason: data.stop_reason });
  return text;
}

// ── Map Validation ───────────────────────────────────────────────────────────

function validateMap(map, totalLines) {
  if (!map.sections || !Array.isArray(map.sections)) {
    throw new Error('Map missing "sections" array');
  }
  if (map.sections.length === 0) {
    throw new Error('Map has zero sections');
  }

  // Fix totalLines if Haiku got it wrong
  if (map.totalLines !== totalLines) {
    info('Correcting totalLines', { was: map.totalLines, actual: totalLines });
    map.totalLines = totalLines;
  }

  // Validate and clamp each section
  for (let i = 0; i < map.sections.length; i++) {
    const s = map.sections[i];
    if (!s.name) throw new Error(`Section ${i} has no name`);
    if (typeof s.startLine !== 'number' || typeof s.endLine !== 'number') {
      throw new Error(`Section "${s.name}" has non-numeric line numbers`);
    }
    // Clamp to valid range
    s.startLine = Math.max(1, Math.min(s.startLine, totalLines));
    s.endLine = Math.max(s.startLine, Math.min(s.endLine, totalLines));

    if (s.endLine - s.startLine > 2000) {
      info('Very large section', { name: s.name, lines: s.endLine - s.startLine });
    }
  }

  ok('Map validated', { sections: map.sections.length });
  return map;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    fail('Usage: node generate-map.js <html-file>');
    process.exit(1);
  }

  const fullPath = path.resolve(htmlPath);
  if (!fs.existsSync(fullPath)) {
    fail(`File not found: ${fullPath}`);
    process.exit(1);
  }

  info('Reading file', { path: fullPath });
  const content = fs.readFileSync(fullPath, 'utf-8');
  const totalLines = content.split('\n').length;
  ok('File read', { size: content.length, lines: totalLines });

  // Create skeleton
  const skeleton = createSkeleton(content);

  // Call Haiku
  const rawResponse = await callHaiku(skeleton, path.basename(htmlPath), totalLines);

  // Parse JSON
  const map = parseJSON(rawResponse);

  // Validate
  const validMap = validateMap(map, totalLines);

  // Output
  console.log(JSON.stringify(validMap, null, 2));
}

main().catch(err => {
  fail(err.message);
  process.exit(1);
});
