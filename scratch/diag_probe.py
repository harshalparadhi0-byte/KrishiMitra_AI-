"""
Diagnostic probe: sends a single agricultural query to force the synthesizer
success path, then prints every SSE content event with its author so we can
confirm exactly one assistant message arrives and FINAL_YIELD was logged.
"""
import sys, json, urllib.request, time
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://127.0.0.1:8000'

def make_session(uid):
    req = urllib.request.Request(
        f'{BASE}/apps/app/users/{uid}/sessions',
        data=json.dumps({'state': {}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['id']

uid = 'diag_user'
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

content_events = []
error_events = []
start = time.time()

try:
    with urllib.request.urlopen(req, timeout=120) as r:
        for raw in r:
            line = raw.decode('utf-8', 'ignore').strip()
            if not line.startswith('data: '):
                continue
            try:
                ev = json.loads(line[6:])
                author = ev.get('author', '')
                if ev.get('errorCode'):
                    error_events.append((author, ev.get('errorCode'), ev.get('nodeInfo', {}).get('path', '')))
                    print(f"  [SSE-ERROR] author={author} code={ev['errorCode']} node={ev.get('nodeInfo',{}).get('path','')}")
                elif ev.get('content'):
                    parts = ev['content'].get('parts', [])
                    for p in parts:
                        t = p.get('text', '')
                        content_events.append((author, t))
                        print(f"  [SSE-CONTENT] author={author!r} text={repr(t[:80])}")
            except Exception as parse_exc:
                print(f"  [PARSE ERROR] {parse_exc}: {line[:100]}")
except Exception as e:
    print(f"[STREAM ERROR] {e}")

elapsed = time.time() - start
print(f"\n=== SUMMARY ===")
print(f"Time: {elapsed:.2f}s")
print(f"SSE content events: {len(content_events)}")
print(f"SSE error events:   {len(error_events)}")

# Identify the final assistant response (non-[STATE:] content from workflow)
final_msgs = [(a, t) for (a, t) in content_events
              if a == 'krishimitra_workflow' and not t.startswith('[STATE:')]
print(f"\nFinal assistant messages visible to client ({len(final_msgs)}):")
for i, (a, t) in enumerate(final_msgs, 1):
    print(f"  [{i}] author={a!r} text={repr(t[:200])}")

if len(final_msgs) == 1:
    print("\n✅ PASS: Exactly ONE assistant message delivered.")
elif len(final_msgs) == 0:
    print("\n❌ FAIL: ZERO assistant messages — yield silently dropped!")
else:
    print(f"\n⚠️  WARN: {len(final_msgs)} assistant messages — possible duplicate.")
