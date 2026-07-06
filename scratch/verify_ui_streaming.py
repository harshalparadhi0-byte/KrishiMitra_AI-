import sys
import urllib.request
import json
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

def make_session():
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/demo_test/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

def stream_query(sid, text):
    body = json.dumps({
        'appName': 'app',
        'userId': 'demo_test',
        'sessionId': sid,
        'newMessage': {'role': 'user', 'parts': [{'text': text}]},
        'streaming': True,
    }).encode()
    req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                                  headers={'Content-Type': 'application/json'})
    authors_with_text = []
    state_events = []
    all_text = []
    
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
                    if not t:
                        continue
                    # Simulate frontend author filter
                    VISIBLE = {'krishimitra_workflow', 'executive_orchestrator', 'app'}
                    if author and author not in VISIBLE:
                        continue  # filtered out - would not appear in UI
                    # Check for STATE marker
                    import re
                    m = re.match(r'^\[STATE:\s*([^\]]+)\]', t)
                    if m:
                        state_events.append(m.group(1).strip())
                    elif t.strip():
                        authors_with_text.append(author)
                        all_text.append(t)
            except Exception:
                pass
    return {
        'states': state_events,
        'authors': list(set(authors_with_text)),
        'text': ''.join(all_text),
    }

print('=' * 60)
sid = make_session()
print(f'Session: {sid}')
print()

prompts = ['Hello', 'Hi', 'I am farming tomato']
for prompt in prompts:
    print(f'PROMPT: {repr(prompt)}')
    try:
        result = stream_query(sid, prompt)
        print(f'  States seen in UI:  {result["states"]}')
        print(f'  Authors rendering:  {result["authors"]}')
        txt = result['text']
        if txt:
            print(f'  Text in UI (first 150 chars): {repr(txt[:150])}')
            print(f'  RESULT: PASS - text appears in UI')
        else:
            print(f'  RESULT: FAIL - no text would appear in UI')
    except Exception as e:
        print(f'  ERROR: {e}')
    print()

print('=' * 60)
print('Verification complete.')
