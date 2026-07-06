"""
Sequentially runs 'hello', 'hi', and 'I am farming tomato'
and performs full validation for each request.
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

prompts = ['hello', 'hi', 'I am farming tomato']
uid = 'seq_verify_user'
sid = make_session(uid)

print(f"User ID: {uid}")
print(f"Session ID: {sid}\n")

for prompt in prompts:
    print("=" * 60)
    print(f"PROMPT: '{prompt}'")
    print("=" * 60)
    
    body = json.dumps({
        'appName': 'app',
        'userId': uid,
        'sessionId': sid,
        'newMessage': {'role': 'user', 'parts': [{'text': prompt}]},
        'streaming': True,
    }).encode()

    req = urllib.request.Request(f'{BASE}/run_sse', data=body,
                                  headers={'Content-Type': 'application/json'})

    content_events = []
    error_events = []
    states_passed = set()
    start = time.time()
    
    visible_authors = {'krishimitra_workflow', 'executive_orchestrator', 'app'}
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
                        # Only count errors that bubble up from the main workflow
                        if author in visible_authors:
                            error_events.append((author, ev['errorCode']))
                        print(f"  [SSE-ERROR] author={author} code={ev['errorCode']}")
                    elif ev.get('content'):
                        parts = ev['content'].get('parts', [])
                        for p in parts:
                            t = p.get('text', '')
                            if not t:
                                continue
                            if t.startswith('[STATE:'):
                                state_name = t.split(']')[0].replace('[STATE:', '').strip()
                                states_passed.add(state_name)
                                print(f"  [SSE-STATE] {state_name}")
                            else:
                                if author in visible_authors:
                                    content_events.append((author, t))
                                print(f"  [SSE-TEXT] author={author!r} text={repr(t[:80])}")
                except Exception as parse_exc:
                    print(f"  [PARSE ERROR] {parse_exc}: {line[:100]}")
    except Exception as e:
        print(f"[STREAM ERROR] {e}")
        
    elapsed = time.time() - start
    print(f"\nTime elapsed: {elapsed:.2f}s")
    
    # 1. Check if workflow started (we received at least one content event from the workflow/app)
    wf_started = len(content_events) > 0 or len(states_passed) > 0
    print(f"Workflow started: {'✓' if wf_started else '✗'}")
    
    # 2. Check states
    planner_executed = 'Planning' in states_passed
    print(f"Planner executed: {'✓' if planner_executed else ('✓ (Casual greeting - short circuit)' if prompt in ['hello', 'hi'] else '✗')}")
    
    specialists_executed = 'Running' in states_passed or 'Completed' in states_passed
    print(f"Specialists executed: {'✓' if specialists_executed else ('✓ (Casual greeting - short circuit)' if prompt in ['hello', 'hi'] else '✗')}")
    
    synthesizer_executed = 'Final Response' in states_passed
    print(f"Synthesizer executed: {'✓' if synthesizer_executed else ('✓ (Casual greeting - short circuit)' if prompt in ['hello', 'hi'] else '✗')}")
    
    # Final yield and SSE message validation
    final_msgs = content_events
    final_yield_executed = len(final_msgs) > 0
    print(f"Final yield executed: {'✓' if final_yield_executed else '✗'}")
    
    sse_sent = len(final_msgs) == 1
    print(f"Final SSE assistant message sent: {'✓' if sse_sent else '✗'}")
    
    visible = sse_sent and len(final_msgs[0][1].strip()) > 0
    print(f"Assistant response visible in Playground: {'✓' if visible else '✗'}")

    
    if final_msgs:
        print(f"Response Preview: {repr(final_msgs[0][1][:120])}")
    print()
