import urllib.request
import json
import sys

# Set standard output encoding to utf-8
sys.stdout.reconfigure(encoding='utf-8')

session_url = "http://localhost:8000/apps/app/users/default_farmer/sessions"
session_payload = {
    "state": { "preferred_language": "English", "visit_count": 1 }
}

req_session = urllib.request.Request(
    session_url,
    data=json.dumps(session_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req_session) as response:
        session_data = json.loads(response.read().decode('utf-8'))
        session_id = session_data["id"]
        print(f"Session created: {session_id}")
except Exception as e:
    print("Error creating session:", e)
    session_id = "test_session_123"

chat_url = "http://localhost:8000/run_sse"
chat_payload = {
    "appName": "app",
    "userId": "default_farmer",
    "sessionId": session_id,
    "newMessage": {
        "role": "user",
        "parts": [
            {
                "text": "Hello"
            }
        ]
    },
    "streaming": True
}

req_chat = urllib.request.Request(
    chat_url, 
    data=json.dumps(chat_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    print("Streaming greeting events:")
    with urllib.request.urlopen(req_chat) as response:
        for line in response:
            line_str = line.decode('utf-8', errors='ignore').strip()
            if line_str.startswith("data:"):
                try:
                    event_data = json.loads(line_str[5:].strip())
                    author = event_data.get("author")
                    content = event_data.get("content")
                    output_field = event_data.get("output")
                    text_parts = []
                    if content and "parts" in content:
                        for p in content["parts"]:
                            if "text" in p:
                                text_parts.append(p["text"])
                    text_content = "".join(text_parts)
                    print(f"Author: {author} | Partial: {event_data.get('partial')} | Text Content: {repr(text_content)} | Output Field: {repr(output_field)}")
                except Exception as e:
                    print(f"Failed to parse event: {line_str} | Error: {e}")
except Exception as e:
    print("Error running chat stream:", e)
