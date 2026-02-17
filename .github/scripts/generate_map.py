import os
import glob

# Add this near the top, before the glob line
repo_root = os.environ.get("GITHUB_WORKSPACE", os.getcwd())

html_files = glob.glob(os.path.join(repo_root, "*.html"))

for filepath in html_files:
    filename = os.path.basename(filepath)
    map_filename = os.path.join(repo_root, f"codebase_map_{filename.replace('.html', '')}.json")
    
    with open(filepath, "r") as f:  # filepath is already absolute now
        content = f.read()

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

map_data = response.content[0].text
with open("codebase_map.json", "w") as f:
    f.write(map_data)

print("Map generated successfully")
