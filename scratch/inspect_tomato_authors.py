import sys
import urllib.request
import json
import re
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

def make_session():
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/demo_test3/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

def stream_all_events(sid, text):
    body = json.dumps({
        'appName': 'app',
        'userId': 'demo_test3',
        'sessionId': sid,
        'newMessage': {'role': 'user', 'parts': [{'text': text}]},
        'streaming': True,
    }).encode()
    req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                                  headers={'Content-Type': 'application/json'})
    events = []
    with urllib.request.urlopen(req) as r:
        for raw in r:
            line = raw.decode('utf-8', 'ignore').strip()
            if not line.startswith('data: '):
                continue
            try:
                ev = json.loads(line[6:])
                author = ev.get('author', '')
                content = ev.get('content') or {}
                parts = content.get('parts', [])
                for p in parts:
                    t = p.get('text', '')
                    if t.strip():
                        events.append({'author': author, 'text': t})
            except Exception:
                pass
    return events

print('Inspecting ALL events for: "I am farming tomato"')
print('=' * 60)
sid = make_session()
print(f'Session: {sid}')
print()

events = stream_all_events(sid, 'I am farming tomato')
authors_all = {}
for ev in events:
    a = ev['author']
    if a not in authors_all:
        authors_all[a] = []
    authors_all[a].append(ev['text'])

print(f'All authors with text:')
for a, texts in authors_all.items():
    combined = ''.join(texts)
    print(f'  Author: {repr(a)}  ({len(combined)} chars)')
    print(f'    First 120: {repr(combined[:120])}')

print()
VISIBLE = {'krishimitra_workflow', 'executive_orchestrator', 'app'}
would_render = {a for a in authors_all if a in VISIBLE}
would_filter = {a for a in authors_all if a not in VISIBLE}

print(f'Authors that WOULD render in UI (in whitelist): {sorted(would_render)}')
print(f'Authors that are FILTERED OUT (not in whitelist): {sorted(would_filter)}')
