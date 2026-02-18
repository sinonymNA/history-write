import anthropic
import json
import os

repo_root = os.environ.get("GITHUB_WORKSPACE", os.getcwd())
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
feature_request = os.environ["FEATURE_REQUEST"]
target_file = os.environ["TARGET_FILE"]

map_filename = os.path.join(repo_root, f"codebase_map_{target_file.replace('.html', '')}.json")
filepath = os.path.join(repo_root, target_file)

print(f"Loading map from {map_filename}")
print(f"Loading file from {filepath}")

with open(map_filename, "r") as f:
    codebase_map = json.load(f)

with open(filepath, "r") as f:
    lines = f.readlines()

# Stage 1: Haiku identifies relevant line ranges
print("Stage 1: Scout identifying relevant sections...")
scout_response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=500,
    messages=[{
        "role": "user",
        "content": f"""Given this feature request and codebase map, return ONLY a JSON array of section names that need to be modified or referenced.

Feature request: {feature_request}

Codebase map: {json.dumps(codebase_map, indent=2)}

Return format: ["section_name_1", "section_name_2"]"""
    }]
)

relevant_sections = json.loads(scout_response.content[0].text)
print(f"Relevant sections: {relevant_sections}")

# Extract only the relevant lines
excerpts = {}
for section in relevant_sections:
    if section in codebase_map:
        start = codebase_map[section]["start"] - 1
        end = codebase_map[section]["end"]
        excerpts[section] = {
            "lines": "".join(lines[start:end]),
            "start": start + 1,
            "end": end
        }

# Stage 2: Sonnet implements the feature
print("Stage 2: Implementing feature...")
excerpt_text = "\n\n".join([
    f"### {name} (lines {data['start']}-{data['end']}):\n{data['lines']}"
    for name, data in excerpts.items()
])

implement_response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4000,
    messages=[{
        "role": "user",
        "content": f"""Implement this feature by modifying the relevant code sections below.

Feature request: {feature_request}

Return ONLY a JSON object with this format:
{{"section_name": {{"start": <line_number>, "end": <line_number>, "new_content": "<full replacement code>"}}}}

Sections to work with:
{excerpt_text}"""
    }]
)

changes = json.loads(implement_response.content[0].text)
print(f"Changes received for sections: {list(changes.keys())}")

# Splice changes back into the file
for section_name, change in sorted(changes.items(), key=lambda x: x[1]["start"], reverse=True):
    start = change["start"] - 1
    end = change["end"]
    new_lines = change["new_content"].splitlines(keepends=True)
    lines[start:end] = new_lines

with open(filepath, "w") as f:
    f.writelines(lines)

print(f"Done! Feature implemented in {target_file}")
