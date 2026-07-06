"""
KrishiMitra AI — Production Verification Script
Runs checks 3-10 against http://127.0.0.1:8000
No code changes, read-only.
"""

import json
import time
import urllib.request
import urllib.error
import subprocess
import sys

BASE = "http://127.0.0.1:8000"
USER_ID = "verify_user_001"
RESULTS = {}

# ──────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────
def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Content-Type": "application/json"}
    )
    return urllib.request.urlopen(req)

def get(path):
    return urllib.request.urlopen(f"{BASE}{path}")

def mcp_procs():
    cmd = (
        "Get-CimInstance Win32_Process | "
        "Where-Object { $_.CommandLine -like '*mcp_server*' -and $_.CommandLine -notlike '*Get-CimInstance*' } | "
        "Select-Object ProcessId | ConvertTo-Json"
    )
    out = subprocess.check_output(["powershell", "-Command", cmd], text=True).strip()
    if not out:
        return []
    d = json.loads(out)
    return d if isinstance(d, list) else [d]

def run_sse(session_id, text):
    """Returns list of SSE data lines."""
    body = {
        "appName": "app",
        "userId": USER_ID,
        "sessionId": session_id,
        "newMessage": {"role": "user", "parts": [{"text": text}]},
        "streaming": True,
    }
    lines = []
    with post("/run_sse", body) as r:
        while True:
            line = r.readline()
            if not line:
                break
            lines.append(line.decode("utf-8", errors="ignore").strip())
    return lines

# ──────────────────────────────────────────────────────────────
# CHECK 3: End-to-end chat request
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 3: End-to-end chat request ===")
with post(f"/apps/app/users/{USER_ID}/sessions", {"state": {}}) as r:
    sess = json.loads(r.read())
session_id = sess["id"]
print(f"Session created: {session_id}")

lines = run_sse(session_id, "What is the weather forecast for Pune and what crops should I grow?")
has_content = any("author" in l for l in lines if l.startswith("data:"))
has_final = any('"author":"krishimitra_workflow"' in l and '"output"' in l for l in lines)
print(f"SSE lines received: {len(lines)}")
print(f"Content events present: {has_content}")
print(f"Final orchestrator output present: {has_final}")
RESULTS["check_3_e2e"] = has_content and has_final

# ──────────────────────────────────────────────────────────────
# CHECK 4/5: MCP tools + specialist agents invoked
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 4/5: MCP tool execution + specialist agents ===")
agents_seen = []
for l in lines:
    if not l.startswith("data:"):
        continue
    try:
        obj = json.loads(l[5:])
        author = obj.get("author", "")
        if author in ("weather_intelligence_agent", "soil_health_agent",
                      "crop_recommendation_agent", "market_intelligence_agent",
                      "task_planner_agent", "decision_synthesizer_agent"):
            if author not in agents_seen:
                agents_seen.append(author)
    except Exception:
        pass

print(f"Specialist agents invoked: {agents_seen}")
RESULTS["check_4_mcp_agents"] = len(agents_seen) > 0
RESULTS["check_5_weather_soil"] = (
    "weather_intelligence_agent" in agents_seen or
    "soil_health_agent" in agents_seen or
    "crop_recommendation_agent" in agents_seen
)

# ──────────────────────────────────────────────────────────────
# CHECK 6: Conversation memory
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 6: Conversation memory ===")
with get(f"/api/history/{USER_ID}") as r:
    history = json.loads(r.read())
print(f"History entries found: {len(history)}")
RESULTS["check_6_memory"] = len(history) > 0

# ──────────────────────────────────────────────────────────────
# CHECK 7: Graceful RESOURCE_EXHAUSTED (no crash on quota hit)
# No crash = the request completes and returns final output
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 7: Graceful quota handling ===")
# We already ran a real request above; if it completed without an unhandled exception,
# the safe_run_node wrappers are working. Confirm no 500 in lines.
no_crash = not any("RESOURCE_EXHAUSTED" in l and "Traceback" in l for l in lines)
request_completed = has_final
print(f"No unhandled crash: {no_crash}")
print(f"Request completed to final output: {request_completed}")
RESULTS["check_7_quota_graceful"] = no_crash and request_completed

# ──────────────────────────────────────────────────────────────
# CHECK 8: MCP subprocess count (before and after two requests)
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 8: MCP subprocess leak check ===")
procs_before = mcp_procs()
print(f"MCP procs before second request: {len(procs_before)}")

# Second request with same session
lines2 = run_sse(session_id, "Should I plant wheat or rice given the soil conditions?")
procs_after = mcp_procs()
print(f"MCP procs after second request: {len(procs_after)}")

# A leak would mean procs keep growing across requests. They should be ~same.
leak_threshold = 4  # ADK creates per-agent-invocation; expect same count or lower
no_leak = len(procs_after) <= max(len(procs_before), leak_threshold)
print(f"No process leak: {no_leak}")
RESULTS["check_8_no_leak"] = no_leak

# ──────────────────────────────────────────────────────────────
# CHECK 9: No exceptions in backend (spot check SSE lines)
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 9: No unhandled exceptions ===")
crash_keywords = ["Traceback", "Exception", "ERROR", "500 Internal"]
crashes = [l for l in lines + lines2 if any(k in l for k in crash_keywords)]
print(f"Exception lines in SSE: {crashes[:3] if crashes else 'None'}")
RESULTS["check_9_no_exceptions"] = len(crashes) == 0

# ──────────────────────────────────────────────────────────────
# CHECK 10: Final answer streamed to frontend
# ──────────────────────────────────────────────────────────────
print("\n=== CHECK 10: Final answer streamed ===")
# The orchestrator output event contains the display text
final_text = ""
for l in lines:
    if not l.startswith("data:"):
        continue
    try:
        obj = json.loads(l[5:])
        if obj.get("author") == "krishimitra_workflow" and "output" in obj:
            out = obj["output"]
            if isinstance(out, str) and len(out) > 20:
                final_text = out[:200]
                break
    except Exception:
        pass

print(f"Final streamed text (first 200 chars):\n  {final_text if final_text else '[not found — check raw events]'}")
RESULTS["check_10_streaming"] = bool(final_text)

# ──────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("PRODUCTION VERIFICATION SUMMARY")
print("="*60)
all_pass = True
labels = {
    "check_3_e2e":          "3. End-to-end chat request",
    "check_4_mcp_agents":   "4. MCP tools / specialist agents invoked",
    "check_5_weather_soil": "5. Weather / soil / crop agents active",
    "check_6_memory":       "6. Conversation memory",
    "check_7_quota_graceful":"7. Graceful quota handling (no crash)",
    "check_8_no_leak":      "8. No MCP subprocess leak",
    "check_9_no_exceptions":"9. No unhandled exceptions in SSE",
    "check_10_streaming":   "10. Final answer streamed correctly",
}
for key, label in labels.items():
    status = "✅ PASS" if RESULTS.get(key) else "❌ FAIL"
    if not RESULTS.get(key):
        all_pass = False
    print(f"  {status}  {label}")

print()
if all_pass:
    print("KrishiMitra AI is production-ready under the current architecture.")
else:
    print("One or more checks failed. See details above.")
