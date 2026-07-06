import sys
import json
import urllib.request
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

def make_session(uid):
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/{uid}/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

uid = 'dump_user'
sid = make_session(uid)
print(f"Session: {sid}")

body = json.dumps({
    'appName': 'app',
    'userId': uid,
    'sessionId': sid,
    'newMessage': {'role': 'user', 'parts': [{'text': 'I am farming tomato'}]},
    'streaming': True,
}).encode()

req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                              headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, timeout=120) as r:
        for raw in r:
            line = raw.decode('utf-8', 'ignore').strip()
            if line:
                print(line)
except Exception as e:
    print(f"ERROR: {e}")
