import urllib.request
import json

# 1. Create a session
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

# 2. Call /run_sse
chat_url = "http://localhost:8000/run_sse"
chat_payload = {
    "appName": "app",
    "userId": "default_farmer",
    "sessionId": session_id,
    "newMessage": {
        "role": "user",
        "parts": [
            {
                "text": "Hello, tell me about the weather and my soil health."
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
    print("Streaming events:")
    with urllib.request.urlopen(req_chat) as response:
        for line in response:
            line_str = line.decode('utf-8', errors='ignore').strip()
            if line_str.startswith("data:"):
                try:
                    event_data = json.loads(line_str[5:].strip())
                    author = event_data.get("author")
                    content = event_data.get("content")
                    text_parts = []
                    if content and "parts" in content:
                        for p in content["parts"]:
                            if "text" in p:
                                text_parts.append(p["text"])
                    text_content = "".join(text_parts)
                    print(f"Author: {author} | Partial: {event_data.get('partial')} | Text: {repr(text_content)}")
                except Exception as e:
                    print(f"Failed to parse event: {line_str} | Error: {e}")
except Exception as e:
    print("Error running chat stream:", e)
