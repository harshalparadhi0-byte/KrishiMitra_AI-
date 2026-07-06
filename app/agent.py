# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
import re
import sys
from typing import Any, AsyncGenerator

from google.adk.agents import LlmAgent
from google.adk.apps import App
from google.adk.models import Gemini
from google.adk.workflow import Workflow, Edge, START, node
from google.genai import types
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters

from app.config import config
from app.memory import MemoryManager
from google.adk.utils.content_utils import extract_text_from_content

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("krishimitra-agent")


# ---------------------------------------------------------------------------
# Greeting fast-path — avoids a full Gemini LLM call for common salutations.
# The regex covers Hindi (namaste/namaskar) and English greetings.
# ---------------------------------------------------------------------------

_GREETING_RE = re.compile(
    r"^\s*(?:hello|hi|hey|namaste|namaskar|jai\s+hind"
    r"|good\s+(?:morning|afternoon|evening|night)"
    r"|how\s+are\s+you|who\s+are\s+you|what\s+can\s+you\s+do"
    r"|what\s+is\s+krishimitra|tell\s+me\s+about\s+yourself"
    r"|greetings?|howdy)\s*[!?.,]?\s*$",
    re.IGNORECASE,
)

_GREETING_RESPONSE = (
    "Hello! 🌾 Welcome to KrishiMitra — your personal agricultural advisor. "
    "I can help you with:\n\n"
    "• 🌱 Soil health & NPK analysis\n"
    "• ⛅ Weather-based farming decisions\n"
    "• 🔬 Crop disease diagnosis\n"
    "• 💧 Irrigation planning\n"
    "• 📊 Market prices & trends\n"
    "• 🏛️ Government schemes & subsidies\n"
    "• 🧪 Fertilizer schedules\n\n"
    "What can I help you with today?"
)



def _extract_node_text(run_node_result: Any) -> str:
    """Safely extract plain text from ctx.run_node() output.

    In ADK 2.3.0, ctx.run_node(LlmAgent, ...) returns a plain ``str``
    (the agent's final text response), not a ``types.Content`` object.
    However, the ADK contract is typed as ``Any``, so we handle both to
    be robust across SDK versions.

    Args:
        run_node_result: The raw value returned by ``await ctx.run_node()``.

    Returns:
        The extracted text, or an empty string if nothing usable is found.
    """
    if run_node_result is None:
        return ""
    if isinstance(run_node_result, str):
        return run_node_result
    # Fallback: it may be a types.Content in future ADK versions.
    try:
        return extract_text_from_content(run_node_result) or ""
    except Exception:
        return str(run_node_result)

# ---------------------------------------------------------------------------
# safe_run_node — thin wrapper around ctx.run_node() that catches Gemini
# RESOURCE_EXHAUSTED (HTTP 429) quota errors and returns None instead of
# propagating the exception.  Every call site checks for None explicitly and
# degrades gracefully with a user-visible message or a safe default value.
#
# Extended to also catch the secondary RuntimeError that emerges from the
# aiohttp + tenacity interaction after a 429:
#
#   Background
#   ----------
#   When the Gemini API returns 429, google-genai's tenacity.AsyncRetrying
#   retries _async_request_once.  Between the 429 and the retry, aiohttp's
#   ClientSession.request() calls:
#       auth = await self._loop.run_in_executor(None, self._get_netrc_auth, ...)
#   The `self._loop` reference was captured when the ClientSession was first
#   created (on the main uvicorn event loop during app start-up).  ADK runs
#   each specialist node as an independent asyncio.Task via
#   asyncio.create_task() (_workflow.py line 625).  When tenacity's sleep
#   coroutine creates a cross-task Future inside that Task context, Python's
#   asyncio _chain_future raises:
#       RuntimeError: Task … got Future … attached to a different loop
#
#   This is a secondary symptom of quota exhaustion — it can ONLY appear
#   after a 429 has already been received and tenacity has started retrying.
#
#   Catch criteria
#   --------------
#   1. The exception MUST be a RuntimeError (not ValueError, TypeError, etc.).
#   2. Its message MUST contain "attached to a different loop" — the exact,
#      stable string emitted by asyncio._chain_future (cpython/Lib/asyncio/
#      futures.py) since Python 3.10.
#
#   Why we do NOT require 429 evidence in __context__
#   --------------------------------------------------
#   The initial attempt to _async_request_once raises APIError(code=429).
#   tenacity.AsyncRetrying catches that error internally and then schedules
#   a fresh retry coroutine.  The RuntimeError is raised INSIDE the retry
#   coroutine — it is NOT raised while handling the 429, so Python never
#   sets __context__ to the original APIError.  Walking the exception chain
#   therefore finds no quota evidence even though the error is definitively
#   caused by quota exhaustion.
#
#   Safety justification for message-only matching
#   -----------------------------------------------
#   "attached to a different loop" is raised by exactly one location in the
#   CPython stdlib: asyncio._chain_future() in Lib/asyncio/futures.py.
#   In the KrishiMitra codebase this function is ONLY ever reached through:
#       aiohttp.ClientSession._request()
#         → await self._loop.run_in_executor()
#             → asyncio._chain_future()
#   which is ONLY called from within the genai/tenacity HTTP retry stack.
#   No application-level code in this project calls _chain_future directly.
#   An unrelated asyncio bug triggering this message from a different code
#   path is therefore not a concern here.
# ---------------------------------------------------------------------------

def _is_loop_error_from_quota_retry(exc: BaseException) -> bool:
    """Return True iff exc is the aiohttp cross-loop RuntimeError that can
    only surface inside the google-genai tenacity retry stack.

    See the module-level comment above for the full technical explanation.
    """
    if not isinstance(exc, RuntimeError):
        return False
    # The exact message emitted by asyncio._chain_future in CPython 3.10+.
    # This string has been stable across Python 3.10, 3.11, 3.12, and 3.13.
    return "attached to a different loop" in str(exc)


async def safe_run_node(ctx: Any, agent: Any, node_input: Any) -> Any:
    """Await ctx.run_node(agent, node_input=node_input) and catch all exceptions.

    If any specialist agent fails due to quota, timeout, API error, wrapper
    exception, retry exhaustion, DynamicNodeFailError, or aiohttp loop error,
    this helper logs a warning and returns ``None`` so the parent orchestrator
    workflow can continue execution with whatever information is available.

    Args:
        ctx:        The ADK workflow context passed into every @node function.
        agent:      The LlmAgent (or node) to invoke.
        node_input: Prompt / input forwarded to the agent.

    Returns:
        Whatever ctx.run_node() returns on success, or ``None`` on failure.
    """
    try:
        return await ctx.run_node(agent, node_input=node_input)
    except Exception as exc:
        # Extract the real inner error if wrapped in ADK's DynamicNodeFailError
        inner_exc = getattr(exc, "error", exc)
        exc_str = f"{exc} (Inner: {inner_exc})"
        
        logger.warning(
            "safe_run_node: Node '%s' failed. Returning None to continue workflow. Error: %s",
            getattr(agent, "name", repr(agent)),
            exc_str[:400],
        )
        return None


# Initialize Gemini Model
# attempts=1 means no retries on 429 — the quota error is caught immediately
# by safe_run_node which returns a graceful fallback instead of hanging.
# On a paid tier with real quota headroom, increase attempts and delays.
model = Gemini(
    model=config.model,
    retry_options=types.HttpRetryOptions(
        attempts=1,
    ),
)

# ---------------------------------------------------------------------------
# MCP connection — single shared stdio connection to app.mcp_server.
#
# Previously every agent created its own McpToolset, which caused ADK to
# spawn a separate Python subprocess for each toolset instance (9 processes
# total).  Now we share one StdioConnectionParams object.  When multiple
# McpToolset instances reference the same connection_params object, the ADK
# MCPSessionManager reuses the existing session (keyed on the params object)
# rather than launching a new subprocess.  Per-agent tool visibility is
# preserved by passing a tool_filter to each McpToolset — ADK applies
# _is_tool_selected() during get_tools() exactly as before.
# ---------------------------------------------------------------------------

_SHARED_MCP_PARAMS = StdioConnectionParams(
    server_params=StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.mcp_server"],
    ),
)


def _mcp(filters: list[str]) -> McpToolset:
    """Return a McpToolset sharing the single stdio connection, scoped to
    *filters*.  Because all instances share ``_SHARED_MCP_PARAMS``, ADK's
    MCPSessionManager produces the same session key and reuses one process."""
    return McpToolset(
        connection_params=_SHARED_MCP_PARAMS,
        tool_filter=filters,
    )


soil_mcp_toolset          = _mcp(["get_soil_data"])
weather_mcp_toolset       = _mcp(["get_weather_forecast"])
crop_mcp_toolset          = _mcp(["search_crop_database", "get_soil_data"])
market_mcp_toolset        = _mcp(["get_market_price", "search_crop_database"])
disease_mcp_toolset       = _mcp(["search_crop_database"])
irrigation_mcp_toolset    = _mcp(["get_weather_forecast", "get_soil_data"])
fertilizer_mcp_toolset    = _mcp(["get_soil_data", "search_crop_database"])
yield_mcp_toolset         = _mcp(["search_crop_database", "get_soil_data", "get_weather_forecast"])
notification_mcp_toolset  = _mcp(["get_weather_forecast", "get_soil_data"])

# ---------------------------------------------------------------------------
# Specialist Domain Agents
# All agents that will be invoked via ctx.run_node() MUST have
# rerun_on_resume=True — this is an ADK requirement for dynamically
# dispatched nodes that may be interrupted and resumed mid-workflow.
# ---------------------------------------------------------------------------

soil_health_agent = LlmAgent(
    name="soil_health_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Soil Health Agent for KrishiMitra AI. Your responsibility is to analyze soil properties "
        "(NPK ratios, pH, texture, moisture) and diagnose deficiencies, salinity, or structure issues. "
        "Recommend soil correction methods, organic amendments, or pH adjustment plans based on scientific evidence. "
        "Use get_soil_data to query the soil information for the farmer's location. "
        "Respond with a clear, structured summary of your findings."
    ),
    tools=[soil_mcp_toolset],
)

weather_intelligence_agent = LlmAgent(
    name="weather_intelligence_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Weather Intelligence Agent for KrishiMitra AI. Your responsibility is to assess meteorological "
        "conditions (rainfall, dry spells, thermal stress, frost) and identify farming risks. "
        "Suggest operational adjustments (e.g., delaying pesticide spray, preparing drainage, protecting against frost). "
        "Use get_weather_forecast to retrieve current and upcoming meteorological conditions. "
        "Respond with a clear, structured summary of weather risks and recommendations."
    ),
    tools=[weather_mcp_toolset],
)

crop_recommendation_agent = LlmAgent(
    name="crop_recommendation_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Crop Recommendation Agent for KrishiMitra AI. Your responsibility is to recommend "
        "the most suitable crops to plant based on soil properties (NPK, pH), location, and crop requirements. "
        "Provide scientific justification for the suggested crops. "
        "Use search_crop_database to check crop requirements and get_soil_data to fetch soil parameters. "
        "Respond with a ranked list of crop recommendations with rationale."
    ),
    tools=[crop_mcp_toolset],
)

disease_diagnosis_agent = LlmAgent(
    name="disease_diagnosis_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Disease Diagnosis Agent for KrishiMitra AI. Your responsibility is to analyze leaf/plant anomalies "
        "and formulate pest/disease treatment plans. Focus on diagnosing pathogens (fungal, bacterial, viral) "
        "and recommending safe organic and chemical treatment methods. "
        "Use search_crop_database to lookup common diseases and standard remedies. "
        "Respond with the diagnosis, severity, and a step-by-step treatment plan."
    ),
    tools=[disease_mcp_toolset],
)

irrigation_advisor = LlmAgent(
    name="irrigation_advisor",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Irrigation Advisor for KrishiMitra AI. Your responsibility is to generate optimal watering schedules. "
        "Recommend specific irrigation methods (drip, sprinkler, furrow) and duration based on weather conditions, soil moisture, and crop needs. "
        "Use get_weather_forecast and get_soil_data to base your recommendations on real-time data. "
        "Respond with a weekly watering schedule and method recommendations."
    ),
    tools=[irrigation_mcp_toolset],
)

fertilizer_advisor = LlmAgent(
    name="fertilizer_advisor",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Fertilizer Advisor for KrishiMitra AI. Your responsibility is to formulate nutrient scheduling. "
        "Recommend precise NPK application rates, timings, and organic manure additions depending on soil measurements and target crop parameters. "
        "Use get_soil_data and search_crop_database to calculate nutrient requirements. "
        "Respond with a detailed fertilizer schedule (which, when, how much)."
    ),
    tools=[fertilizer_mcp_toolset],
)

market_intelligence_agent = LlmAgent(
    name="market_intelligence_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Market Intelligence Agent for KrishiMitra AI. Your responsibility is to evaluate market prices, "
        "pricing trends, demand indicators, and harvest timing. Recommend the best APMC markets to sell at "
        "and suggest whether to sell immediately or store the harvest. "
        "Use get_market_price and search_crop_database to fetch price data and growth cycle info. "
        "Respond with current prices, trends, and a sell/hold recommendation."
    ),
    tools=[market_mcp_toolset],
)

government_schemes_agent = LlmAgent(
    name="government_schemes_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Government Schemes Advisor for KrishiMitra AI. Your responsibility is to match "
        "the farmer's crops, location, and soil profile to available government subsidies, credit schemes, "
        "aid programs, or crop insurance details. Provide step-by-step guidance on how they can apply. "
        "Respond with a list of applicable schemes, eligibility criteria, and application steps."
    ),
)

yield_prediction_agent = LlmAgent(
    name="yield_prediction_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Yield Prediction Agent for KrishiMitra AI. Your responsibility is to predict the expected crop yield "
        "(in quintals per acre) based on location, crop type, soil health, weather, and irrigation methods. "
        "Provide a detailed rationale for your yield estimates. "
        "Use search_crop_database, get_soil_data, and get_weather_forecast to compile parameters. "
        "Respond with a yield estimate, confidence level, and key limiting/boosting factors."
    ),
    tools=[yield_mcp_toolset],
)

proactive_notification_agent = LlmAgent(
    name="proactive_notification_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Proactive Notification Agent for KrishiMitra AI. Your responsibility is to check for critical "
        "risks and opportunities (rainfall warnings, pest risk, fertilizing/watering schedules, market price spikes) "
        "based on current data and farm memory, and generate urgent alerts. "
        "Use get_weather_forecast and get_soil_data to identify risks. "
        "Respond with a prioritized list of actionable alerts."
    ),
    tools=[notification_mcp_toolset],
)

# ---------------------------------------------------------------------------
# Task Planner Agent
# Analyzes the query and determines which specialists to invoke.
# rerun_on_resume=True required for ctx.run_node() dynamic dispatch.
# ---------------------------------------------------------------------------

planner_instruction = (
    "You are the Task Planning Agent for KrishiMitra AI. "
    "Your job is to analyze the farmer's query and farm profile, and determine the exact list of specialist agents to invoke. "
    "Do not include agents that are not relevant to the query. "
    "Available agents:\n"
    "- soil_health (soil testing, pH, NPK deficiencies)\n"
    "- weather (weather forecast, precipitation risks, temperature)\n"
    "- crop_recommendation (recommending optimal crops to plant)\n"
    "- disease_diagnosis (leaf spot, blight, pest, plant health issues)\n"
    "- irrigation_advisor (watering schedules, drip/sprinkler recommendations)\n"
    "- fertilizer_advisor (NPK adjustment, fertilizer scheduling)\n"
    "- market_price (crop prices, market trends, harvest timing)\n"
    "- gov_schemes (government subsidies, aid, insurance programs)\n"
    "- yield_prediction (predicting crop yield in quintals/acre)\n"
    "- proactive_notification (alerts for weather risks, irrigation, pests)\n\n"
    "Respond ONLY with a valid JSON array of agent names. Example: [\"weather\", \"disease_diagnosis\", \"market_price\"]"
)

task_planner_agent = LlmAgent(
    name="task_planner_agent",
    model=model,
    rerun_on_resume=True,
    instruction=planner_instruction,
)

# ---------------------------------------------------------------------------
# Decision Synthesizer
# Collects all specialist outputs, resolves conflicts, and produces an
# explainable unified report with confidence scores.
# rerun_on_resume=True required for ctx.run_node() dynamic dispatch.
# ---------------------------------------------------------------------------

decision_synthesizer_agent = LlmAgent(
    name="decision_synthesizer_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Decision Synthesizer Agent for KrishiMitra AI. "
        "Your task is to review the independent reports from all specialist agents, "
        "resolve any conflicting advice (e.g. if weather predicts heavy rain but irrigation advisor suggests heavy watering, resolve in favor of delaying watering), "
        "and merge the findings into a single unified agricultural advisory report.\n\n"
        "Your final report MUST be valid JSON following this exact schema:\n"
        "{\n"
        "  \"recommendations\": [\"list of clear actionable steps for the farmer\"],\n"
        "  \"natural_response\": \"A warm, 2-4 paragraph conversational summary written directly to the farmer. "
        "Present the most important findings and recommendations in clear, friendly language. "
        "Mention confidence naturally (e.g. I am fairly confident that...). "
        "Do not use technical jargon, JSON field names, agent names, or any mention of internal systems. "
        "Sound like a knowledgeable agricultural advisor speaking directly to the farmer.\",\n"
        "  \"explainability\": {\n"
        "    \"reasoning\": \"detailed breakdown of why these recommendations were made\",\n"
        "    \"confidence_score\": \"High (85%) / Medium (65%) / Low (40%) with explanation\",\n"
        "    \"contributing_agents\": [\"list of agent names whose findings were used\"],\n"
        "    \"supporting_evidence\": {\n"
        "      \"soil\": \"key soil facts used in the decision\",\n"
        "      \"weather\": \"key weather facts used in the decision\",\n"
        "      \"market\": \"key market facts used in the decision\"\n"
        "    }\n"
        "  }\n"
        "}\n\n"
        "IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown code fences or explanatory text outside the JSON."
    ),
)


# ---------------------------------------------------------------------------
# Conversation Intelligence Agent
# Runs as the FIRST node in the workflow to classify intent and short-circuit
# non-agricultural messages (greetings, casual chat, closings) with a direct
# LLM-generated response — without invoking any specialist agents.
# ---------------------------------------------------------------------------

conversation_intelligence_agent = LlmAgent(
    name="conversation_intelligence_agent",
    model=model,
    rerun_on_resume=True,
    instruction=(
        "You are the Conversation Intelligence Agent for KrishiMitra AI, an agricultural AI assistant for Indian farmers.\n\n"
        "Analyze the user's message, classify its intent, and decide how to respond:\n"
        "- For non-agricultural messages: generate a direct, natural, friendly response.\n"
        "- For agricultural messages: set is_agricultural=true so specialists handle them.\n\n"
        "INTENT TYPES:\n"
        "- greeting: Hello, Namaste, Good morning, Hi, Hey, etc.\n"
        "- casual_conversation: How are you?, Who are you?, What can you do?, I am confused, I don't know where to start.\n"
        "- general_knowledge: What is nitrogen?, How does irrigation work?, What causes blight? (conceptual, not farm-specific)\n"
        "- agricultural_query: Specific questions about the farmer's crops, diseases, weather, soil, markets, fertilizers, irrigation, pests, harvest timing.\n"
        "- followup_agricultural_query: Short follow-ups to a prior farming discussion (What should I spray? How much? Is it dangerous?).\n"
        "- emergency_farming: Urgent crop distress signals (my crop is dying, everything drying up, sudden collapse, heavy damage).\n"
        "- farm_profile_collection: User providing farm details (location, crop type, soil readings, NPK values).\n"
        "- feedback: User commenting on KrishiMitra's advice (thanks, that was helpful, good advice).\n"
        "- conversation_closing: Goodbye, thanks, see you, take care.\n"
        "- unsupported_request: Completely off-topic requests unrelated to farming or general knowledge.\n\n"
        "ROUTING RULES:\n"
        "- is_agricultural = true for: agricultural_query, followup_agricultural_query, emergency_farming, farm_profile_collection.\n"
        "- is_agricultural = false for: greeting, casual_conversation, general_knowledge, feedback, conversation_closing, unsupported_request.\n"
        "- For emergency_farming, ALWAYS set is_agricultural = true.\n\n"
        "RESPOND WITH VALID JSON ONLY. No markdown, no extra text outside the JSON object:\n"
        "{\n"
        "  \"intent\": \"<intent_type>\",\n"
        "  \"is_agricultural\": <true or false>,\n"
        "  \"direct_response\": \"<warm conversational response for non-agricultural, or null for agricultural>\",\n"
        "  \"original_query\": \"<the user message exactly as received>\"\n"
        "}\n\n"
        "PERSONALITY for direct_response (non-agricultural messages):\n"
        "- Warm, friendly, professional, patient with new farmers.\n"
        "- Never mention agents, workflow, nodes, or any system architecture.\n"
        "- Never expose JSON or internal data.\n"
        "- Respond as KrishiMitra (not as AI or system).\n"
        "- Use first-person (I, we). Be reassuring for worried or confused farmers.\n"
        "- Use emojis sparingly and only when they add warmth.\n\n"
        "EXAMPLES:\n"
        "User: Hello\n"
        "→ {\"intent\":\"greeting\",\"is_agricultural\":false,\"direct_response\":\"Hello! "
        "\\ud83c\\udf3e Welcome to KrishiMitra — your personal agricultural advisor. "
        "Whether you need help with crops, soil health, weather, or market prices, I am here for you. "
        "What can I help you with today?\",\"original_query\":\"Hello\"}\n\n"
        "User: My tomato leaves have yellow spots.\n"
        "→ {\"intent\":\"agricultural_query\",\"is_agricultural\":true,\"direct_response\":null,\"original_query\":\"My tomato leaves have yellow spots.\"}\n\n"
        "User: I am worried about my farm.\n"
        "→ {\"intent\":\"casual_conversation\",\"is_agricultural\":false,\"direct_response\":\"I understand your concern completely, and I am here to help. "
        "Please tell me what is worrying you — describe what you are seeing and I will do my best to guide you.\",\"original_query\":\"I am worried about my farm.\"}\n\n"
        "User: My crop is dying!\n"
        "→ {\"intent\":\"emergency_farming\",\"is_agricultural\":true,\"direct_response\":null,\"original_query\":\"My crop is dying!\"}"
    ),
)


# ---------------------------------------------------------------------------
# Security Logic — pure Python function, separate from the FunctionNode
# wrapper. This allows direct unit testing without the ADK node machinery.
# ---------------------------------------------------------------------------

async def _run_security_logic(query_text_raw: str) -> dict:
    """
    Core security logic: PII scrubbing, prompt injection detection, and audit logging.
    Returns a dict with 'query', 'status', and optionally 'reason'.
    This is a plain coroutine so it can be unit-tested without the FunctionNode wrapper.
    """
    if isinstance(query_text_raw, types.Content):
        query_text = extract_text_from_content(query_text_raw)
    else:
        query_text = str(query_text_raw)

    query_text = query_text.strip()
    if not query_text:
        return {"query": "", "status": "blocked", "reason": "Query is empty."}

    # --- PII Scrubbing ---
    # Aadhaar: 12 digits with optional spaces in groups of 4
    aadhaar_pattern = r"\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b"
    # Indian mobile numbers: 10 digits starting with 6-9, with optional +91/91 prefix
    phone_pattern = r"\b(?:\+91|91)?[6789]\d{9}\b"
    # Email addresses
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"

    sanitized = re.sub(aadhaar_pattern, "[REDACTED_AADHAAR]", query_text)
    sanitized = re.sub(phone_pattern, "[REDACTED_PHONE]", sanitized)
    sanitized = re.sub(email_pattern, "[REDACTED_EMAIL]", sanitized)

    # --- Prompt Injection Detection ---
    injection_phrases = [
        "ignore previous instructions",
        "forget your instructions",
        "system prompt",
        "you are now a",
        "override setting",
        "ignore system rules",
        "jailbreak",
        "act as if",
        "disregard all prior",
    ]
    is_injection = any(phrase in query_text.lower() for phrase in injection_phrases)

    # --- Audit Logging ---
    logger.info(
        "Security Checkpoint Audit: length=%d, PII_sanitized=%s, is_injection=%s",
        len(query_text),
        str(sanitized != query_text),
        str(is_injection),
    )

    if is_injection:
        return {
            "query": sanitized,
            "status": "blocked",
            "reason": "Potential prompt injection detected.",
        }

    return {"query": sanitized, "status": "safe"}


# ---------------------------------------------------------------------------
# Workflow Function Nodes
# The @node decorator wraps functions into FunctionNode objects.
# rerun_on_resume=True is set so the parent workflow can re-enter these
# nodes after an interrupt and collect dynamic child node responses.
# ---------------------------------------------------------------------------

@node(name="security_checkpoint", rerun_on_resume=True)
async def security_checkpoint_node(ctx: Any, node_input: Any) -> Any:
    """Security layer: PII scrubbing, prompt injection detection, and audit logging.
    Handles transparent pass-through for non-agricultural messages from the CI layer.
    """
    # If Conversation Intelligence already classified this as non-agricultural,
    # pass the CI result straight through to the orchestrator — no security scan needed.
    if isinstance(node_input, dict) and node_input.get("is_agricultural") is False:
        return node_input

    # Extract the original query string from CI output or use raw input
    if isinstance(node_input, dict):
        query_to_check = node_input.get("original_query") or node_input.get("query", "")
        ci_intent = node_input.get("intent", "agricultural_query")
    else:
        query_to_check = node_input
        ci_intent = "agricultural_query"

    security_result = await _run_security_logic(query_to_check)

    # Carry the intent label forward for logging / future routing
    if isinstance(security_result, dict):
        security_result["intent"] = ci_intent

    return security_result


@node(name="conversation_intelligence", rerun_on_resume=True)
async def conversation_intelligence_node(ctx: Any, node_input: Any) -> Any:
    """LLM-powered intent classification. Handles greetings / casual messages
    with a direct response and routes agricultural queries to the specialist pipeline.
    """
    # Extract the raw user query text from whatever ADK passes in
    if isinstance(node_input, types.Content):
        query_text = extract_text_from_content(node_input)
    else:
        query_text = str(node_input).strip()

    if not query_text:
        return {
            "intent": "unsupported_request",
            "is_agricultural": False,
            "direct_response": "I didn't quite catch that. Could you tell me what you need help with?",
            "original_query": "",
        }

    # ── Greeting fast-path ────────────────────────────────────────────────────
    # For common salutations (hello, namaste, hi, etc.) return a fixed response
    # immediately without spending a Gemini API call on intent classification.
    if _GREETING_RE.match(query_text):
        logger.info("CI fast-path: greeting detected, skipping LLM call.")
        return {
            "intent": "greeting",
            "is_agricultural": False,
            "direct_response": _GREETING_RESPONSE,
            "original_query": query_text,
        }


    user_id = getattr(ctx, "user_id", None) or "default_farmer"
    memory_mgr = MemoryManager()
    history = memory_mgr.get_conversation_history(user_id, limit=5)

    history_context = ""
    if history:
        history_context = "\n\nRecent conversation (for context):\n"
        for msg in history[-3:]:
            role = msg.get("role", "user")
            content = str(msg.get("content", ""))[:200]
            history_context += f"{role}: {content}\n"

    ci_prompt = f"User message: {query_text}{history_context}"

    try:
        ci_result = await safe_run_node(ctx, conversation_intelligence_agent, node_input=ci_prompt)
        if ci_result is None:
            logger.warning("CI node: quota exceeded; falling back to agricultural route.")
            return {
                "intent": "agricultural_query",
                "is_agricultural": True,
                "direct_response": None,
                "original_query": query_text,
            }
        ci_text = _extract_node_text(ci_result)

        # Parse the JSON response from CI agent
        json_str = ci_text.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()

        parsed = json.loads(json_str)
        parsed["original_query"] = query_text  # always preserve original verbatim
        return parsed

    except Exception as exc:
        logger.warning(
            "Conversation intelligence classification failed: %s. Defaulting to agricultural route.",
            exc,
        )
        # Safe fallback: route as agricultural so specialist agents always cover it
        return {
            "intent": "agricultural_query",
            "is_agricultural": True,
            "direct_response": None,
            "original_query": query_text,
        }


@node(name="executive_orchestrator", rerun_on_resume=True)
async def executive_orchestrator_node(ctx: Any, node_input: Any) -> AsyncGenerator[Any, None]:
    """
    Central orchestrator: Plans agent execution, runs specialist agents dynamically,
    collects outputs, and synthesizes a final explainable report.
    """
    try:
        query_info = node_input

        # --- Conversational short-circuit (non-agricultural messages from CI layer) ---
        # The CI layer pre-classified this message as a greeting, casual chat, etc.
        # Return the direct response immediately — no specialist agents needed.
        if isinstance(query_info, dict) and query_info.get("is_agricultural") is False:
            direct_response = query_info.get("direct_response") or ""
            if not direct_response:
                direct_response = "I'm here to help! What would you like to know about your farm?"
            yield types.Content(parts=[types.Part.from_text(text=direct_response)])
            return

        # Handle blocked queries from security checkpoint
        if isinstance(query_info, dict) and query_info.get("status") == "blocked":
            yield types.Content(
                parts=[types.Part.from_text(
                    text=f"I'm sorry, but I wasn't able to process that request. {query_info.get('reason', 'Please rephrase and try again.')}"
                )]
            )
            return

        # Extract the sanitized query (prefer 'query' from security checkpoint, fall back to 'original_query' from CI)
        if isinstance(query_info, dict):
            query = query_info.get("query") or query_info.get("original_query", "")
        else:
            query = str(query_info)

        if not query:
            yield types.Content(parts=[types.Part.from_text(text="No query provided.")])
            return

        # --- Memory: Load farm profile and conversation history ---
        user_id = getattr(ctx, "user_id", None) or "default_farmer"
        session_id = ctx.session.id if ctx.session else "default_session"

        memory_mgr = MemoryManager()
        profile = memory_mgr.get_profile(user_id)
        history = memory_mgr.get_conversation_history(user_id, limit=5)

        # Log incoming user message
        memory_mgr.add_message(user_id, session_id, "user", query)

        # --- Phase 1: Planning ---
        yield types.Content(
            parts=[types.Part.from_text(text="[STATE: Planning] Analyzing query and planning agent workflow...\n")]
        )

        plan_prompt = (
            f"User Query: {query}\n"
            f"Farm Profile: {json.dumps(profile, ensure_ascii=False)}\n"
            f"Recent History: {json.dumps(history, ensure_ascii=False)}"
        )

        planner_output = await safe_run_node(ctx, task_planner_agent, node_input=plan_prompt)
        if planner_output is None:
            logger.warning("Planner: quota exceeded; defaulting to [weather, soil_health].")
            agent_names = ["weather", "soil_health"]
        else:
            planner_text = _extract_node_text(planner_output)
            # Parse the JSON agent list from the planner
            try:
                # Strip markdown fences if the model wraps in ```json ... ```
                json_str = planner_text.strip()
                if "```json" in json_str:
                    json_str = json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in json_str:
                    json_str = json_str.split("```")[1].split("```")[0].strip()
                agent_names: list[str] = json.loads(json_str)
                if not isinstance(agent_names, list):
                    raise ValueError("Planner did not return a list")
            except Exception as exc:
                logger.warning("Failed to parse planner output '%s': %s. Using defaults.", planner_text[:200], exc)
                agent_names = ["weather", "soil_health"]

        yield types.Content(
            parts=[types.Part.from_text(text=f"[STATE: Planning] Workflow: {', '.join(agent_names)}\n")]
        )

        # Map agent names to their LlmAgent objects
        agents_map: dict[str, LlmAgent] = {
            "soil_health": soil_health_agent,
            "weather": weather_intelligence_agent,
            "crop_recommendation": crop_recommendation_agent,
            "disease_diagnosis": disease_diagnosis_agent,
            "irrigation_advisor": irrigation_advisor,
            "fertilizer_advisor": fertilizer_advisor,
            "market_price": market_intelligence_agent,
            "gov_schemes": government_schemes_agent,
            "yield_prediction": yield_prediction_agent,
            "proactive_notification": proactive_notification_agent,
        }

        # --- Phase 2: Run Specialist Agents ---
        outputs: dict[str, str] = {}

        for agent_name in agent_names:
            if agent_name not in agents_map:
                logger.warning("Unknown agent name in plan: '%s' — skipping.", agent_name)
                continue

            agent = agents_map[agent_name]
            yield types.Content(
                parts=[types.Part.from_text(text=f"[STATE: Running] Invoking {agent_name.replace('_', ' ').title()} Agent...\n")]
            )

            agent_prompt = (
                f"User Query: {query}\n\n"
                f"Farm Context:\n"
                f"  Location: {profile.get('location', 'Unknown')}\n"
                f"  Soil Profile: NPK={profile.get('soil_npk')}, pH={profile.get('soil_ph')}, Texture={profile.get('soil_texture')}\n"
                f"  Current Crops: {profile.get('crops', [])}\n"
                f"  Farming History: {profile.get('farming_history', [])}\n"
                f"  Previous Diseases: {profile.get('previous_diseases', [])}\n"
                f"  Irrigation Method: {profile.get('irrigation_method', 'Unknown')}\n"
                f"  Preferred Language: {profile.get('preferred_language', 'English')}\n"
            )

            try:
                res = await safe_run_node(ctx, agent, node_input=agent_prompt)
                if res is None:
                    logger.warning("Agent '%s': quota exceeded; recording partial-data notice.", agent_name)
                    outputs[agent_name] = "[quota exceeded — data unavailable for this domain]"
                else:
                    outputs[agent_name] = _extract_node_text(res)
                yield types.Content(
                    parts=[types.Part.from_text(text=f"[STATE: Completed] {agent_name.replace('_', ' ').title()} Agent finished.\n")]
                )
            except Exception as exc:
                logger.error("Agent '%s' failed: %s", agent_name, exc, exc_info=True)
                outputs[agent_name] = f"[Agent unavailable: {exc}]"
                yield types.Content(
                    parts=[types.Part.from_text(text=f"[STATE: Completed] {agent_name.replace('_', ' ').title()} Agent failed (see logs).\n")]
                )

        # --- Phase 3: Decision Synthesis ---
        yield types.Content(
            parts=[types.Part.from_text(text="[STATE: Final Response] Preparing your agricultural advisory...\n")]
        )

        synth_prompt = (
            f"Farmer Query: {query}\n\n"
            f"Farm Profile: {json.dumps(profile, ensure_ascii=False)}\n\n"
            f"Specialist Agent Reports:\n{json.dumps(outputs, indent=2, ensure_ascii=False)}"
        )

        final_report = await safe_run_node(ctx, decision_synthesizer_agent, node_input=synth_prompt)
        if final_report is None:
            logger.warning("Synthesizer: quota exceeded; returning quota error to user.")
            _quota_msg = "⏳ The AI service is currently busy. Please wait a moment and try again."
            memory_mgr.add_message(user_id, session_id, "assistant", _quota_msg)
            yield types.Content(parts=[types.Part.from_text(text=_quota_msg)])
            return
        final_report_text = _extract_node_text(final_report)

        # Persist the full structured report to memory (for history and profile updates)
        memory_mgr.add_message(user_id, session_id, "assistant", final_report_text)

        # Parse the structured report: extract natural_response for display, update profile
        display_text = final_report_text  # fallback to raw JSON if parsing fails
        try:
            report_json_str = final_report_text.strip()
            if "```json" in report_json_str:
                report_json_str = report_json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in report_json_str:
                report_json_str = report_json_str.split("```")[1].split("```")[0].strip()

            report_data = json.loads(report_json_str)

            # Use the natural_response field for the user-facing reply
            natural = report_data.get("natural_response", "")
            if natural and isinstance(natural, str) and natural.strip():
                display_text = natural.strip()

            # Update farm profile with new recommendations (best-effort)
            new_recs = report_data.get("recommendations", [])
            if new_recs:
                existing = profile.get("previous_recommendations", [])
                profile["previous_recommendations"] = (existing + new_recs)[-20:]
                memory_mgr.save_profile(user_id, profile)

        except Exception as exc:
            logger.debug("Could not parse synthesizer report: %s", exc)

        # DIAGNOSTIC: confirm execution reaches here and display_text is a str
        logger.info(
            "[FINAL_YIELD] type=%s repr=%s",
            type(display_text).__name__,
            repr(display_text[:120]),
        )
        # CRITICAL: yield must be types.Content — ADK silently drops plain strings.
        yield types.Content(parts=[types.Part.from_text(text=display_text)])



    except Exception as exc:
        logger.error("Executive orchestrator encountered an unhandled exception: %s", exc, exc_info=True)
        _fallback_msg = "⏳ The AI service is currently busy. Please wait a moment and try again."
        yield types.Content(parts=[types.Part.from_text(text=_fallback_msg)])


# ---------------------------------------------------------------------------
# Workflow Graph Definition
# Static graph: START -> security_checkpoint -> executive_orchestrator
# All specialist agent dispatch happens dynamically inside executive_orchestrator
# via ctx.run_node(), which avoids ADK duplicate-edge validation errors.
# ---------------------------------------------------------------------------

workflow_app = Workflow(
    name="krishimitra_workflow",
    edges=[
        Edge(from_node=START, to_node=conversation_intelligence_node),
        Edge(from_node=conversation_intelligence_node, to_node=security_checkpoint_node),
        Edge(from_node=security_checkpoint_node, to_node=executive_orchestrator_node),
    ],
)

# The root_agent is the workflow graph itself. ADK's App wraps it.
root_agent = workflow_app

app = App(
    root_agent=root_agent,
    name="app",
)
