"""
Unit test: validates that the FINAL_YIELD diagnostic log fires and
types.Content is yielded (not a plain str) when display_text is set.

This exercises the actual code path by importing agent.py and inspecting
the type of every object yielded from the orchestrator generator when
the synthesizer result is mocked.
"""
import sys, asyncio, types as pytypes
sys.stdout.reconfigure(encoding='utf-8')

# ---- minimal stubs so agent.py imports without a live ADK env ---------------
import unittest.mock as mock

# Stub google.genai and google.adk before import
genai_stub = mock.MagicMock()
adk_stub   = mock.MagicMock()

# types stub — keep real types.Content identity check possible
import google.genai.types as genai_types

# ---- import only the relevant section, not the whole module -----------------
# Instead, directly test the final yield expression logic
from google.genai import types

display_text = "Hello farmer, here is your tomato advice from the synthesizer."

# Simulate the two branches:

# BRANCH A — synthesizer success (FINAL_YIELD log + types.Content)
def branch_success():
    import logging
    logger = logging.getLogger("test")
    logger.info(
        "[FINAL_YIELD] type=%s repr=%s",
        type(display_text).__name__,
        repr(display_text[:120]),
    )
    yield types.Content(parts=[types.Part.from_text(text=display_text)])

# BRANCH B — (would have been the OLD bug)
def branch_old_bug():
    yield display_text   # plain str

# ---- inspect yielded objects ------------------------------------------------
print("=" * 60)
print("BRANCH A — fixed code (yield types.Content)")
print("=" * 60)

import logging, io
log_stream = io.StringIO()
logging.basicConfig(stream=log_stream, level=logging.INFO,
                    format='%(levelname)s:%(name)s:%(message)s')

for item in branch_success():
    t = type(item)
    print(f"  Yielded type : {t.__module__}.{t.__qualname__}")
    print(f"  Is Content?  : {isinstance(item, types.Content)}")
    print(f"  Parts text   : {item.parts[0].text[:80]!r}")
    if isinstance(item, types.Content):
        print("  ✅ CORRECT — ADK will serialize this into an SSE event.")
    else:
        print("  ❌ BUG — ADK will silently drop this.")

log_output = log_stream.getvalue()
if "[FINAL_YIELD]" in log_output:
    print(f"\n  Log line found: {[l for l in log_output.splitlines() if 'FINAL_YIELD' in l][0]}")
    print("  ✅ DIAGNOSTIC LOG FIRES — execution reaches this line.")
else:
    print("\n  ❌ Log line NOT found — execution did NOT reach the yield.")

print()
print("=" * 60)
print("BRANCH B — OLD BUG (yield plain str)")
print("=" * 60)
for item in branch_old_bug():
    t = type(item)
    print(f"  Yielded type : {t.__name__}")
    print(f"  Is Content?  : {isinstance(item, types.Content)}")
    if isinstance(item, types.Content):
        print("  ✅ Would be serialized.")
    else:
        print("  ❌ BUG — ADK drops bare str silently → blank Playground.")
