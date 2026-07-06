import sys
import json
import urllib.request
import time
import re
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

def make_session(uid):
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/{uid}/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

def test_query(uid, sid, text):
    body = json.dumps({
        'appName': 'app',
        'userId': uid,
        'sessionId': sid,
        'newMessage': {'role': 'user', 'parts': [{'text': text}]},
        'streaming': True,
    }).encode()
    req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                                  headers={'Content-Type': 'application/json'})
    
    start_time = time.time()
    visible_text = []
    errors = []
    
    # We simulate the exact frontend filter logic (including krishimitra_workflow)
    VISIBLE = {'krishimitra_workflow', 'executive_orchestrator', 'app'}
    
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            for raw in r:
                line = raw.decode('utf-8', 'ignore').strip()
                if not line.startswith('data: '):
                    continue
                try:
                    ev = json.loads(line[6:])
                    author = ev.get('author', '')
                    if ev.get('error'):
                        errors.append(str(ev['error']))
                        continue
                    content = ev.get('content') or {}
                    parts = content.get('parts', [])
                    for p in parts:
                        t = p.get('text', '')
                        if not t.strip():
                            continue
                        if author and author not in VISIBLE:
                            continue
                        # If it is a state event, just print it in diagnostic
                        m = re.match(r'^\[STATE:\s*([^\]]+)\]', t)
                        if m:
                            print(f'    [STATE] {m.group(1).strip()}')
                        else:
                            visible_text.append(t)
                except Exception as e:
                    pass
        elapsed = time.time() - start_time
        full_response = ''.join(visible_text)
        if full_response.strip():
            return "PASS", elapsed, full_response, errors
        else:
            return "FAIL (Empty response)", elapsed, "", errors
    except Exception as e:
        elapsed = time.time() - start_time
        return f"FAIL (Exception: {str(e)})", elapsed, "", errors

uid = 'fresh_key_user'
sid = make_session(uid)
print(f"Created session: {sid}")

for q in ["hello", "hi", "I am farming tomato"]:
    print(f"\nTesting prompt: '{q}'...")
    status, duration, response, errors = test_query(uid, sid, q)
    print(f"  Status:        {status}")
    print(f"  Response Time: {duration:.2f} seconds")
    if errors:
        print(f"  Stream Errors: {errors}")
    if response:
        print(f"  Response Preview: {repr(response[:150])}...")
