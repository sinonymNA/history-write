# AI-Powered Feature Addition System

A production-ready two-stage GitHub Actions workflow system that uses Claude AI to intelligently add features to HTML files. Built with robust error handling, validation, and comprehensive logging.

## Overview

```
Plain English Feature Request
           ↓
    [Stage 1: Map Generation]  (Haiku)
     Identify relevant code sections
           ↓
        Code Map (JSON)
           ↓
    [Stage 2: Implementation]  (Sonnet)
     Generate and splice in modifications
           ↓
    Validated Modified HTML
```

### Two-Stage Approach

**Why two stages?**
- **Stage 1 (Haiku)**: Maps the HTML file structure to identify logical sections. Haiku is fast and cheap.
- **Stage 2 (Sonnet)**: Uses the map to implement features with context. Sonnet is more capable at code generation.

This two-stage approach:
- Reduces API costs (Haiku for mapping, Sonnet for implementation)
- Improves accuracy (Sonnet sees the full context via the map)
- Enables human review (you can review the map before implementation)

## Quick Start

### Prerequisites

1. **GitHub Repository Setup**
   - Repository with this workflow directory structure
   - HTML file(s) in the repository root

2. **Secrets Configuration**
   - Set `ANTHROPIC_API_KEY` in GitHub repository secrets:
     - Go to: Settings → Secrets and variables → Actions
     - Create `ANTHROPIC_API_KEY` with your API key

### Usage

#### Stage 1: Generate Map (Optional Manual Step)

```bash
# Generate map for an HTML file
gh workflow run map-generator.yml \
  -f filename=historywrite.html
```

Or use the GitHub UI:
1. Go to Actions tab
2. Select "Generate Code Map" workflow
3. Click "Run workflow"
4. Enter the HTML filename
5. Click "Run workflow"

**Output**: A `map-historywrite.html.json` file describing all code sections

#### Stage 2: Add Feature

```bash
# Add a feature to an HTML file
gh workflow run add-feature.yml \
  -f filename=historywrite.html \
  -f feature_description="Add a dark mode toggle button to the user dashboard" \
  -f target_sections="User Dashboard,Settings Panel"
```

Or use the GitHub UI:
1. Go to Actions tab
2. Select "Add Feature to HTML" workflow
3. Click "Run workflow"
4. Fill in:
   - **filename**: `historywrite.html`
   - **feature_description**: Plain English description of what to add
   - **target_sections**: (optional) Comma-separated section names, or leave blank for auto-select
5. Click "Run workflow"

**Output**:
- `historywrite.html.modified.html` - The updated HTML file
- Validation report showing changes
- Download from workflow artifacts

### Example Feature Request

> "Add a real-time notification system that alerts users when someone joins their team. The notification should appear as a toast popup in the top-right corner with a 5-second auto-dismiss. Make it consistent with the existing notification styling."

The system will:
1. Map the HTML structure and identify notification-related sections
2. Generate implementation code using Sonnet
3. Splice it into the appropriate locations
4. Validate the result
5. Output the modified HTML

## Architecture

### File Structure

```
.github/
├── workflows/
│   ├── map-generator.yml       # Stage 1 workflow
│   └── add-feature.yml          # Stage 2 workflow
│
scripts/
├── generate-map.js              # Stage 1: Code mapping with Haiku
├── add-feature.js               # Stage 2: Feature implementation with Sonnet
└── validate-html.js             # HTML validation utility
```

### Scripts Reference

#### `generate-map.js` - Stage 1: Code Mapping

Analyzes an HTML file and creates a structured map of code sections.

**Usage:**
```bash
node scripts/generate-map.js historywrite.html > map.json
```

**Input**: HTML file path

**Output**: JSON map with structure:
```json
{
  "filename": "historywrite.html",
  "totalLines": 5847,
  "sections": [
    {
      "name": "Story Lessons Module",
      "startLine": 1089,
      "endLine": 1201,
      "description": "Manages immersive story lessons for AP World History",
      "identifiers": ["STORY_LESSONS", "storyLesson", "renderChapter"]
    },
    ...
  ]
}
```

**Key Features**:
- Uses Haiku for fast, cost-effective analysis
- Robust JSON parsing with markdown cleanup
- Retry logic if parsing fails
- Validates map against actual HTML content
- Returns clear error messages

#### `add-feature.js` - Stage 2: Feature Implementation

Generates and applies feature modifications to HTML using Sonnet.

**Usage:**
```bash
node scripts/add-feature.js \
  historywrite.html \
  map-historywrite.html.json \
  "Add a search feature to the dashboard" \
  "Dashboard Section" "Navigation Bar"
```

**Arguments**:
- HTML file path
- Code map JSON file
- Feature description (plain English)
- Optional: target section names (space-separated)

**Output**: `historywrite.html.modified.html`

**Key Features**:
- Validates sections exist in map
- Handles Sonnet JSON response with cleanup and retry
- Two modification types: `replace` (modify section) and `insert` (add code)
- Validates splicing doesn't go out of bounds
- Returns modification summary

#### `validate-html.js` - HTML Validation

Comprehensive HTML validation to ensure integrity after modifications.

**Usage:**
```bash
node scripts/validate-html.js historywrite.html.modified.html
```

**Checks**:
- ✓ Critical HTML tags present and matched
- ✓ Script/Style blocks have balanced brackets
- ✓ Proper tag nesting (no orphaned closing tags)
- ✓ File size and line count sanity checks
- ✓ No indicators of file corruption

## Error Handling & Recovery

### JSON Parsing Robustness

Both Stage 1 and Stage 2 handle AI responses with:

1. **Markdown Fence Cleanup**: Removes ` ```json ` and ` ``` ` markers
2. **JSON Extraction**: Finds first `{` to last `}` in response
3. **Automatic Repair**: Fixes common issues like:
   - Trailing commas before `}` or `]`
   - Escaped characters in strings
   - Malformed JSON structures
4. **Retry Logic**: If parsing fails, retries once with aggressive cleanup
5. **Clear Error Messages**: Reports what failed and what was attempted

Example error handling:
```javascript
try {
  const map = parseJSONResponse(text);
} catch (error) {
  throw new ValidationError(
    `Failed to parse JSON: ${error.message}\n` +
    `First 200 chars: ${text.substring(0, 200)}`
  );
}
```

### Splicing Edge Cases

The splicing logic handles:

- ✓ Line number validation (bounds checking)
- ✓ 1-based vs 0-based indexing conversion
- ✓ Insertion point validation
- ✓ Section replacement with proper array slicing
- ✓ Preserves line structure and indentation

Example bounds check:
```javascript
if (insertionPoint < 0 || insertionPoint > lines.length) {
  throw new ValidationError(
    `Insertion point ${insertionPoint} out of bounds [0, ${lines.length}]`
  );
}
```

### Section Name Validation

Before generating code, the system:

1. Validates requested sections exist in the map
2. Reports which sections are available
3. Falls back to all sections if none specified
4. Provides clear error message if section not found

```javascript
const invalidSections = targetSectionNames.filter(n => !validSections.includes(n));
if (invalidSections.length > 0) {
  throw new ValidationError(
    `Requested sections do not exist: ${invalidSections.join(', ')}\n` +
    `Available: ${validSections.join(', ')}`
  );
}
```

## Workflow Features

### Map Generator Workflow (`map-generator.yml`)

**When to use**:
- First time using the system
- After major HTML refactoring
- To review available sections before requesting features

**Provides**:
- ✓ Code map as JSON artifact
- ✓ Markdown summary with all sections
- ✓ Validation results
- ✓ Statistics (total lines, section count)

**Timeout**: 10 minutes

### Feature Addition Workflow (`add-feature.yml`)

**When to use**:
- Adding features to your HTML file
- Making targeted modifications

**Features**:
- ✓ Auto-generates map if needed
- ✓ Caches map for 1 hour (configurable)
- ✓ Generates implementation with Sonnet
- ✓ Validates modified HTML
- ✓ Provides comparison statistics
- ✓ Does NOT auto-commit (you review first)

**Permissions**:
- `contents: read` - Read HTML files
- `actions: read` - Read workflow status
- `pull-requests: write` - Create PR comments (optional)

**Timeout**: 15 minutes

## Best Practices

### 1. Start with a Good Code Map

Always review the generated map before requesting features:
```bash
# Generate and review
gh workflow run map-generator.yml -f filename=historywrite.html

# Download artifacts and review map-historywrite.html.json
```

### 2. Write Clear Feature Descriptions

Good descriptions:
- ✓ "Add a real-time chat feature with message notifications"
- ✓ "Implement user authentication with email verification"
- ✓ "Add a dark mode toggle in the settings panel"

Avoid:
- ✗ "Make it better"
- ✗ "Add stuff"
- ✗ "Fix bugs"

### 3. Specify Target Sections (Optional)

For more precise modifications, specify which sections to modify:
```bash
gh workflow run add-feature.yml \
  -f filename=historywrite.html \
  -f feature_description="Add export to CSV button" \
  -f target_sections="Data Table Section,Export Utilities"
```

If not specified, Sonnet auto-selects relevant sections.

### 4. Review Before Committing

The workflow doesn't auto-commit changes. This is intentional!

1. Download the modified file from artifacts
2. Review changes locally
3. Test the feature
4. Commit when satisfied:
   ```bash
   # After testing
   cp historywrite.html.modified.html historywrite.html
   git add historywrite.html
   git commit -m "Add feature: [description]"
   git push
   ```

### 5. Use Version Control

Always have clean git state before running workflows:
```bash
git status  # Should be clean
git pull    # Should be up to date
```

This way you can easily compare changes:
```bash
diff historywrite.html historywrite.html.modified.html
```

## Troubleshooting

### "API error: authentication_error: invalid x-api-key"

**Problem**: `ANTHROPIC_API_KEY` secret not set or incorrect

**Solution**:
1. Go to repository Settings → Secrets and variables → Actions
2. Set `ANTHROPIC_API_KEY` with your actual API key
3. Ensure key has proper permissions in Anthropic console

### "File not found: historywrite.html"

**Problem**: Workflow looking for wrong filename

**Solution**:
- Check the filename parameter matches your actual file
- File must be in repository root
- Filename must include `.html` extension

### "Requested sections do not exist"

**Problem**: Section names don't match map

**Solution**:
1. Generate fresh map to see available sections
2. Copy section names exactly from map
3. Remember section names are case-sensitive

### "HTML validation failed"

**Problem**: Modified HTML has syntax errors

**Solution**:
1. Review the modified HTML in artifacts
2. Check modification output in logs
3. If still failing, try:
   - Simpler feature request
   - Specify different target sections
   - Manual review of the generated code

### "JSON parse failed: No valid JSON found"

**Problem**: AI response wasn't valid JSON

**Solution**:
- This triggers automatic retry with aggressive cleanup
- If it persists, check API rate limits
- Try simpler feature description

## API Usage & Costs

### Haiku (Stage 1)
- Model: `claude-haiku-4-5-20251001`
- Cost: ~$0.0008 per map generation
- Speed: ~2-3 seconds
- Typical for: mapping 5000-line files

### Sonnet (Stage 2)
- Model: `claude-sonnet-4-5-20250929`
- Cost: ~$0.01-0.05 per feature (depends on code size)
- Speed: ~5-10 seconds
- Typical for: generating 50-200 lines of code

### Caching

The feature workflow caches maps for 1 hour:
- Generate map at 9:00 AM
- Add 5 features between 9:00-10:00 AM
- Only charged for map once
- Saves ~$0.0004 per feature after first

## Limitations & Known Issues

1. **Large Files**: Haiku may miss sections in very large files (10KB+)
   - Solution: Break into smaller HTML files

2. **Complex Modifications**: Sonnet may struggle with very complex features
   - Solution: Break into smaller, incremental changes

3. **No Git Integration**: Workflow doesn't auto-commit
   - Intentional: Preserves review control
   - Solution: Commit manually after testing

4. **HTML-Only**: System works with single HTML files
   - Future: Could extend to CSS/JS files

5. **Line-Based Splicing**: May not handle minified HTML
   - Solution: Use formatted HTML files

## Advanced Usage

### Custom Section Selection

Request features for specific sections:
```bash
gh workflow run add-feature.yml \
  -f filename=historywrite.html \
  -f feature_description="Optimize quiz performance" \
  -f target_sections="Quiz Game Module,Data Persistence Layer"
```

### Multiple HTML Files

Create a map for each HTML file:
```bash
gh workflow run map-generator.yml -f filename=file1.html
gh workflow run map-generator.yml -f filename=file2.html

gh workflow run add-feature.yml -f filename=file1.html \
  -f feature_description="Add feature A"
```

### GitHub CLI Integration

Use `gh` for complete automation:
```bash
#!/bin/bash

# Generate map
MAP_RUN=$(gh workflow run map-generator.yml \
  -f filename=historywrite.html --json status | jq -r '.id')

# Wait for map
sleep 30  # Map usually completes in 5-10s

# Add feature
gh workflow run add-feature.yml \
  -f filename=historywrite.html \
  -f feature_description="$1" \
  -f target_sections="$2"
```

## Contributing

To improve the system:

1. Improve JSON parsing: Edit `parseJSONResponse()` in scripts
2. Add validation: Expand `validateHTML()` checks
3. Enhance error messages: Make them more helpful
4. Add new features: Extend workflows with new steps

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review workflow logs in GitHub Actions
3. Validate HTML file manually with `validate-html.js`
4. Test scripts locally before using in workflows

---

**Version**: 1.0
**Last Updated**: 2026-02-18
**Tested With**: Node.js 20+, Ubuntu Latest, Claude API 2023-06-01
