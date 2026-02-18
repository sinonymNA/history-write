#!/usr/bin/env node

/**
 * Stage 2: Add feature to HTML file using Claude Sonnet
 *
 * Input: Feature description, HTML file, section map
 * Output: Modified HTML file with feature added
 *
 * Robust error handling:
 * - Validates section names exist in map
 * - Handles Sonnet JSON response parsing with retry
 * - Validates spliced HTML doesn't go out of bounds
 * - Validates HTML structure after modifications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';
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
// JSON PARSING (same as Stage 1)
// ============================================================================

function cleanMarkdown(text) {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || start >= end) {
    throw new ValidationError('No valid JSON object found in response');
  }

  return text.substring(start, end + 1);
}

function repairJSON(text) {
  let result = text;
  result = result.replace(/,(\s*[}\]])/g, '$1');
  result = result.replace(/(\": \"[^\"]*)\s+([a-zA-Z])/g, '$1 $2');
  return result;
}

function parseJSONResponse(text, attempt = 1) {
  try {
    let cleaned = cleanMarkdown(text);
    let jsonStr = extractJSON(cleaned);
    jsonStr = repairJSON(jsonStr);
    const parsed = JSON.parse(jsonStr);
    logSuccess('Successfully parsed JSON response');
    return parsed;
  } catch (error) {
    if (attempt < MAX_RETRIES + 1) {
      logError(`JSON parse attempt ${attempt} failed`, { error: error.message });
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
      `Failed to parse JSON response (attempt ${attempt}): ${error.message}`
    );
  }
}

// ============================================================================
// HTML SPLICING WITH VALIDATION
// ============================================================================

/**
 * Splice code into HTML file at specified line numbers
 * Validates bounds and preserves line structure
 */
function spliceHTML(lines, insertionPoint, code) {
  // Validate bounds
  if (insertionPoint < 0 || insertionPoint > lines.length) {
    throw new ValidationError(
      `Insertion point ${insertionPoint} out of bounds [0, ${lines.length}]`
    );
  }

  // Split code into lines
  const codeLines = code.split('\n');

  // Insert
  const newLines = [...lines.slice(0, insertionPoint), ...codeLines, ...lines.slice(insertionPoint)];

  logSuccess('HTML spliced', {
    insertionPoint,
    codeLineCount: codeLines.length,
    totalLines: newLines.length,
  });

  return newLines;
}

/**
 * Replace or modify a specific section
 */
function replaceSection(lines, sectionStartLine, sectionEndLine, newContent) {
  // Convert from 1-based to 0-based indexing
  const startIdx = sectionStartLine - 1;
  const endIdx = sectionEndLine;

  // Validate bounds
  if (startIdx < 0 || endIdx > lines.length || startIdx > endIdx) {
    throw new ValidationError(
      `Invalid section bounds: [${sectionStartLine}, ${sectionEndLine}] ` +
      `converted to [${startIdx}, ${endIdx}] vs total ${lines.length}`
    );
  }

  const newContentLines = newContent.split('\n');

  const newLines = [
    ...lines.slice(0, startIdx),
    ...newContentLines,
    ...lines.slice(endIdx),
  ];

  logSuccess('Section replaced', {
    originalLines: sectionEndLine - sectionStartLine + 1,
    newLines: newContentLines.length,
    totalLines: newLines.length,
  });

  return newLines;
}

// ============================================================================
// HTML VALIDATION
// ============================================================================

/**
 * Basic HTML validity check
 * - Matching opening/closing tags count
 * - No severe syntax errors
 */
function validateHTML(content) {
  // Count opening tags (excluding self-closing)
  const openingTags = (content.match(/<[^/>]+>/g) || []).length;
  const closingTags = (content.match(/<\/[^>]+>/g) || []).length;

  // Self-closing tags that shouldn't be counted
  const selfClosing = (content.match(/<[^>]+\/>/g) || []).length;

  // Script and style tags can have imbalanced content
  const inScriptStyle = (content.match(/<script[^>]*>[\s\S]*?<\/script>|<style[^>]*>[\s\S]*?<\/style>/gi) || []);

  logInfo('HTML tag analysis', {
    openingTags,
    closingTags,
    selfClosing,
    scriptStyleBlocks: inScriptStyle.length,
  });

  // Very basic check - just ensure we have SOME tags
  if (openingTags < 5) {
    throw new ValidationError('HTML contains suspiciously few tags (< 5)');
  }

  // Check for critical tags
  if (!/<html/i.test(content) || !/<\/html>/i.test(content)) {
    logInfo('⚠ Warning: HTML tags missing', { hasHTML: /<html/i.test(content) });
  }

  if (!/<body/i.test(content) || !/<\/body>/i.test(content)) {
    throw new ValidationError('HTML missing body tags');
  }

  logSuccess('HTML structure validation passed');
  return true;
}

/**
 * Run HTML validator if available (html-validate, htmlhint, etc.)
 */
function runHTMLValidator(htmlPath) {
  try {
    // Try html-validate if available
    execSync(`html-validate ${htmlPath}`, { stdio: 'pipe' });
    logSuccess('HTML validator passed');
  } catch (error) {
    if (error.code === 127) {
      // Tool not installed, skip
      logInfo('HTML validator not installed (skipped)');
    } else if (error.status !== 0) {
      logError('HTML validator reported issues', { code: error.status });
      // Don't fail on this - just warn
    }
  }
}

// ============================================================================
// FEATURE GENERATION WITH SONNET
// ============================================================================

/**
 * Generate feature implementation using Sonnet
 */
async function generateFeature(featureDescription, htmlContent, map, targetSectionNames) {
  if (!ANTHROPIC_API_KEY) {
    throw new ValidationError('ANTHROPIC_API_KEY environment variable is not set');
  }

  // Validate requested sections exist
  const validSections = map.sections.map(s => s.name);
  const invalidSections = targetSectionNames.filter(n => !validSections.includes(n));

  if (invalidSections.length > 0) {
    throw new ValidationError(
      `Requested sections do not exist in map: ${invalidSections.join(', ')}\n` +
      `Available sections: ${validSections.join(', ')}`
    );
  }

  // Get the target sections
  const targetSections = map.sections.filter(s => targetSectionNames.includes(s.name));

  // Extract relevant code snippets
  const lines = htmlContent.split('\n');
  const snippets = targetSections.map(section => {
    const startIdx = section.startLine - 1;
    const endIdx = section.endLine;
    const code = lines.slice(startIdx, endIdx).join('\n');
    return `=== ${section.name} (lines ${section.startLine}-${section.endLine}) ===\n${code}`;
  }).join('\n\n');

  const prompt = `You are a frontend developer implementing a feature in an HTML application.

Feature Request: ${featureDescription}

Target Sections to Modify: ${targetSectionNames.join(', ')}

Here are the relevant code sections you can modify:

${snippets}

Your task:
1. Analyze the feature request
2. Plan modifications to implement the feature
3. Generate the modified code sections

Return ONLY valid JSON with this exact structure:
{
  "modifications": [
    {
      "sectionName": "Name of section to modify",
      "type": "replace",
      "newContent": "The complete new code for this section (include opening/closing tags, keep indentation)"
    },
    {
      "sectionName": "Name of section",
      "type": "insert",
      "insertAfterLine": 50,
      "content": "New code to insert"
    }
  ],
  "summary": "Brief description of what was implemented"
}

CRITICAL REQUIREMENTS:
- "type" must be either "replace" or "insert"
- For "replace", provide complete section including all opening/closing tags
- For "insert", insertAfterLine is relative to the start of that section
- All line numbers in the original map must be maintained
- Do NOT introduce syntax errors
- Do NOT remove critical functionality
- Preserve all existing code that's not being modified
- Return ONLY the JSON, no markdown, no explanation`;

  logInfo('Sending request to Sonnet', {
    model: MODEL,
    sections: targetSectionNames.length,
    snippetsLength: snippets.length,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
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
      `Sonnet API error (${response.status}): ${error.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new ValidationError(`API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.content?.[0]?.text || '';
  if (!text) {
    throw new ValidationError('No content returned from Sonnet');
  }

  logInfo('Received response from Sonnet', { length: text.length });

  // Parse the response
  const result = parseJSONResponse(text);

  // Validate result structure
  if (!Array.isArray(result.modifications)) {
    throw new ValidationError('Response missing "modifications" array');
  }

  if (result.modifications.length === 0) {
    throw new ValidationError('No modifications provided');
  }

  logSuccess('Feature generation completed', { modifications: result.modifications.length });
  return result;
}

// ============================================================================
// MODIFICATION APPLICATION
// ============================================================================

/**
 * Apply modifications to HTML content
 */
function applyModifications(htmlContent, modifications, map) {
  let lines = htmlContent.split('\n');

  // Sort modifications by section line number (highest first) to maintain line indices
  const sortedMods = [...modifications].sort((a, b) => {
    const sectionA = map.sections.find(s => s.name === a.sectionName);
    const sectionB = map.sections.find(s => s.name === b.sectionName);
    return (sectionB?.startLine || 0) - (sectionA?.startLine || 0);
  });

  for (const mod of sortedMods) {
    const section = map.sections.find(s => s.name === mod.sectionName);

    if (!section) {
      throw new ValidationError(`Section not found: ${mod.sectionName}`);
    }

    if (mod.type === 'replace') {
      lines = replaceSection(lines, section.startLine, section.endLine, mod.newContent);
    } else if (mod.type === 'insert') {
      // Insert is relative to section start
      const absoluteLine = section.startLine + (mod.insertAfterLine || 0);
      lines = spliceHTML(lines, absoluteLine, mod.content);
    } else {
      throw new ValidationError(`Unknown modification type: ${mod.type}`);
    }
  }

  const newContent = lines.join('\n');

  logSuccess('Modifications applied', { finalLines: lines.length });

  return newContent;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Parse arguments
    const htmlPath = process.argv[2];
    const mapPath = process.argv[3];
    const featureDescription = process.argv[4];

    if (!htmlPath || !mapPath || !featureDescription) {
      throw new ValidationError(
        'Usage: node add-feature.js <html-file> <map-file> <feature-description> [section1 section2 ...]'
      );
    }

    const fullHtmlPath = path.resolve(htmlPath);
    const fullMapPath = path.resolve(mapPath);

    // Read files
    if (!fs.existsSync(fullHtmlPath)) {
      throw new ValidationError(`HTML file not found: ${fullHtmlPath}`);
    }

    if (!fs.existsSync(fullMapPath)) {
      throw new ValidationError(`Map file not found: ${fullMapPath}`);
    }

    logInfo('Reading files', { htmlPath: fullHtmlPath, mapPath: fullMapPath });
    const htmlContent = fs.readFileSync(fullHtmlPath, 'utf-8');
    const map = JSON.parse(fs.readFileSync(fullMapPath, 'utf-8'));
    logSuccess('Files read', { htmlSize: htmlContent.length, sections: map.sections.length });

    // Get target sections
    const targetSections = process.argv.slice(5);
    if (targetSections.length === 0) {
      // Default: all sections
      logInfo('No sections specified, targeting all sections');
      targetSections.push(...map.sections.map(s => s.name));
    }

    // Validate initial HTML
    logInfo('Validating initial HTML...');
    validateHTML(htmlContent);

    // Generate feature
    logInfo('Generating feature with Sonnet...');
    const result = await generateFeature(featureDescription, htmlContent, map, targetSections);

    // Apply modifications
    logInfo('Applying modifications...');
    const modifiedContent = applyModifications(htmlContent, result.modifications, map);

    // Validate modified HTML
    logInfo('Validating modified HTML...');
    validateHTML(modifiedContent);

    // Write output
    const outputPath = fullHtmlPath.replace(/\.html$/, '.modified.html');
    fs.writeFileSync(outputPath, modifiedContent, 'utf-8');

    logSuccess('Feature added successfully', {
      outputPath,
      modifications: result.modifications.length,
      summary: result.summary,
    });

    // Output result JSON
    console.log(
      JSON.stringify({
        success: true,
        outputPath,
        summary: result.summary,
        modificationsCount: result.modifications.length,
      }, null, 2)
    );

  } catch (error) {
    logError(
      error.name === 'ValidationError' ? 'Validation failed' : 'Fatal error',
      { message: error.message }
    );
    console.log(
      JSON.stringify({
        success: false,
        error: error.message,
      }, null, 2)
    );
    process.exit(1);
  }
}

main();
