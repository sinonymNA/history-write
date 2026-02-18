#!/usr/bin/env node

/**
 * Stage 1: Generate a map of HTML file structure using Claude Haiku
 *
 * Input: HTML file path
 * Output: JSON map of code sections with line numbers
 *
 * Robust error handling:
 * - Cleans markdown code fences from Haiku response
 * - Validates JSON structure
 * - Retries once if initial parse fails
 * - Validates map against actual HTML file
 */

const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_RETRIES = 1;

// ============================================================================
// ERROR HANDLING & UTILITIES
// ============================================================================

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function log(level, message, data = '') {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
}

function logSuccess(message, data = '') {
  log('✓', message, data);
}

function logError(message, data = '') {
  log('✗', message, data);
}

function logInfo(message, data = '') {
  log('INFO', message, data);
}

// ============================================================================
// JSON REPAIR & PARSING
// ============================================================================

/**
 * Clean markdown code fences from response
 */
function cleanMarkdown(text) {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

/**
 * Extract JSON from text (find first { to last })
 */
function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || start >= end) {
    throw new ValidationError('No valid JSON object found in response');
  }

  return text.substring(start, end + 1);
}

/**
 * Repair common JSON issues from AI responses
 */
function repairJSON(text) {
  let result = text;

  // Fix trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');

  // Fix common unescaped quotes inside strings
  // This is a simple heuristic - check for patterns like "text " word"
  // and fix them
  result = result.replace(/(\": \"[^\"]*)\s+([a-zA-Z])/g, '$1 $2');

  return result;
}

/**
 * Robust JSON parsing with cleanup and retry
 */
function parseJSONResponse(text, attempt = 1) {
  try {
    // Step 1: Clean markdown fences
    let cleaned = cleanMarkdown(text);
    logInfo('Cleaned markdown fences', { length: cleaned.length });

    // Step 2: Extract JSON
    let jsonStr = extractJSON(cleaned);
    logInfo('Extracted JSON', { length: jsonStr.length });

    // Step 3: Repair common issues
    jsonStr = repairJSON(jsonStr);

    // Step 4: Parse
    const parsed = JSON.parse(jsonStr);
    logSuccess('Successfully parsed JSON response');
    return parsed;
  } catch (error) {
    if (attempt < MAX_RETRIES + 1) {
      logError(`JSON parse attempt ${attempt} failed`, { error: error.message });
      // On retry, try even more aggressive repair
      if (attempt === 1) {
        try {
          const aggressive = text.replace(/^```[\s\S]*?\n/, '').replace(/\n?```$/, '');
          logInfo('Retrying with aggressive markdown cleanup', { length: aggressive.length });
          return parseJSONResponse(aggressive, attempt + 1);
        } catch (e) {
          logError('Aggressive retry failed', { error: e.message });
          throw error;
        }
      }
    }

    throw new ValidationError(
      `Failed to parse JSON response (attempt ${attempt}): ${error.message}\n` +
      `First 200 chars: ${text.substring(0, 200)}`
    );
  }
}

// ============================================================================
// MAP GENERATION WITH HAIKU
// ============================================================================

/**
 * Generate a map of HTML file structure using Haiku
 */
async function generateMap(htmlPath, fileContent) {
  if (!ANTHROPIC_API_KEY) {
    throw new ValidationError('ANTHROPIC_API_KEY environment variable is not set');
  }

  const prompt = `Analyze this HTML file and create a JSON map of major code sections with line numbers.

For each section, identify:
- The section name (descriptive, e.g., "Story Lessons Module", "Quiz Game", "Teacher Dashboard")
- The starting line number
- The ending line number
- Brief description of what the section does
- Key identifiers (function names, class names, element IDs)

Focus on logical sections that are meaningful for feature implementation, not line-by-line analysis.

Return ONLY valid JSON in this exact format, with no markdown or explanation:
{
  "filename": "the.html",
  "totalLines": 5000,
  "sections": [
    {
      "name": "Section Name",
      "startLine": 100,
      "endLine": 250,
      "description": "What this section does",
      "identifiers": ["id1", "id2", "className"]
    }
  ]
}

HTML file content:
\`\`\`
${fileContent}
\`\`\``;

  logInfo('Sending request to Haiku', { model: MODEL, contentLength: fileContent.length });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ValidationError(
      `Haiku API error (${response.status}): ${error.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new ValidationError(`API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.content?.[0]?.text || '';
  if (!text) {
    throw new ValidationError('No content returned from Haiku');
  }

  logInfo('Received response from Haiku', { length: text.length });

  // Parse the response
  const map = parseJSONResponse(text);

  return map;
}

// ============================================================================
// MAP VALIDATION
// ============================================================================

/**
 * Validate the generated map against the actual HTML file
 */
function validateMap(map, htmlContent) {
  const lines = htmlContent.split('\n');
  const totalLines = lines.length;

  // Validate basic structure
  if (!map.sections || !Array.isArray(map.sections)) {
    throw new ValidationError('Map missing "sections" array');
  }

  if (map.sections.length === 0) {
    throw new ValidationError('Map contains no sections');
  }

  // Validate each section
  for (let i = 0; i < map.sections.length; i++) {
    const section = map.sections[i];

    if (!section.name) {
      throw new ValidationError(`Section ${i} missing "name" field`);
    }

    if (typeof section.startLine !== 'number' || typeof section.endLine !== 'number') {
      throw new ValidationError(
        `Section "${section.name}" has invalid line numbers: ` +
        `startLine=${section.startLine}, endLine=${section.endLine}`
      );
    }

    if (section.startLine < 1 || section.endLine > totalLines) {
      throw new ValidationError(
        `Section "${section.name}" line numbers out of bounds: ` +
        `[${section.startLine}, ${section.endLine}] vs total ${totalLines}`
      );
    }

    if (section.startLine > section.endLine) {
      throw new ValidationError(
        `Section "${section.name}" has inverted line numbers: ` +
        `${section.startLine} > ${section.endLine}`
      );
    }

    // Warn if section is very large (> 500 lines)
    if (section.endLine - section.startLine > 500) {
      logInfo('⚠ Large section detected', {
        name: section.name,
        lines: section.endLine - section.startLine,
      });
    }
  }

  // Validate total lines matches
  if (map.totalLines !== totalLines) {
    logInfo('Map totalLines mismatch (correcting)', {
      mapSays: map.totalLines,
      actual: totalLines,
    });
    map.totalLines = totalLines;
  }

  logSuccess('Map validation passed', { sections: map.sections.length });
  return map;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Parse arguments
    const htmlPath = process.argv[2];

    if (!htmlPath) {
      throw new ValidationError('Usage: node generate-map.js <html-file-path>');
    }

    const fullPath = path.resolve(htmlPath);

    if (!fs.existsSync(fullPath)) {
      throw new ValidationError(`File not found: ${fullPath}`);
    }

    logInfo('Reading HTML file', { path: fullPath });
    const htmlContent = fs.readFileSync(fullPath, 'utf-8');
    logSuccess('HTML file read', { size: htmlContent.length });

    // Generate map
    logInfo('Generating map with Haiku...');
    const map = await generateMap(fullPath, htmlContent);

    // Validate map
    const validatedMap = validateMap(map, htmlContent);

    // Output as JSON to stdout
    console.log(JSON.stringify(validatedMap, null, 2));

  } catch (error) {
    logError(
      error.name === 'ValidationError' ? 'Validation failed' : 'Fatal error',
      { message: error.message }
    );
    process.exit(1);
  }
}

main();
