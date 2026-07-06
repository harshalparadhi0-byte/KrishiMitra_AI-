"""
Minimal end-to-end probe. Creates a session, sends each prompt, 
prints EVERY event that arrives, and shows final rendered text.
"""
import sys, json, urllib.request, re
sys.stdout.reconfigure(encoding='utf-8')
BASE = 'http://127.0.0.1:8000'

def make_session(uid):
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/{uid}/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

VISIBLE = {'krishimitra_workflow', 'executive_orchestrator', 'app'}

def send(uid, sid, text):
    body = json.dumps({
        'appName': 'app', 'userId': uid, 'sessionId': sid,
        'newMessage': {'role': 'user', 'parts': [{'text': text}]},
        'streaming': True,
    }).encode()
    req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                                  headers={'Content-Type': 'application/json'})
    visible_text = []
    all_authors = set()
    errors = []
    with urllib.request.urlopen(req, timeout=120) as r:
        for raw in r:
            line = raw.decode('utf-8', 'ignore').strip()
            if not line.startswith('data: '): continue
            try:
                ev = json.loads(line[6:])
                author = ev.get('author', '')
                all_authors.add(author)
                if ev.get('error'):
                    errors.append(str(ev['error'])[:200])
                    continue
                content = ev.get('content') or {}
                parts = content.get('parts', [])
                for p in parts:
                    t = p.get('text', '')
                    if not t.strip(): continue
                    # Simulate frontend filter
                    if author and author not in VISIBLE: continue
                    m = re.match(r'^\[STATE:\s*([^\]]+)\]', t)
                    if m:
                        print(f'  [STATE: {m.group(1).strip()}]')
                    else:
                        visible_text.append(t)
            except: pass
    return all_authors, visible_text, errors

uid = 'playground_test'
sid = make_session(uid)
print(f'Session: {sid}\n')

for prompt in ['Hello', 'Hi', 'I am farming tomato']:
    print(f'{"="*55}')
    print(f'PROMPT: {repr(prompt)}')
    try:
        authors, texts, errors = send(uid, sid, prompt)
        print(f'All authors in stream: {authors}')
        if errors:
            print(f'Errors in stream: {errors}')
        full = ''.join(texts)
        if full.strip():
            print(f'RESULT: PASS')
            print(f'Response ({len(full)} chars): {repr(full[:200])}')
        else:
            print(f'RESULT: FAIL — no visible text')
    except Exception as e:
        print(f'EXCEPTION: {e}')
    print()
