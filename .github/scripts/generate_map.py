import anthropic
import json
import os
import glob

repo_root = os.environ.get("GITHUB_WORKSPACE", os.getcwd())
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

html_files = glob.glob(os.path.join(repo_root, "*.html"))

if not html_files:
    print("No HTML files found in repo root")
    exit(1)

for filepath in html_files:
    filename = os.path.basename(filepath)
    map_filename = os.path.join(repo_root, f"codebase_map_{filename.replace('.html', '')}.json")

    with open(filepath, "r") as f:
        content = f.read()

    print(f"Generating map for {filename}...")

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": f"""Analyze this HTML file and return ONLY a JSON object mapping component names to line ranges.
            Identify logical sections: navigation, state/data, UI components, CSS variables, event handlers, etc.
            Format: {{"section_name": {{"start": 1, "end": 50, "description": "brief note"}}}}
            
            FILE:
            {content}"""
        }]
    )

    with open(map_filename, "w") as f:
        f.write(response.content[0].text)

    print(f"Map saved to {map_filename}")
