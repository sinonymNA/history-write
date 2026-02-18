# Quick Start Guide - AI Feature Addition System

**Get started in 2 minutes** ⚡

## 1. One-Time Setup (1 minute)

### Set Your API Key

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. New repository secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (from https://console.anthropic.com)

✅ Done! Now you can use the workflows.

## 2. Add a Feature (1 minute)

### Using GitHub Web UI

1. Go to **Actions** tab
2. Click **"Add Feature to HTML"**
3. Click **"Run workflow"**
4. Fill in:
   - **filename**: `historywrite.html` (or your file)
   - **feature_description**: Describe what you want in plain English
     - Example: *"Add a save button to automatically backup the document"*
   - **target_sections**: Leave blank (optional - for advanced users)
5. Click **"Run workflow"** button

### Wait for Results

- ⏳ Takes ~30 seconds - 1 minute
- ✓ Green checkmark = Success
- ✗ Red X = Check error logs

### Download Modified File

1. Workflow finishes → click workflow name
2. Scroll to "Artifacts"
3. Download `modified-html` folder
4. Extract `historywrite.html.modified.html`

### Test & Deploy

```bash
# Test the modified file locally first
# Then if happy:
cp historywrite.html.modified.html historywrite.html
git add historywrite.html
git commit -m "Add feature: your feature description"
git push
```

---

## Examples

### Example 1: Add Dark Mode
```
filename: historywrite.html
feature: "Add a dark mode toggle button in the top-right corner that switches between light and dark themes. Save preference to localStorage."
target_sections: (leave blank)
```

### Example 2: Add Search Feature
```
filename: historywrite.html
feature: "Add a search bar that filters the main content. Show results as you type."
target_sections: Dashboard Section, Navigation Bar
```

### Example 3: Add Export Button
```
filename: historywrite.html
feature: "Add an Export to PDF button that generates a PDF of the current content."
target_sections: (leave blank)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API error: invalid x-api-key" | Check your `ANTHROPIC_API_KEY` secret in Settings |
| "File not found: historywrite.html" | Make sure filename is correct and file exists in repo root |
| Workflow fails on "Feature generation" | Try a simpler feature description or check API rate limits |
| "HTML validation failed" | The AI generated invalid code - try a different feature request |

---

## What If I Need More Control?

Use the **Command Line** instead:

```bash
# Generate map (optional - to see available sections)
node scripts/generate-map.js historywrite.html > map.json

# Add feature
node scripts/add-feature.js \
  historywrite.html \
  map.json \
  "Your feature description"

# Validate result
node scripts/validate-html.js historywrite.html.modified.html
```

---

## Full Documentation

See **AI_FEATURE_SYSTEM.md** for:
- Detailed architecture
- Error handling details
- API costs
- Advanced usage
- Troubleshooting

---

## Support

- 📖 Read the full docs: `AI_FEATURE_SYSTEM.md`
- 🔍 Check GitHub Actions logs for details
- ⚙️ Scripts available in `scripts/` folder
