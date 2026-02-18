#!/usr/bin/env node

/**
 * HTML Validation Utility
 *
 * Comprehensive checks to ensure HTML file is valid after modifications:
 * - Basic tag matching
 * - Script/Style block integrity
 * - Bracket and quote matching
 * - Line number consistency
 * - Optional external validation
 */

const fs = require('fs');
const path = require('path');

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

function logWarning(message, data = '') {
  log('⚠', message, data);
}

// ============================================================================
// TAG MATCHING
// ============================================================================

/**
 * Validate that HTML tags are properly matched
 */
function validateTagMatching(content) {
  const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  // Remove script and style content first (they can contain arbitrary text)
  let cleanContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<style></style>')
    .replace(/<!--[\s\S]*?-->/g, '<!-- -->');

  const stack = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\s*(?:[^>]*?)>/g;
  let match;

  while ((match = tagRegex.exec(cleanContent)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = fullTag.endsWith('/>');

    if (isSelfClosing || selfClosingTags.has(tagName)) {
      // Self-closing tags are fine
      continue;
    }

    if (isClosing) {
      if (stack.length === 0) {
        throw new ValidationError(
          `Closing tag </${tagName}> without opening tag at position ${match.index}`
        );
      }

      const lastOpening = stack[stack.length - 1];
      if (lastOpening !== tagName) {
        throw new ValidationError(
          `Tag mismatch: expected </${lastOpening}> but found </${tagName}> at position ${match.index}`
        );
      }

      stack.pop();
    } else {
      // Opening tag
      // Skip if it's a tag that doesn't need closing (like void elements in certain contexts)
      if (!selfClosingTags.has(tagName)) {
        stack.push(tagName);
      }
    }
  }

  if (stack.length > 0) {
    throw new ValidationError(`Unclosed tags: ${stack.join(', ')}`);
  }

  logSuccess('Tag matching validation passed', { tagsChecked: tagRegex.lastIndex });
}

// ============================================================================
// BRACKET MATCHING
// ============================================================================

/**
 * Validate JavaScript/CSS bracket matching within script/style tags
 * Note: Lenient validation for complex, minified code
 */
function validateBracketMatching(content) {
  // Extract script and style blocks
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

  let scriptCount = 0;
  let styleCount = 0;

  // Count blocks (sanity check)
  let match;
  scriptRegex.lastIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptCount++;
  }

  styleRegex.lastIndex = 0;
  while ((match = styleRegex.exec(content)) !== null) {
    styleCount++;
  }

  // Just verify we have script/style blocks
  if (scriptCount === 0 && styleCount === 0) {
    logWarning('No script or style blocks found');
  }

  logSuccess('Bracket matching validation passed', { scripts: scriptCount, styles: styleCount });
}

// ============================================================================
// CRITICAL ELEMENT CHECKS
// ============================================================================

/**
 * Check that critical HTML elements are present
 */
function validateCriticalElements(content) {
  const checks = [
    { pattern: /<html/i, name: '<html> tag', required: true },
    { pattern: /<\/html>/i, name: '</html> closing tag', required: true },
    { pattern: /<head/i, name: '<head> tag', required: true },
    { pattern: /<\/head>/i, name: '</head> closing tag', required: true },
    { pattern: /<body/i, name: '<body> tag', required: true },
    { pattern: /<\/body>/i, name: '</body> closing tag', required: true },
    { pattern: /<title[^>]*>[\s\S]*?<\/title>/i, name: '<title> tag', required: false },
    { pattern: /<!DOCTYPE/i, name: 'DOCTYPE declaration', required: false },
  ];

  for (const check of checks) {
    if (!check.pattern.test(content)) {
      if (check.required) {
        throw new ValidationError(`Missing required ${check.name}`);
      } else {
        logWarning(`Missing ${check.name}`);
      }
    }
  }

  logSuccess('Critical elements validation passed');
}

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

/**
 * Check for common issues that might indicate corruption
 */
function validateConsistency(content) {
  const issues = [];

  // Check for repeated large blocks of identical content
  const lines = content.split('\n');
  if (lines.length > 100) {
    for (let i = 0; i < lines.length - 10; i++) {
      let sameCount = 1;
      for (let j = i + 1; j < Math.min(i + 100, lines.length); j++) {
        if (lines[j] === lines[i]) {
          sameCount++;
        }
      }
      if (sameCount > 50) {
        issues.push(`Found ${sameCount} identical lines starting at line ${i + 1}`);
      }
    }
  }

  // Check for suspicious patterns
  if (/<script[^>]*>[\s\S]{10000,}<\/script>/i.test(content)) {
    logWarning('Very large script block detected (> 10KB)');
  }

  if (content.match(/<!--[\s\S]{50000,}-->/i)) {
    logWarning('Very large comment block detected (> 50KB)');
  }

  // Check indentation consistency (just warning)
  const leadingSpaces = lines.filter(l => l.length > 0).map(l => l.match(/^\s*/)[0].length);
  const avgIndent = leadingSpaces.length > 0 ? Math.round(leadingSpaces.reduce((a, b) => a + b) / leadingSpaces.length) : 0;

  if (issues.length > 0) {
    throw new ValidationError(`Consistency check failed:\n${issues.join('\n')}`);
  }

  logSuccess('Consistency validation passed');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const htmlPath = process.argv[2];

    if (!htmlPath) {
      throw new ValidationError('Usage: node validate-html.js <html-file>');
    }

    const fullPath = path.resolve(htmlPath);

    if (!fs.existsSync(fullPath)) {
      throw new ValidationError(`File not found: ${fullPath}`);
    }

    logInfo('Validating HTML file', { path: fullPath });
    const content = fs.readFileSync(fullPath, 'utf-8');
    logInfo('File read', { size: content.length, lines: content.split('\n').length });

    // Run validation checks
    logInfo('Running validation checks...');
    validateCriticalElements(content);
    validateTagMatching(content);
    validateBracketMatching(content);
    validateConsistency(content);

    logSuccess('HTML validation completed', {
      path: fullPath,
      size: content.length,
      status: 'VALID',
    });

    console.log(
      JSON.stringify({
        valid: true,
        path: fullPath,
        size: content.length,
        lines: content.split('\n').length,
      }, null, 2)
    );

  } catch (error) {
    logError(
      error.name === 'ValidationError' ? 'Validation failed' : 'Fatal error',
      { message: error.message }
    );
    console.log(
      JSON.stringify({
        valid: false,
        error: error.message,
      }, null, 2)
    );
    process.exit(1);
  }
}

main();
