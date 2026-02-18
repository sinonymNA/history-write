#!/usr/bin/env node

/**
 * Stage 2: Add a feature to an HTML file using Claude Sonnet
 *
 * Reads inputs from environment variables (safe — no shell injection) with
 * argv fallback for local CLI use. When no target sections are specified,
 * uses Haiku as a scout to auto-select the most relevant sections.
 */

const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SONNET = 'claude-sonnet-4-5-20250929';
const HAIKU  = 'claude-haiku-4-5-20251001';

// ── Logging ──────────────────────────────────────────────────────────────────

function log(level, msg, data) {
  const ts = new Date().toISOString().slice(11, 23);
  const extra = data ? ' ' + JSON.stringify(data) : '';
  console.error(`[${ts}] ${level} ${msg}${extra}`);
}
const info  = (m, d) => log('INFO', m, d);
const ok    = (m, d) => log(' OK ', m, d);
const fail  = (m, d) => log('FAIL', m, d);

// ── JSON Parsing Pipeline (shared with generate-map.js) ─────────────────────

function parseJSON(raw) {
  let text = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No JSON object found in response');
  }
  text = text.substring(start, end + 1);
  text = text.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(text);
  } catch (firstErr) {
    info('First parse failed, attempting truncation repair', { error: firstErr.message });

    let repaired = text;
    // Strip trailing partial entry
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
    // Count and close open brackets
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
    for (let i = 0; i < opens['[']; i++) repaired += ']';
    for (let i = 0; i < opens['{']; i++) repaired += '}';
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    try {
      const result = JSON.parse(repaired);
      ok('Truncation repair succeeded');
      return result;
    } catch (secondErr) {
      throw new Error(
        `JSON parse failed after repair: ${secondErr.message}\n` +
        `First 300 chars: ${raw.substring(0, 300)}`
      );
    }
  }
}

// ── Anthropic API helper ─────────────────────────────────────────────────────

async function callAPI(model, systemPrompt, userPrompt, maxTokens = 16000) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`API ${resp.status}: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();
  if (data.error) throw new Error(`API error: ${data.error.message}`);

  if (data.stop_reason === 'max_tokens') {
    info('Response truncated (hit max_tokens) — will attempt repair');
  }

  const text = data.content?.[0]?.text || '';
  if (!text) throw new Error('API returned empty response');

  return text;
}

// ── Section Auto-Selection (Haiku scout) ─────────────────────────────────────

async function autoSelectSections(featureDescription, map) {
  info('Auto-selecting sections with Haiku scout...');

  const sectionList = map.sections
    .map(s => `- "${s.name}" (L${s.startLine}–${s.endLine}): ${s.description}`)
    .join('\n');

  const prompt = `Given this feature request and code sections, which sections need to be modified?

Feature: ${featureDescription}

Available sections:
${sectionList}

Return ONLY a JSON array of section names that need modification (2-5 sections max):
["Section Name 1", "Section Name 2"]

Pick only the sections directly relevant to implementing this feature.`;

  const raw = await callAPI(HAIKU, 'You select which code sections to modify. Return only a JSON array.', prompt, 1000);

  // Parse the array
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart === -1 || arrEnd === -1) {
    throw new Error('Haiku scout did not return a valid JSON array');
  }

  const selected = JSON.parse(cleaned.substring(arrStart, arrEnd + 1));

  if (!Array.isArray(selected) || selected.length === 0) {
    throw new Error('Haiku scout returned empty selection');
  }

  // Validate against map — filter to only names that actually exist
  const validNames = new Set(map.sections.map(s => s.name));
  const matched = selected.filter(n => validNames.has(n));

  if (matched.length === 0) {
    // Haiku hallucinated section names — try fuzzy matching
    info('No exact matches, trying fuzzy match...');
    const fuzzy = selected.map(name => {
      const lower = name.toLowerCase();
      return map.sections.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()));
    }).filter(Boolean);

    if (fuzzy.length === 0) {
      throw new Error(
        `Haiku selected sections that don't exist in the map.\n` +
        `Selected: ${selected.join(', ')}\n` +
        `Available: ${[...validNames].join(', ')}`
      );
    }

    ok('Fuzzy matched sections', { count: fuzzy.length, names: fuzzy.map(s => s.name) });
    return fuzzy.map(s => s.name);
  }

  ok('Sections auto-selected', { count: matched.length, names: matched });
  return matched;
}

// ── Feature Generation (Sonnet) ──────────────────────────────────────────────

async function generateFeature(featureDescription, htmlContent, map, targetSectionNames) {
  // Extract code snippets for target sections
  const lines = htmlContent.split('\n');
  const snippets = targetSectionNames.map(name => {
    const section = map.sections.find(s => s.name === name);
    if (!section) return null;
    const code = lines.slice(section.startLine - 1, section.endLine).join('\n');
    return `=== ${section.name} (lines ${section.startLine}–${section.endLine}) ===\n${code}`;
  }).filter(Boolean);

  if (snippets.length === 0) {
    throw new Error('No valid code snippets to send to Sonnet');
  }

  const systemPrompt = `You are a senior frontend developer. You implement features in HTML/CSS/JS applications by modifying specific code sections. Return ONLY valid JSON.`;

  const userPrompt = `Implement this feature by modifying the code sections below.

Feature: ${featureDescription}

Sections to modify:
${snippets.join('\n\n')}

Return ONLY this JSON structure:
{
  "modifications": [
    {
      "sectionName": "Name of section",
      "type": "replace",
      "newContent": "Complete replacement code for this section"
    }
  ],
  "summary": "What was implemented"
}

Rules:
- "type" must be "replace" — provide the COMPLETE new code for each section
- Include ALL original code that isn't being changed
- Maintain proper indentation
- Do NOT break existing functionality
- Do NOT add dependencies not already in the file`;

  info('Calling Sonnet', { model: SONNET, snippetCount: snippets.length });
  const raw = await callAPI(SONNET, systemPrompt, userPrompt);

  const result = parseJSON(raw);

  if (!Array.isArray(result.modifications) || result.modifications.length === 0) {
    throw new Error('Sonnet returned no modifications');
  }

  // Validate all modification section names exist
  const validNames = new Set(map.sections.map(s => s.name));
  for (const mod of result.modifications) {
    if (!validNames.has(mod.sectionName)) {
      fail('Modification references unknown section', { name: mod.sectionName });
      // Try to find the closest match
      const closest = map.sections.find(s =>
        s.name.toLowerCase().includes(mod.sectionName.toLowerCase()) ||
        mod.sectionName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (closest) {
        info('Fuzzy-matched to', { name: closest.name });
        mod.sectionName = closest.name;
      } else {
        throw new Error(
          `Sonnet referenced non-existent section: "${mod.sectionName}"\n` +
          `Available: ${[...validNames].join(', ')}`
        );
      }
    }
  }

  ok('Feature generated', { modifications: result.modifications.length, summary: result.summary });
  return result;
}

// ── Apply Modifications ──────────────────────────────────────────────────────

function applyModifications(htmlContent, modifications, map) {
  let lines = htmlContent.split('\n');

  // Sort by startLine descending so splicing doesn't shift later indices
  const sorted = [...modifications].sort((a, b) => {
    const sa = map.sections.find(s => s.name === a.sectionName);
    const sb = map.sections.find(s => s.name === b.sectionName);
    return (sb?.startLine || 0) - (sa?.startLine || 0);
  });

  // Check for overlapping sections
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = map.sections.find(s => s.name === sorted[i].sectionName);
    const next = map.sections.find(s => s.name === sorted[i + 1].sectionName);
    if (curr && next && curr.startLine <= next.endLine && next.startLine <= curr.endLine) {
      fail('Overlapping sections detected', { a: curr.name, b: next.name });
      throw new Error(`Sections "${curr.name}" and "${next.name}" overlap — cannot safely splice both`);
    }
  }

  for (const mod of sorted) {
    const section = map.sections.find(s => s.name === mod.sectionName);
    if (!section) continue;

    const startIdx = section.startLine - 1;  // 0-based
    const endIdx = section.endLine;           // exclusive

    // Bounds check
    if (startIdx < 0 || endIdx > lines.length || startIdx >= endIdx) {
      throw new Error(
        `Section "${section.name}" bounds invalid: [${section.startLine}, ${section.endLine}] ` +
        `vs ${lines.length} total lines`
      );
    }

    const newLines = mod.newContent.split('\n');

    info('Replacing section', {
      name: section.name,
      originalLines: endIdx - startIdx,
      newLines: newLines.length,
    });

    lines = [...lines.slice(0, startIdx), ...newLines, ...lines.slice(endIdx)];
  }

  ok('All modifications applied', { finalLines: lines.length });
  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Read inputs from env vars (workflow) or argv (CLI)
  const htmlPath = process.env.INPUT_FILENAME || process.argv[2];
  const featureDescription = process.env.INPUT_FEATURE || process.argv[4];
  const sectionsInput = process.env.INPUT_SECTIONS || process.argv.slice(5).join(',');

  if (!htmlPath || !featureDescription) {
    fail('Missing inputs. Set INPUT_FILENAME + INPUT_FEATURE env vars, or: node add-feature.js <file> <map> <feature> [sections...]');
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    fail('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  // Resolve paths
  const basename = path.basename(htmlPath, '.html');
  const mapPath = process.env.INPUT_MAP || process.argv[3] || `map-${basename}.json`;
  const fullHtmlPath = path.resolve(htmlPath);
  const fullMapPath = path.resolve(mapPath);
  const outputPath = path.resolve(`${basename}.modified.html`);

  // Read files
  if (!fs.existsSync(fullHtmlPath)) throw new Error(`HTML file not found: ${fullHtmlPath}`);
  if (!fs.existsSync(fullMapPath)) throw new Error(`Map file not found: ${fullMapPath}`);

  info('Reading files');
  const htmlContent = fs.readFileSync(fullHtmlPath, 'utf-8');
  const map = JSON.parse(fs.readFileSync(fullMapPath, 'utf-8'));
  ok('Files loaded', { htmlSize: htmlContent.length, sections: map.sections.length });

  // Determine target sections
  let targetSections = sectionsInput
    ? sectionsInput.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (targetSections.length === 0) {
    // Use Haiku scout to auto-select
    targetSections = await autoSelectSections(featureDescription, map);
  } else {
    // Validate manually specified sections
    const validNames = new Set(map.sections.map(s => s.name));
    const invalid = targetSections.filter(n => !validNames.has(n));
    if (invalid.length > 0) {
      throw new Error(
        `Unknown sections: ${invalid.join(', ')}\n` +
        `Available: ${[...validNames].join(', ')}`
      );
    }
  }

  info('Target sections', { count: targetSections.length, names: targetSections });

  // Generate feature
  const result = await generateFeature(featureDescription, htmlContent, map, targetSections);

  // Apply
  const modified = applyModifications(htmlContent, result.modifications, map);

  // Write output
  fs.writeFileSync(outputPath, modified, 'utf-8');
  ok('Output written', { path: outputPath, size: modified.length });

  // Summary to stdout
  console.log(JSON.stringify({
    success: true,
    output: outputPath,
    summary: result.summary,
    modifications: result.modifications.length,
    sections: targetSections,
  }, null, 2));
}

main().catch(err => {
  fail(err.message);
  console.log(JSON.stringify({ success: false, error: err.message }, null, 2));
  process.exit(1);
});
