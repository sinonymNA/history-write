import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

with open("index.html", "r") as f:
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
